import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// -----------------------
// Firebase initialization (support multiple env options)
// -----------------------
let firebaseInitialized = false;
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    console.log('GOOGLE_SERVICE_ACCOUNT_BASE64 found — initializing Firebase');
    const buf = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
    const serviceAccount = JSON.parse(buf.toString('utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseInitialized = true;
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    console.log('GOOGLE_SERVICE_ACCOUNT found — initializing Firebase');
    const serviceAccount = typeof process.env.GOOGLE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
      : process.env.GOOGLE_SERVICE_ACCOUNT;
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseInitialized = true;
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('GOOGLE_APPLICATION_CREDENTIALS set — initializing Firebase using ADC');
    admin.initializeApp();
    firebaseInitialized = true;
  } else {
    // try local file (development)
    const localPath = path.resolve('./backend/serviceAccountKey.json');
    if (fs.existsSync(localPath)) {
      console.log('Local serviceAccountKey.json found — initializing Firebase (dev)');
      const serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      firebaseInitialized = true;
    } else {
      const altLocal = path.resolve('./serviceAccountKey.json');
      if (fs.existsSync(altLocal)) {
        console.log('Local serviceAccountKey.json found at repo root — initializing Firebase (dev)');
        const serviceAccount = JSON.parse(fs.readFileSync(altLocal, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        firebaseInitialized = true;
      }
    }
  }
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK:', err);
}

if (!firebaseInitialized) {
  console.error('Firebase Admin SDK was not initialized. Set GOOGLE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in backend/');
  // Do not exit — allow the server to run in a degraded mode for debugging, but any Firestore calls will fail.
}

const db = admin.firestore ? admin.firestore() : null;

// -----------------------
// Routes: Students CRUD
// -----------------------
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/api/students', async (req, res) => {
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

app.get('/api/students', async (req, res) => {
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

app.get('/api/students/:id', async (req, res) => {
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

app.put('/api/students/:id', async (req, res) => {
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

app.delete('/api/students/:id', async (req, res) => {
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

// Fallback for undefined routes (helps show clear errors instead of HTML)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
