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

    // Create PDF matching StudentForm print layout
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-${id}.pdf`);
    doc.pipe(res);

    // Helpers
    const drawImageFromDataUrl = (dataUrl, opts = {}) => {
      try {
        const m = String(dataUrl).match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
        if (!m) return null;
        const buf = Buffer.from(m[2], 'base64');
        return buf;
      } catch (err) {
        console.warn('Failed to decode image', err);
        return null;
      }
    };

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#111827').text('आतिया गर्ल्स हॉस्टल', { align: 'center' });
    doc.fontSize(14).font('Helvetica').fillColor('#374151').text('ATIYA GIRLS HOSTEL', { align: 'center' });
    doc.moveDown(0.25);
    doc.fontSize(10).text('रामपाड़ा कटिहार / Rampada Katihar', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(13).font('Helvetica-Bold').text('नामांकन फॉर्म / ADMISSION FORM', { align: 'center' });
    doc.moveDown(0.25);
    doc.fontSize(9).text(`Date: ${data.admissionDate || ''}`, { align: 'right' });
    doc.moveDown(0.5);

    // Photos side by side
    const imgSize = 110;
    const startX = doc.x;
    const leftImg = data.parentPhoto ? drawImageFromDataUrl(data.parentPhoto) : null;
    const rightImg = data.studentPhoto ? drawImageFromDataUrl(data.studentPhoto) : null;
    if (leftImg) {
      try { doc.image(leftImg, startX, doc.y, { fit: [imgSize, imgSize], align: 'center' }); } catch (e) {}
    }
    if (rightImg) {
      try { doc.image(rightImg, startX + imgSize + 20, doc.y, { fit: [imgSize, imgSize], align: 'center' }); } catch (e) {}
    }
    doc.moveDown(6);

    // Personal Information grid (two columns)
    const info = [
      ['छात्रा का नाम / Student Name', data.studentName || ''],
      ['माता का नाम / Mother\'s Name', data.motherName || ''],
      ['पिता का नाम / Father\'s Name', data.fatherName || ''],
      ['जन्म तिथि / Date of Birth', data.dob || '']
    ];
    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2 - 10;
    for (let i = 0; i < info.length; i += 2) {
      const left = info[i];
      const right = info[i+1];
      const yBefore = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).text(left[0] + ':', { continued: true, width: colWidth });
      doc.font('Helvetica').text(' ' + (left[1] || ''), { width: colWidth });
      if (right) {
        // move up to same line
        const xPos = doc.x;
        const savedY = yBefore;
        doc.y = savedY;
        doc.x = doc.page.margins.left + colWidth + 20;
        doc.font('Helvetica-Bold').fontSize(10).text(right[0] + ':', { continued: true, width: colWidth });
        doc.font('Helvetica').text(' ' + (right[1] || ''), { width: colWidth });
        doc.moveDown(0.5);
        // reset x
        doc.x = doc.page.margins.left;
      }
    }

    doc.moveDown(0.5);
    // Contact Information
    doc.fontSize(11).font('Helvetica-Bold').text('संपर्क जानकारी / Contact Information');
    doc.moveDown(0.25);
    doc.font('Helvetica-Bold').text('मोबाइल नं (1):', { continued: true }); doc.font('Helvetica').text(' ' + (data.mobile1 || ''));
    doc.font('Helvetica-Bold').text('मोबाइल नं (2):', { continued: true }); doc.font('Helvetica').text(' ' + (data.mobile2 || 'N/A'));
    doc.moveDown(0.5);

    // Address
    doc.fontSize(11).font('Helvetica-Bold').text('स्थायी पता / Permanent Address');
    doc.moveDown(0.25);
    const addr = [
      ['ग्राम', data.village || ''],
      ['पोस्ट', data.post || ''],
      ['थाना', data.policeStation || ''],
      ['जिला', data.district || ''],
      ['पिन कोड', data.pinCode || '']
    ];
    addr.forEach(([label, val]) => {
      doc.font('Helvetica-Bold').text(label + ':', { continued: true });
      doc.font('Helvetica').text(' ' + (val || ''));
    });

    doc.moveDown(0.5);
    // Allowed Visitors
    doc.fontSize(11).font('Helvetica-Bold').text('छात्रा से मिलने वाले का नाम / Allowed Visitors');
    doc.moveDown(0.25);
    for (let i = 1; i <= 4; i++) {
      const ap = data[`allowedPerson${i}`];
      if (ap) doc.font('Helvetica').text(`${i}. ${ap}`);
    }

    doc.moveDown(0.5);
    // Coaching Details
    doc.fontSize(11).font('Helvetica-Bold').text('कोचिंग विवरण / Coaching Details');
    doc.moveDown(0.25);
    for (let i = 1; i <= 4; i++) {
      const name = data[`coaching${i}Name`];
      const addr = data[`coaching${i}Address`];
      if (name || addr) {
        doc.font('Helvetica-Bold').text(`कोचिंग ${i}: `, { continued: true });
        doc.font('Helvetica').text(`${name || ''} ${addr ? '- ' + addr : ''}`);
      }
    }

    doc.moveDown(0.5);
    // Signatures
    doc.fontSize(10).text('');
    const sigY = doc.y;
    doc.text(' ', { continued: false });
    // Left signature (student)
    doc.moveDown(2);
    doc.font('Helvetica').text(`Student Signature: ${data.studentSignature || ''}`);
    doc.moveUp(1);
    doc.x = doc.page.width / 2;
    doc.font('Helvetica').text(`Parent Signature: ${data.parentSignature || ''}`);

    // Page break and Affidavit / Rules (mirror StudentForm)
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('शपथ पत्र', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`मैं ${data.parentSignature || ''} अपनी पुत्री / बहन ${data.studentName || ''} ग्राम ${data.village || ''} पो॰ ${data.post || ''} थाना ${data.policeStation || ''} जिला ${data.district || ''} को अपना मर्ज़ी से आतिया गर्ल्स हॉस्टल में रख रहा हूँ। मैं और मेरी पुत्री / बहन यह ${data.admissionDate || ''} शपथ लेते हैं कि हॉस्टल के निम्नलिखित नियमों का पालन करेंगे।`);
    doc.moveDown(0.5);
    const rules = [
      'हॉस्टल से बाहर निकलने के पूर्व का आने के समय हॉस्टल इंचार्ज से अनुमति लेने अनिवार्य होगा।',
      'कोचिंग का समय प्राप्त होने के 30 मिनट पूर्व हॉस्टल से निकलना एवं कोचिंग के समाप्त होने पर 30 मिनट के अंदर हॉस्टल वापस आना अनिवार्य होगा।',
      'हॉस्टल के अन्दर साफाई का विधि। स्वयं रखना।',
      'हॉस्टल से निकलने के पूर्व पक्का एवं बर्त्ती को बंद करना अनिवार्य है नहीं करने पर 50 रुपया दंड लगेगा।',
      'हॉस्टल से निकलने के बाद मेरी पुत्री अगर भाग जाती हैं तो इसके लिये हॉस्टल जिम्मेदार नहीं होगा।',
      'हॉस्टल _____ प्रत्येक हर महीने के 01 तारिख से 05 तारिख तक जमा करना अनिवार्य हैं।',
      'अभिवावक से आग्रह है कि अपनी बच्ची से रविवार को ही मिले। मिलने वाले मे माता–पिता अपना भाई–बहन के अलावा कोई नहीं मिलना हैं।',
      'मिलने के पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है। गुरु जी से आग्रह है कि हॉस्टल रक्षा में प्रवेश न करें। एवं मिलने का समय 30 मिनट से कम हो।',
      'खिड़कीयों पर खड़ा होना सख़्ती से मनाही हैं।',
      'कोई भी वस्तू खिड़की से बाहर न फेकें। कचड़ा पेटी का प्रयोग करें।',
      'पढ़ाई पर बिश। ध्यान रखें।',
      'कोई भी समस्या होने पर इसे की शिकायत हॉस्टल इंचार्ज को फोन दें।',
      'जब भी हॉस्टल छोड़ना (खाली) करना हो तो एक माह पूर्व बताना अनिवार्य है नहीं तो दुस्त माह का _____ टुक देना होगा।'
    ];
    rules.forEach((r, i) => {
      doc.fontSize(10).text(`${i+1}. ${r}`, { paragraphGap: 2 });
    });

    // Footer / finalize
    doc.moveDown(2);
    doc.fontSize(11).text('धन्यवाद', { align: 'center' });
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
