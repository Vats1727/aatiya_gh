import express from 'express';
import admin from 'firebase-admin';
import { createHostel, createStudent } from '../utils/idGenerator.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

// Export a router factory that accepts a Firestore `db` instance
export default function createHostelsRouter(db) {
  const router = express.Router();

  // Apply auth middleware to all /users routes
  router.use('/users', authMiddleware);

  // Create a hostel for a user
  // POST /api/users/me/hostels
  router.post('/users/me/hostels', async (req, res) => {
    if (!db) return res.status(500).send('Firestore not initialized');
    try {
      // Get user ID from the authenticated request
      const userId = req.user.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Get user data from Firestore to check roles if needed
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      // Optionally check for specific roles or permissions here
      // For example, if you want to restrict who can create hostels:
      // if (userData.role !== 'admin' && userData.role !== 'hostel_owner') {
      //   return res.status(403).json({ error: 'Insufficient permissions' });
      // }
      const data = req.body || {};
      const result = await createHostel(db, userId, data);
      res.status(201).json({ id: result.id, hostelId: result.hostelId, name: result.name, address: result.address });
    } catch (err) {
      console.error('POST /api/users/:userId/hostels error', err);
      res.status(500).json({ error: String(err) });
    }
  });

  // List hostels for a user
  // GET /api/users/:userId/hostels
  router.get('/users/:userId/hostels', async (req, res) => {
    if (!db) return res.status(500).send('Firestore not initialized');
    try {
      let { userId } = req.params;
      if (!userId || userId === 'me') userId = req.user.userId;
      // if requesting another user's hostels, require superadmin
      if (req.user.userId !== userId && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const snap = await db.collection('users').doc(userId).collection('hostels').orderBy('createdAt', 'desc').get();
      const hostels = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json(hostels);
    } catch (err) {
      console.error('GET /api/users/:userId/hostels error', err);
      res.status(500).json({ error: String(err) });
    }
  });

  // Create a student under a hostel (and mirror to top-level students collection)
  // POST /api/users/:userId/hostels/:hostelDocId/students
  router.post('/users/:userId/hostels/:hostelDocId/students', async (req, res) => {
    if (!db) return res.status(500).send('Firestore not initialized');
    try {
      let { userId, hostelDocId } = req.params;
      if (!userId || userId === 'me') userId = req.user.userId;
      if (req.user.userId !== userId && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const data = req.body || {};
      const result = await createStudent(db, userId, hostelDocId, data);
      res.status(201).json({ combinedId: result.combinedId, studentPath: result.studentRef.path, mirroredPath: result.topRef.path });
    } catch (err) {
      console.error('POST /api/users/:userId/hostels/:hostelDocId/students error', err);
      res.status(500).json({ error: String(err) });
    }
  });

  // List students under a hostel
  // GET /api/users/:userId/hostels/:hostelDocId/students
  router.get('/users/:userId/hostels/:hostelDocId/students', async (req, res) => {
    if (!db) return res.status(500).send('Firestore not initialized');
    try {
      let { userId, hostelDocId } = req.params;
      if (!userId || userId === 'me') userId = req.user.userId;
      if (req.user.userId !== userId && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const snap = await db.collection('users').doc(userId).collection('hostels').doc(hostelDocId).collection('students').orderBy('createdAt', 'desc').get();
      const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json(students);
    } catch (err) {
      console.error('GET /api/users/:userId/hostels/:hostelDocId/students error', err);
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
