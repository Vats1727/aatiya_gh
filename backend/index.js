const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using service account key in this folder
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK. Make sure serviceAccountKey.json exists and is valid.', err);
  process.exit(1);
}

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Create student
app.post('/api/students', async (req, res) => {
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

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const snap = await db.collection('students').orderBy('createdAt', 'desc').get();
    const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(students);
  } catch (err) {
    console.error('GET /api/students error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get student by id
app.get('/api/students/:id', async (req, res) => {
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
app.put('/api/students/:id', async (req, res) => {
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
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('students').doc(id).delete();
    res.json({ id });
  } catch (err) {
    console.error('DELETE /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
