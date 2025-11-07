import express from 'express';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const snap = await db.collection('students').orderBy('createdAt', 'desc').get();
    const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(students);
  } catch (err) {
    console.error('GET /api/students error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Create new student
router.post('/', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const data = req.body || {};
    data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection('students').add(data);
    const snap = await ref.get();
    res.status(201).json({ id: ref.id, data: snap.data() });
  } catch (err) {
    console.error('POST /api/students error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const doc = await db.collection('students').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('GET /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const data = req.body || {};
    data.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('students').doc(id).set(data, { merge: true });
    const doc = await db.collection('students').doc(id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('PUT /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});


// Delete student
router.delete('/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    await db.collection('students').doc(id).delete();
    res.json({ id });
  } catch (err) {
    console.error('DELETE /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Update student status
router.put('/:id/status', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.collection('students').doc(id).update({
      status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const doc = await db.collection('students').doc(id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('PUT /api/students/:id/status error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get student PDF
router.get('/:id/pdf', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const doc = await db.collection('students').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const data = doc.data();
    
    // Send the JSON data for now - in a real app, you'd generate a PDF here
    // You can use libraries like PDFKit or html-pdf to generate actual PDFs
    res.json({ id: doc.id, ...data });
  } catch (err) {
    console.error('GET /api/students/:id/pdf error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get student payments
router.get('/users/:userId/hostels/:hostelId/students/:studentId/payments', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { userId, hostelId, studentId } = req.params;
    const studentRef = db.collection('users').doc(userId)
                        .collection('hostels').doc(hostelId)
                        .collection('students').doc(studentId);
    
    const doc = await studentRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const data = doc.data();
    // Get hostel details for fee information
    const hostelDoc = await db.collection('users').doc(userId)
                             .collection('hostels').doc(hostelId).get();
    const hostelData = hostelDoc.exists ? hostelDoc.data() : {};

    // Use appliedFee if set, otherwise use hostel's monthlyFee
    const feeAmount = data.appliedFee || hostelData.monthlyFee || 0;
    
    // Calculate current month's debit
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyDebit = {
      amount: feeAmount,
      type: 'debit',
      timestamp: monthStart,
      remarks: `Monthly fee for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      mode: 'auto-debit'
    };

    // Combine automatic debits with manual payments
    const allTransactions = [...(data.payments || []), monthlyDebit]
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = allTransactions.map(t => {
      if (t.type === 'debit') {
        runningBalance -= Number(t.amount);
      } else {
        runningBalance += Number(t.amount);
      }
      return { ...t, balance: runningBalance };
    });

    res.json({ 
      id: doc.id,
      studentName: data.studentName,
      currentBalance: runningBalance,
      feeAmount: feeAmount,
      payments: transactionsWithBalance,
      hostelFee: hostelData.monthlyFee,
      appliedFee: data.appliedFee
    });
  } catch (err) {
    console.error('GET /api/students/:id/payments error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Add new payment
router.post('/users/:userId/hostels/:hostelId/students/:studentId/payments', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const payment = req.body;
    
    // Validate payment data
    if (!payment.amount || !payment.mode) {
      return res.status(400).json({ error: 'Amount and mode are required' });
    }

    const docRef = db.collection('students').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const currentData = doc.data();
    const currentBalance = currentData.currentBalance || 0;
    const newBalance = currentBalance + Number(payment.amount);

    // Add timestamp and balance information to payment
    const newPayment = {
      ...payment,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      currentBalance: currentBalance,
      closingBalance: newBalance
    };

    // Update student document with new payment and balance
    await docRef.update({
      currentBalance: newBalance,
      payments: admin.firestore.FieldValue.arrayUnion(newPayment)
    });

    // Get updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    res.json({
      id: updatedDoc.id,
      currentBalance: updatedData.currentBalance,
      payments: updatedData.payments || []
    });

  } catch (err) {
    console.error('POST /api/students/:id/payments error', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;