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

// Import the Firebase Admin SDK
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  initializeFirebase();
}

// Express middleware to verify Firebase ID token and attach user info to req.user
export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No authorization token provided',
      code: 'auth/no-token'
    });
  }
  
  const idToken = auth.split('Bearer ')[1].trim();
  
  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach user info to request
    req.user = {
      userId: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      // Add any additional claims you need
      role: decodedToken.role || 'user' // Default role if not specified
    };
    
    return next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    
    // Handle different types of errors
    let errorMessage = 'Invalid or expired token';
    let errorCode = 'auth/invalid-token';
    
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired';
      errorCode = 'auth/token-expired';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid token format';
      errorCode = 'auth/invalid-token-format';
    }
    
    return res.status(401).json({ 
      error: errorMessage,
      code: errorCode
    });
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
