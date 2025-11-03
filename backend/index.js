import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Firebase admin and firestore reference will be set by initializeFirebase()
let db = null;

function initializeFirebase() {
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
  } else {
    try {
      db = admin.firestore();
      console.log('Firestore initialized');
    } catch (err) {
      console.error('Failed to get Firestore instance:', err);
    }
  }
}

// Initialize Firebase
initializeFirebase();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Health check route
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/api/students', async (req, res) => {
  console.log('POST /api/students incoming, body size:', req.headers['content-length'] || 'unknown');
  console.log('Body preview:', JSON.stringify(req.body).slice(0, 1000));
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const data = req.body || {};
    data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection('students').add(data);
    const snap = await ref.get();
    console.log('Student created with id', ref.id);
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

// Error handling middleware
function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ error: err && err.message ? err.message : String(err) });
}

app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
