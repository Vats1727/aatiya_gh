import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

// Express middleware to verify Bearer token and attach user info to req.user
export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach basic user info to request
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
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
