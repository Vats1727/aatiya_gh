import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import PDFDocument from 'pdfkit';

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

// Get single student by ID
app.get('/api/students/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const docRef = db.collection('students').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('GET /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Generate PDF for a student and stream as attachment
app.get('/api/students/:id/pdf', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const docRef = db.collection('students').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() || {};

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-${id}.pdf`);
    doc.pipe(res);

    // Title
    doc.fontSize(18).text('आतिया गर्ल्स हॉस्टल - Admission Form', { align: 'center' });
    doc.moveDown(0.5);

    // Photos (parent then student) if available
    const drawImageFromDataUrl = (dataUrl, x, y, opts = {}) => {
      try {
        const m = String(dataUrl).match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
        if (!m) return false;
        const buf = Buffer.from(m[2], 'base64');
        doc.image(buf, x, y, opts);
        return true;
      } catch (err) {
        console.warn('Failed to draw image', err);
        return false;
      }
    };

    const startY = doc.y;
    // Try to place images side by side
    const imgBoxW = 120;
    const gap = 20;
    const leftX = doc.page.margins.left;
    const rightX = leftX + imgBoxW + gap;

    if (data.parentPhoto) drawImageFromDataUrl(data.parentPhoto, leftX, startY, { fit: [imgBoxW, imgBoxW], align: 'center' });
    if (data.studentPhoto) drawImageFromDataUrl(data.studentPhoto, rightX, startY, { fit: [imgBoxW, imgBoxW], align: 'center' });

    // Move cursor below images
    doc.moveDown(6);

    // Key fields
    const p = (label, value) => {
      doc.fontSize(11).font('Helvetica-Bold').text(label + ': ', { continued: true });
      doc.font('Helvetica').text(value || '');
    };

    p('Student Name', data.studentName || '');
    p('Mother Name', data.motherName || '');
    p('Father Name', data.fatherName || '');
    p('Date of Birth', data.dob || '');
    p('Mobile 1', data.mobile1 || '');
    p('Mobile 2', data.mobile2 || '');
    p('Village', data.village || '');
    p('Post', data.post || '');
    p('Police Station', data.policeStation || '');
    p('District', data.district || '');
    p('Pin Code', data.pinCode || '');
    doc.moveDown(0.5);

    // Coaching info
    doc.fontSize(12).font('Helvetica-Bold').text('Coaching Details');
    doc.moveDown(0.25);
    for (let i = 1; i <= 4; i++) {
      const name = data[`coaching${i}Name`];
      const addr = data[`coaching${i}Address`];
      if (name || addr) {
        doc.fontSize(10).font('Helvetica-Bold').text(`Coaching ${i}: `, { continued: true });
        doc.font('Helvetica').text(`${name || ''} ${addr ? '- ' + addr : ''}`);
      }
    }

    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Allowed Visitors');
    doc.moveDown(0.25);
    for (let i = 1; i <= 4; i++) {
      const ap = data[`allowedPerson${i}`];
      if (ap) doc.fontSize(10).font('Helvetica').text(`- ${ap}`);
    }

    doc.addPage();
    doc.fontSize(14).text('Affidavit / शपथ पत्र', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`I, ${data.parentSignature || ''} (parent), declare that my daughter ${data.studentName || ''} ...`);

    // finalize
    doc.end();
  } catch (err) {
    console.error('Error generating PDF', err);
    res.status(500).json({ error: String(err) });
  }
});

// Update (merge) student by ID
app.put('/api/students/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    const updates = req.body || {};
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const docRef = db.collection('students').doc(id);
    await docRef.set(updates, { merge: true });
    const snap = await docRef.get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('PUT /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Delete student by ID
app.delete('/api/students/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const { id } = req.params;
    await db.collection('students').doc(id).delete();
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/students/:id error', err);
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
