import express from 'express';
import admin from 'firebase-admin';
import { authMiddleware } from '../middleware/auth.js';
import QRCode from 'qrcode';
import { db } from '../config/firebase.js';
import { createHostel, createStudent } from '../utils/idGenerator.js';

const router = express.Router();
// Public endpoint: allow anonymous student submissions via hostelDocId but require ownerUserId
// POST /api/public/hostels/:hostelDocId/students
router.post('/public/hostels/:hostelDocId/students', async (req, res) => {
  try {
    const { hostelDocId } = req.params;
    if (!hostelDocId) return res.status(400).json({ success: false, error: 'Missing hostelDocId' });

    const studentData = req.body || {};
    // Prefer explicit ownerUserId passed in query or body
    const ownerUserId = (req.query && req.query.ownerUserId) || (req.body && req.body.ownerUserId) || null;
    if (!ownerUserId) {
      return res.status(400).json({ success: false, error: 'ownerUserId is required for public submissions' });
    }

    // Ensure the hostel exists under the provided owner
    const hostelRef = db.collection('users').doc(ownerUserId).collection('hostels').doc(hostelDocId);
    const hostelSnap = await hostelRef.get();
    if (!hostelSnap.exists) return res.status(404).json({ success: false, error: 'Hostel not found for provided owner' });

    // Use transactional helper to create the student under the owner's hostel
    const result = await createStudent(db, ownerUserId, hostelDocId, studentData);
    // result: { studentRef, combinedId }
    res.status(201).json({ success: true, data: { combinedId: result.combinedId, studentPath: result.studentRef.path } });
  } catch (err) {
    console.error('Error creating public student for hostel:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create student' });
  }
});

// Public endpoint to fetch hostel metadata for anonymous flows (requires ownerUserId query param)
// GET /api/public/hostels/:hostelDocId?ownerUserId=...
router.get('/public/hostels/:hostelDocId', async (req, res) => {
  try {
    const { hostelDocId } = req.params;
    const ownerUserId = req.query && (req.query.ownerUserId || req.query.ownerId);
    if (!hostelDocId || !ownerUserId) return res.status(400).json({ success: false, error: 'Missing hostelDocId or ownerUserId' });

    const hostelRef = db.collection('users').doc(ownerUserId).collection('hostels').doc(hostelDocId);
    const snap = await hostelRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Hostel not found' });

    const data = { id: snap.id, ...snap.data() };
    // Return limited public fields only
    const publicData = {
      id: data.id,
      hostelId: data.hostelId || null,
      name: data.name || null,
      name_en: data.name_en || null,
      name_hi: data.name_hi || null,
      address: data.address || null,
      address_en: data.address_en || null,
      address_hi: data.address_hi || null,
      qrDataUrl: data.qrDataUrl || null
    };
    res.json({ success: true, data: publicData });
  } catch (err) {
    console.error('Error fetching public hostel metadata:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch hostel metadata' });
  }
});

// Use imported auth middleware for protected routes
// (authMiddleware is imported from ../middleware/auth.js)
router.use(authMiddleware);

// Upload QR image for hostel and store hosted URL on the hostel document
// POST /api/users/me/hostels/:hostelId/qr
router.post('/users/me/hostels/:hostelId/qr', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId } = req.params;
    if (!userId || !hostelId) return res.status(400).json({ success: false, error: 'Invalid parameters' });
    // Ensure hostel exists
    const hostelRef = db.collection('users').doc(userId).collection('hostels').doc(hostelId);
    const hostelSnap = await hostelRef.get();
    if (!hostelSnap.exists) return res.status(404).json({ success: false, error: 'Hostel not found' });

    // Generate QR code for the add-student URL
    const publicBase = process.env.PUBLIC_BASE || process.env.FRONTEND_BASE || 'https://aatiya-gh.vercel.app';
    const addUrl = `${publicBase}/hostel/${encodeURIComponent(hostelId)}/add-student?ownerUserId=${encodeURIComponent(userId)}`;

    // Use qrcode to generate a data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(addUrl, { width: 360, margin: 1 });

    // Persist QR data url on hostel document so it can be re-used
    await hostelRef.update({ qrDataUrl, qrUpdatedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ success: true, data: { qrDataUrl } });
  } catch (error) {
    console.error('Error uploading hostel QR:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate QR' });
  }
});
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
    // Pass through additional bilingual and config fields if provided
    const payload = {
      name,
      address,
      name_hi: req.body.name_hi || null,
      address_hi: req.body.address_hi || null,
      monthlyFee: (req.body.monthlyFee != null ? Number(req.body.monthlyFee) : null),
      monthlyFeeCurrency: req.body.monthlyFeeCurrency || null,
      qrDataUrl: req.body.qrDataUrl || null,
      meta: req.body.meta || null
    };
    const created = await createHostel(db, userId, payload);

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

