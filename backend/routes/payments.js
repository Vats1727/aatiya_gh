import express from 'express';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Payment document shape (stored in top-level 'payments' collection):
// {
//   student_id: '<studentDocId>',
//   hostel_id: '<hostelDocId>',
//   owner_user_id: '<ownerUserId>',
//   amount: Number,
//   type: 'credit' | 'debit',
//   status: 'pending' | 'paid',
//   month: 'Nov-2025',
//   remarks: 'string',
//   created_at: Timestamp
// }

// Create a new payment (protected - admin/owner should call this)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user && (req.user.userId || req.user.uid);
    const payload = req.body || {};
    const { student_id, hostel_id, amount, type, remarks, month } = payload;
    if (!student_id || !hostel_id || typeof amount === 'undefined' || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // owner_user_id is the authenticated user unless provided explicitly (for superadmin)
    const owner_user_id = payload.owner_user_id || userId || null;

    const doc = {
      student_id: String(student_id),
      hostel_id: String(hostel_id),
      owner_user_id: owner_user_id,
      amount: Number(amount),
      type: String(type).toLowerCase(),
      status: payload.status || (String(type).toLowerCase() === 'credit' ? 'paid' : 'pending'),
      month: month || null,
      remarks: remarks || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection('payments').add(doc);
    const snap = await ref.get();
    return res.status(201).json({ success: true, data: { id: ref.id, ...snap.data() } });
  } catch (err) {
    console.error('Error creating payment:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to create payment' });
  }
});

// Get payments for a student (public)
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ success: false, error: 'Missing studentId' });

    const q = await db.collection('payments').where('student_id', '==', String(studentId)).orderBy('created_at', 'desc').get();
    const payments = q.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, data: payments });
  } catch (err) {
    console.error('Error fetching payments for student', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch payments' });
  }
});

export default router;
