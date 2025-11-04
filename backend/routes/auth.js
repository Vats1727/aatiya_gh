import express from 'express';
import initializeFirebase, { db } from '../config/firebase.js';
import { hashPassword, comparePassword, signToken } from '../middleware/auth.js';
import admin from 'firebase-admin';

const router = express.Router();

// Register a new user (admin or superadmin)
// POST /api/auth/register
// body: { fullName, username, password, role }
router.post('/register', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
  try {
    const { fullName, username, password, role } = req.body || {};
    if (!fullName || !username || !password) return res.status(400).json({ error: 'Missing fields' });
    const roleVal = role === 'superadmin' ? 'superadmin' : 'admin';

    // ensure username uniqueness
    const q = await db.collection('users').where('username', '==', username).limit(1).get();
    if (!q.empty) return res.status(400).json({ error: 'Username already exists' });

    const pwdHash = hashPassword(password);
    const userRef = await db.collection('users').add({
      fullName,
      username,
      passwordHash: pwdHash,
      role: roleVal,
      nextHostelSeq: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const user = { id: userRef.id, fullName, username, role: roleVal };
    const token = signToken({ userId: userRef.id, role: roleVal, username });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('POST /api/auth/register error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Login endpoint
// POST /api/auth/login
// body: { username, password }
router.post('/login', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const q = await db.collection('users').where('username', '==', username).limit(1).get();
    if (q.empty) return res.status(401).json({ error: 'Invalid credentials' });
    const doc = q.docs[0];
    const data = doc.data();
    if (!comparePassword(password, data.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });

    const user = { id: doc.id, fullName: data.fullName, username: data.username, role: data.role };
    const token = signToken({ userId: doc.id, role: data.role, username: data.username });
    res.json({ user, token });
  } catch (err) {
    console.error('POST /api/auth/login error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get current user info (requires token)
import { authMiddleware } from '../middleware/auth.js';
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userDoc = await db.collection('users').doc(req.user.userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const d = userDoc.data();
    res.json({ id: userDoc.id, fullName: d.fullName, username: d.username, role: d.role });
  } catch (err) {
    console.error('GET /api/auth/me error', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