// Update hostel details: PUT /api/users/me/hostels/:hostelId
router.put('/users/me/hostels/:hostelId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId } = req.params;
    if (!userId || !hostelId) return res.status(400).json({ success: false, error: 'Invalid parameters' });

    const payload = req.body || {};
    const hostelRef = db.collection('users').doc(userId).collection('hostels').doc(hostelId);
    const snap = await hostelRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Hostel not found' });

    await hostelRef.update({ ...payload, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    const updated = (await hostelRef.get()).data();
    res.json({ success: true, data: { id: hostelId, ...updated } });
  } catch (error) {
    console.error('Error updating hostel:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update hostel' });
  }
});

// Delete hostel (and its students) under the user: DELETE /api/users/me/hostels/:hostelId
router.delete('/users/me/hostels/:hostelId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId } = req.params;
    if (!userId || !hostelId) return res.status(400).json({ success: false, error: 'Invalid parameters' });

    const hostelRef = db.collection('users').doc(userId).collection('hostels').doc(hostelId);
    const snap = await hostelRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Hostel not found' });

    // Delete students under the hostel
    const studentsSnap = await hostelRef.collection('students').get();
    const batch = db.batch();
    studentsSnap.docs.forEach(d => batch.delete(d.ref));
    // delete hostel doc
    batch.delete(hostelRef);
    await batch.commit();

    res.json({ success: true, data: { id: hostelId } });
  } catch (error) {
    console.error('Error deleting hostel:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete hostel' });
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

// Payments: list payments for a student
// GET /api/users/me/hostels/:hostelId/students/:studentId/payments
router.get('/users/me/hostels/:hostelId/students/:studentId/payments', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId, studentId } = req.params;
    if (!userId || !hostelId || !studentId) return res.status(400).json({ success: false, error: 'Invalid parameters' });

    const paymentsSnap = await db.collection('users')
      .doc(userId)
      .collection('hostels')
      .doc(hostelId)
      .collection('students')
      .doc(studentId)
      .collection('payments')
      .orderBy('timestamp', 'desc')
      .get();

    const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch payments' });
  }
});

// Payments: add a payment record and update student's currentBalance
// POST /api/users/me/hostels/:hostelId/students/:studentId/payments
router.post('/users/me/hostels/:hostelId/students/:studentId/payments', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { hostelId, studentId } = req.params;
    const { amount, paymentMode, remarks, type, timestamp } = req.body || {};

    if (!userId || !hostelId || !studentId) return res.status(400).json({ success: false, error: 'Invalid parameters' });
    const amt = parseInt(amount, 10) || 0;
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ success: false, error: 'Invalid amount' });
    if (!['credit', 'debit'].includes(type)) return res.status(400).json({ success: false, error: 'Invalid payment type' });

    const studentRef = db.collection('users').doc(userId).collection('hostels').doc(hostelId).collection('students').doc(studentId);

    // Use transaction to atomically write payment and update balance
    const result = await db.runTransaction(async (tx) => {
      const sSnap = await tx.get(studentRef);
      if (!sSnap.exists) throw new Error('Student not found');

      const sData = sSnap.data();
      const currentBalance = (sData && (sData.currentBalance != null ? sData.currentBalance : (sData.appliedFee != null ? sData.appliedFee : (sData.monthlyFee != null ? sData.monthlyFee : 0)))) || 0;

      // credit reduces balance (payment received), debit increases balance (refund)
      const newBalance = type === 'credit' ? (currentBalance - amt) : (currentBalance + amt);

      const paymentRef = studentRef.collection('payments').doc();
      const paymentPayload = {
        amount: amt,
        paymentMode: paymentMode || 'cash',
        remarks: remarks || '',
        type,
        timestamp: timestamp || new Date().toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      tx.set(paymentRef, paymentPayload);
      tx.update(studentRef, { currentBalance: newBalance, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

      return { paymentId: paymentRef.id, paymentPayload, newBalance };
    });

    // fetch updated student to return
    const updatedSnap = await db.collection('users').doc(req.user.uid).collection('hostels').doc(hostelId).collection('students').doc(studentId).get();
    res.json({ success: true, data: { payment: { id: result.paymentId, ...result.paymentPayload }, student: { id: updatedSnap.id, ...updatedSnap.data() } } });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to add payment' });
  }
});

export default router;
