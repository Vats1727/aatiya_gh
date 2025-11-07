import express from 'express';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Payments are stored under: users/{ownerUserId}/hostels/{hostelId}/students/{studentId}/payments/{paymentId}

// Create a new payment (protected - admin/owner should call this)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.user && (req.user.userId || req.user.uid);
    const requesterRole = req.user && req.user.role;
    const payload = req.body || {};
    const { student_id, hostel_id, amount, type, remarks, month, owner_user_id } = payload;
    if (!student_id || !hostel_id || typeof amount === 'undefined' || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // If owner_user_id is explicitly provided, only allow superadmin to act on behalf of others
    let ownerUserId = owner_user_id || requesterId;
    if (owner_user_id && owner_user_id !== requesterId && requesterRole !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Forbidden to create payment for another owner' });
    }

    const doc = {
      student_id: String(student_id),
      hostel_id: String(hostel_id),
      owner_user_id: ownerUserId,
      amount: Number(amount),
      type: String(type).toLowerCase(),
      status: payload.status || (String(type).toLowerCase() === 'credit' ? 'paid' : 'pending'),
      month: month || null,
      remarks: remarks || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Write payment under the student's payments subcollection
    const studentRef = db.collection('users').doc(ownerUserId)
      .collection('hostels').doc(String(hostel_id))
      .collection('students').doc(String(student_id));

    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) {
      return res.status(404).json({ success: false, error: 'Student not found under provided owner/hostel' });
    }

    const paymentsRef = studentRef.collection('payments');
    const ref = await paymentsRef.add(doc);
    const snap = await ref.get();
    return res.status(201).json({ success: true, data: { id: ref.id, ...snap.data() } });
  } catch (err) {
    console.error('Error creating payment:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to create payment' });
  }
});

// Get payments for a student (protected)
// Requires auth. If requester is owner, will read payments under their user. If requester is superadmin, ownerUserId can be provided via query.
router.get('/:studentId', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { hostelId } = req.query;
    if (!studentId) return res.status(400).json({ success: false, error: 'Missing studentId' });
    if (!hostelId) return res.status(400).json({ success: false, error: 'Missing hostelId query parameter' });

    const requesterId = req.user && (req.user.userId || req.user.uid);
    const requesterRole = req.user && req.user.role;

    // Determine ownerUserId: superadmin can pass ownerUserId query param; otherwise use requesterId
    let ownerUserId = req.query.ownerUserId || req.query.ownerId || requesterId;
    if ((req.query.ownerUserId || req.query.ownerId) && requesterRole !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Forbidden to query payments for another owner' });
    }

    // Load payments from nested payments collection
    const paymentsSnap = await db.collection('users').doc(ownerUserId)
      .collection('hostels').doc(String(hostelId))
      .collection('students').doc(String(studentId))
      .collection('payments')
      .orderBy('created_at', 'desc')
      .get();

    if (!paymentsSnap) return res.json({ success: true, data: [] });
    const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, data: payments });
  } catch (err) {
    console.error('Error fetching payments for student', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch payments' });
  }
});

export default router;
