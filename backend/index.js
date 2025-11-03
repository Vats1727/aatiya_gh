import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import puppeteer from 'puppeteer';

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

    // Build HTML that mirrors the StudentForm print preview
    const buildHtml = (d) => {
      // minimal inline CSS to match print layout
      const css = `
        body { font-family: Arial, sans-serif; color: #111827; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #9ca3af; padding-bottom: 8px; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; color: #111827; margin: 0; }
        .subtitle { font-size: 12px; color: #374151; margin: 0; }
        .grid { display: flex; gap: 16px; margin-bottom: 12px; }
        .photo { width: 140px; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 11px; }
        .section-title { background: #f3e8ff; padding: 6px 8px; font-weight: bold; margin-top: 8px; }
      `;

      const imgTag = (dataUrl, alt) => {
        if (!dataUrl) return `<div style="width:140px;height:140px;border:1px solid #e5e7eb;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af">${alt}</div>`;
        return `<img src="${dataUrl}" class="photo" alt="${alt}" />`;
      };

      return `<!doctype html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">आतिया गर्ल्स हॉस्टल</div>
            <div class="subtitle">ATIYA GIRLS HOSTEL — रामपाड़ा कटिहार</div>
            <div style="font-weight:700;margin-top:6px;">नामांकन फॉर्म / ADMISSION FORM</div>
            <div style="font-size:10px;margin-top:4px;">Date: ${d.admissionDate || ''}</div>
          </div>

          <div class="grid">
            <div style="flex:1">
              <div style="margin-bottom:6px;font-size:12px;font-weight:700">Personal Information</div>
              <div class="info">
                <div><strong>Student Name:</strong> ${d.studentName || ''}</div>
                <div><strong>Mother Name:</strong> ${d.motherName || ''}</div>
                <div><strong>Father Name:</strong> ${d.fatherName || ''}</div>
                <div><strong>DOB:</strong> ${d.dob || ''}</div>
                <div><strong>Mobile 1:</strong> ${d.mobile1 || ''}</div>
                <div><strong>Mobile 2:</strong> ${d.mobile2 || ''}</div>
                <div><strong>Village:</strong> ${d.village || ''}</div>
                <div><strong>Post:</strong> ${d.post || ''}</div>
                <div><strong>Police Station:</strong> ${d.policeStation || ''}</div>
                <div><strong>District:</strong> ${d.district || ''}</div>
                <div><strong>PIN:</strong> ${d.pinCode || ''}</div>
              </div>
            </div>
            <div style="width:160px;text-align:center">
              <div style="margin-bottom:8px;font-weight:700">Parent Photo</div>
              ${imgTag(d.parentPhoto, 'Parent')}
              <div style="height:8px"></div>
              <div style="margin-top:8px;font-weight:700">Student Photo</div>
              ${imgTag(d.studentPhoto, 'Student')}
            </div>
          </div>

          <div class="section-title">Coaching Details</div>
          <div style="font-size:11px;margin-bottom:8px;">
            ${[1,2,3,4].map(i => {
              const name = d[`coaching${i}Name`] || '';
              const addr = d[`coaching${i}Address`] || '';
              return (name || addr) ? `<div><strong>Coaching ${i}:</strong> ${name} ${addr ? '- ' + addr : ''}</div>` : '';
            }).join('')}
          </div>

          <div class="section-title">Allowed Visitors</div>
          <div style="font-size:11px;margin-bottom:8px;">
            ${[1,2,3,4].map(i => d[`allowedPerson${i}`] ? `<div>- ${d[`allowedPerson${i}`]}</div>` : '').join('')}
          </div>

          <div style="margin-top:12px;font-size:11px;">
            <div style="font-weight:700">Affidavit / शपथ पत्र</div>
            <p>I, ${d.parentSignature || ''} (parent), declare that my daughter ${d.studentName || ''}...</p>
          </div>
        </div>
      </body>
      </html>`;
    };

    const html = buildHtml(data);

    // Launch headless browser and render PDF
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF (puppeteer)', err);
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
