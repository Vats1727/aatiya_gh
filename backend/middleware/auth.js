import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import initializeFirebase, { db } from '../config/firebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret-in-prod';
const JWT_EXPIRES = '7d';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Verify token either as Firebase ID token or as our JWT fallback
export async function verifyAnyToken(token) {
  // try Firebase ID token first
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { provider: 'firebase', decoded };
  } catch (fbErr) {
    // not a firebase token — try JWT
    try {
      const decodedJwt = jwt.verify(token, JWT_SECRET);
      return { provider: 'jwt', decoded: decodedJwt };
    } catch (jwtErr) {
      // rethrow original firebase error for logging
      throw fbErr;
    }
  }
}

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  initializeFirebase();
}

// Express middleware to verify Firebase ID token and attach user info to req.user
export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No authorization header provided',
      code: 'auth/no-token'
    });
  }

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization header format', code: 'auth/invalid-format' });
  }

  const token = parts[1].trim();
  try {
    const { provider, decoded } = await verifyAnyToken(token);
    if (provider === 'firebase') {
      req.user = {
        userId: decoded.uid,
        uid: decoded.uid,
        email: decoded.email,
        email_verified: decoded.email_verified,
        role: decoded.role || 'user'
      };
    } else {
      // jwt payload
      req.user = {
        userId: decoded.userId || decoded.uid,
        uid: decoded.userId || decoded.uid,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    }
    return next();
  } catch (error) {
    console.error('Error verifying token (authMiddleware):', error && (error.message || error));
    // Distinguish firebase auth errors
    if (error && error.code && String(error.code).startsWith('auth/')) {
      return res.status(401).json({ error: 'Invalid Firebase ID token', code: error.code, message: error.message });
    }
    return res.status(401).json({ error: 'Invalid or expired token', code: 'auth/invalid-token' });
  }
}

// role can be a string or array of allowed roles
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export default { authMiddleware, requireRole, hashPassword, comparePassword, signToken };
