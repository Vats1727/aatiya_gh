// Single clean backend server (Express + Firestore + pdfkit)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import PDFDocument from 'pdfkit';

dotenv.config();

let db = null;

function initializeFirebase() {
  let initialized = false;
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      const buf = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
      const sa = JSON.parse(buf.toString('utf8'));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      initialized = true;
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      const sa = typeof process.env.GOOGLE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
        : process.env.GOOGLE_SERVICE_ACCOUNT;
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      initialized = true;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Let SDK pick up credentials via ADC
      admin.initializeApp();
      initialized = true;
    } else {
      const localPaths = [path.resolve('./backend/serviceAccountKey.json'), path.resolve('./serviceAccountKey.json')];
      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          const sa = JSON.parse(fs.readFileSync(p, 'utf8'));
          admin.initializeApp({ credential: admin.credential.cert(sa) });
          initialized = true;
          break;
        }
      }
    }
  } catch (err) {
    console.error('Failed to init Firebase Admin SDK:', err);
  }

  if (initialized) {
    try { db = admin.firestore(); console.log('Firestore initialized'); } catch (e) { console.error('Failed to get Firestore:', e); }
  } else {
    console.error('Firebase not initialized. Set GOOGLE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in backend/');
  }
}

initializeFirebase();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Create student
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

// List students
app.get('/api/students', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const snap = await db.collection('students').orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    console.error('GET /api/students error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get student
app.get('/api/students/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const snap = await db.collection('students').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('GET /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Update (merge)
app.put('/api/students/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const updates = req.body || {};
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('students').doc(req.params.id).set(updates, { merge: true });
    const snap = await db.collection('students').doc(req.params.id).get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('PUT /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Delete
app.delete('/api/students/:id', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    await db.collection('students').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/students/:id error', err);
    res.status(500).json({ error: String(err) });
  }
});

// PDF generator (server-side, pdfkit)
app.get('/api/students/:id/pdf', async (req, res) => {
  if (!db) return res.status(500).send('Firestore not initialized');
  try {
    const id = req.params.id;
    const snap = await db.collection('students').doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() || {};

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-${id}.pdf`);
    doc.pipe(res);

    const decodeDataUrl = (durl) => {
      if (!durl || typeof durl !== 'string') return null;
      const m = String(durl).match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (!m) return null;
      return Buffer.from(m[2], 'base64');
    };

    // Header
    doc.font('Helvetica-Bold').fontSize(22).text('आतिया गर्ल्स हॉस्टल', { align: 'center' });
    doc.font('Helvetica').fontSize(10).text('नामांकन फॉर्म / ADMISSION FORM', { align: 'center' });
    doc.moveDown(0.5);

    // photos
    const imgW = 120, imgH = 120, gap = 20;
    const left = doc.page.margins.left;
    const right = left + imgW + gap;
    const imgY = doc.y;
    doc.rect(left, imgY, imgW, imgH).stroke();
    doc.rect(right, imgY, imgW, imgH).stroke();
    const parentBuf = decodeDataUrl(data.parentPhoto);
    const studentBuf = decodeDataUrl(data.studentPhoto);
    try { if (parentBuf) doc.image(parentBuf, left + 6, imgY + 6, { fit: [imgW - 12, imgH - 12] }); } catch (e) {}
    try { if (studentBuf) doc.image(studentBuf, right + 6, imgY + 6, { fit: [imgW - 12, imgH - 12] }); } catch (e) {}
    doc.moveDown(8);

    doc.font('Helvetica-Bold').fontSize(11).text('छात्रा का नाम: ' + (data.studentName || ''));
    doc.font('Helvetica').text('पिता का नाम: ' + (data.fatherName || ''));
    doc.font('Helvetica').text('माता का नाम: ' + (data.motherName || ''));

    // short affidavit page
    doc.addPage();
    doc.font('Helvetica-Bold').text('शपथ पत्र', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').text('हॉस्टल के नियमों का पालन किया जाएगा।');

    doc.end();
  } catch (err) {
    console.error('PDF generation error', err);
    res.status(500).json({ error: String(err) });
  }
});

// fallback handlers
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: String(err) }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
