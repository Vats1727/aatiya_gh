import express from 'express';
import admin from 'firebase-admin';
import { verifyAnyToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { createHostel, createStudent } from '../utils/idGenerator.js';

const router = express.Router();

// Apply auth middleware to all routes
const authMiddleware = async (req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { provider, decoded } = await verifyAnyToken(token);
    if (provider === 'firebase') {
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    } else {
      // JWT payload expected to contain userId and role
      req.user = {
        uid: decoded.userId || decoded.uid,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    }
    return next();
  } catch (err) {
    console.error('Error verifying token (any):', err);
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
};

router.use(authMiddleware);

// Get hostels with student counts for the current user
router.get('/users/me/hostels', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get all hostels for the current user
    const hostelsSnapshot = await db.collection('users').doc(userId).collection('hostels').get();
    
    const hostels = [];
    
    // Get student counts for each hostel
    for (const doc of hostelsSnapshot.docs) {
      const hostelData = doc.data();
      const studentsSnapshot = await db.collection('users')
        .doc(userId)
        .collection('hostels')
        .doc(doc.id)
        .collection('students')
        .get();
      
      hostels.push({
        id: doc.id,
        ...hostelData,
        studentCount: studentsSnapshot.size
      });
    }
    
    res.json({ success: true, data: hostels });
  } catch (error) {
    console.error('Error fetching hostels:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch hostels',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new hostel
// Legacy top-level /hostels endpoint removed in favor of nested users/{userId}/hostels
// Use POST /users/:userId/hostels (below) to create hostels under a user.

// Create a hostel for a specific user: POST /api/users/:userId/hostels
router.post('/users/:userId/hostels', async (req, res) => {
  try {
    const { name, address } = req.body;
    let userId = req.params.userId;

    if (userId === 'me') userId = req.user && req.user.uid;
    // only allow creating for self or superadmin
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }
    if (req.user.uid !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'Name and address are required' });
    }

    // Create hostel under users/{userId}/hostels using transactional helper
    const created = await createHostel(db, userId, { name, address });

    // created: { id: <docId>, hostelId, name, address, createdAt, nextStudentSeq, meta }
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating hostel for user:', error);
    // Return the error message to the client to make debugging easier.
    res.status(500).json({ success: false, error: error.message || 'Failed to create hostel' });
  }
});

// Get all hostels for the authenticated user
router.get('/hostels', async (req, res) => {
  try {
    const userId = req.user.uid;
    // Read hostels from users/{userId}/hostels
    const hostelsSnap = await db.collection('users').doc(userId).collection('hostels').orderBy('createdAt', 'desc').get();
    const hostels = hostelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: hostels });

  } catch (error) {
    console.error('Error fetching hostels:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch hostels' });
  }
});

// Get hostels for a specific user: GET /api/users/:userId/hostels
router.get('/users/:userId/hostels', async (req, res) => {
  try {
    let userId = req.params.userId;
    if (userId === 'me') userId = req.user && req.user.uid;
    if (!userId) return res.status(400).json({ success: false, error: 'Invalid userId' });
    // allow only self or superadmin
    if (req.user.uid !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    // Read hostels from users/{userId}/hostels subcollection
    const hostelsSnap = await db.collection('users').doc(userId).collection('hostels').orderBy('createdAt', 'desc').get();
    const hostels = hostelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: hostels });
  } catch (error) {
    console.error('Error fetching hostels for user:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch hostels' });
  }
});

// Create a student under a user's hostel: POST /api/users/:userId/hostels/:hostelDocId/students
router.post('/users/:userId/hostels/:hostelDocId/students', async (req, res) => {
  try {
    let userId = req.params.userId;
    const hostelDocId = req.params.hostelDocId;
    if (userId === 'me') userId = req.user && req.user.uid;
    if (!userId || !hostelDocId) return res.status(400).json({ success: false, error: 'Invalid parameters' });
    // allow only self or superadmin
    if (req.user.uid !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const studentData = req.body || {};

    const result = await createStudent(db, userId, hostelDocId, studentData);
    // result: { studentRef, combinedId }
    res.status(201).json({ success: true, data: { combinedId: result.combinedId, studentPath: result.studentRef.path } });
  } catch (error) {
    console.error('Error creating student for hostel:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create student' });
  }
});

// Get students for a specific hostel
router.get('/users/me/hostels/:hostelId/students', async (req, res) => {
  try {
    const { hostelId } = req.params;
    const userId = req.user.uid;
    
    const studentsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('hostels')
      .doc(hostelId)
      .collection('students')
      .get();
    
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch students',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a student's status within a specific hostel: PUT /api/users/me/hostels/:hostelId/students/:studentId/status
// Update a student's data within a specific hostel:
// PUT /api/users/me/hostels/:hostelId/students/:studentId
router.put('/users/me/hostels/:hostelId/students/:studentId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId, studentId } = req.params;
    if (!userId || !hostelId || !studentId) return res.status(400).json({ success: false, error: 'Invalid parameters' });

    const payload = req.body || {};
    const studentRef = db
      .collection('users').doc(userId)
      .collection('hostels').doc(hostelId)
      .collection('students').doc(studentId);

    const snap = await studentRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Student not found' });

    // Merge payload and set updatedAt timestamp
    await studentRef.update({ ...payload, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    const updatedSnap = await studentRef.get();
    res.json({ success: true, data: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (error) {
    console.error('Error updating student data:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update student' });
  }
});

// Delete a student within a specific hostel: DELETE /api/users/me/hostels/:hostelId/students/:studentId
router.delete('/users/me/hostels/:hostelId/students/:studentId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId, studentId } = req.params;
    if (!userId || !hostelId || !studentId) return res.status(400).json({ success: false, error: 'Invalid parameters' });

    const studentRef = db.collection('users').doc(userId).collection('hostels').doc(hostelId).collection('students').doc(studentId);
    const snap = await studentRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Student not found' });

    await studentRef.delete();
    res.json({ success: true, data: { id: studentId } });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete student' });
  }
});

// Get a single student under a hostel (useful for edit/download): GET /api/users/me/hostels/:hostelId/students/:studentId
router.get('/users/me/hostels/:hostelId/students/:studentId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId, studentId } = req.params;
    if (!userId || !hostelId || !studentId) return res.status(400).json({ success: false, error: 'Invalid parameters' });

    const studentRef = db.collection('users').doc(userId).collection('hostels').doc(hostelId).collection('students').doc(studentId);
    const snap = await studentRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Student not found' });

    res.json({ success: true, data: { id: snap.id, ...snap.data() } });
  } catch (error) {
    console.error('Error fetching single student:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch student' });
  }
});

export default router;
