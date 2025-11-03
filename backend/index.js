import express from 'express';
// Clean backend server: Firebase init, CRUD and PDF generation
import express from 'express';
// Minimal clean backend (single copy). Exposes CRUD + PDF
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

let firestore = null;

function initFirebase() {
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      const buf = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
      const sa = JSON.parse(buf.toString('utf8'));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    } else if (fs.existsSync(path.resolve('./backend/serviceAccountKey.json'))) {
      const sa = JSON.parse(fs.readFileSync(path.resolve('./backend/serviceAccountKey.json'), 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
    }
    firestore = admin.firestore();
    console.log('Firebase initialized');
  } catch (e) {
    console.error('Firebase init failed:', e && e.message ? e.message : e);
  }
}

initFirebase();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/api/students', async (req, res) => {
  if (!firestore) return res.status(500).send('Firestore not initialized');
  try {
    const payload = req.body || {};
    payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const r = await firestore.collection('students').add(payload);
    const snap = await r.get();
    res.status(201).json({ id: r.id, data: snap.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/students', async (req, res) => {
  if (!firestore) return res.status(500).send('Firestore not initialized');
  try {
    const snap = await firestore.collection('students').orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/students/:id', async (req, res) => {
  if (!firestore) return res.status(500).send('Firestore not initialized');
  try {
    const s = await firestore.collection('students').doc(req.params.id).get();
    if (!s.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: s.id, ...s.data() });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.put('/api/students/:id', async (req, res) => {
  if (!firestore) return res.status(500).send('Firestore not initialized');
  try {
    const updates = req.body || {};
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await firestore.collection('students').doc(req.params.id).set(updates, { merge: true });
    const s = await firestore.collection('students').doc(req.params.id).get();
    res.json({ id: s.id, ...s.data() });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.delete('/api/students/:id', async (req, res) => {
  if (!firestore) return res.status(500).send('Firestore not initialized');
  try {
    await firestore.collection('students').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// PDF endpoint (simple, mirrors StudentForm layout roughly using pdfkit)
app.get('/api/students/:id/pdf', async (req, res) => {
  if (!firestore) return res.status(500).send('Firestore not initialized');
  try {
    const s = await firestore.collection('students').doc(req.params.id).get();
    if (!s.exists) return res.status(404).json({ error: 'Not found' });
    const data = s.data() || {};

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-${req.params.id}.pdf`);
    doc.pipe(res);

    const decode = durl => {
      if (!durl) return null;
      const m = String(durl).match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (!m) return null;
      return Buffer.from(m[2], 'base64');
    };

    doc.font('Helvetica-Bold').fontSize(22).text('आतिया गर्ल्स हॉस्टल', { align: 'center' });
    doc.font('Helvetica').fontSize(10).text('नामांकन फॉर्म / ADMISSION FORM', { align: 'center' });
    doc.moveDown(0.5);

    const imgW = 120; const imgH = 120; const gap = 20;
    const left = doc.page.margins.left;
    const right = left + imgW + gap;
    const imgY = doc.y;
    doc.rect(left, imgY, imgW, imgH).stroke();
    doc.rect(right, imgY, imgW, imgH).stroke();
    const pbuf = decode(data.parentPhoto); const sbuf = decode(data.studentPhoto);
    try { if (pbuf) doc.image(pbuf, left + 6, imgY + 6, { fit: [imgW - 12, imgH - 12] }); } catch (e) {}
    try { if (sbuf) doc.image(sbuf, right + 6, imgY + 6, { fit: [imgW - 12, imgH - 12] }); } catch (e) {}
    doc.moveDown(8);

    doc.font('Helvetica-Bold').fontSize(11).text('छात्रा का नाम: ' + (data.studentName || ''));
    doc.font('Helvetica').text('पिता का नाम: ' + (data.fatherName || ''));
    doc.font('Helvetica').text('माता का नाम: ' + (data.motherName || ''));
    doc.moveDown(1);

    doc.addPage(); doc.font('Helvetica-Bold').text('शपथ पत्र', { align: 'center' }); doc.moveDown(0.5);
    doc.font('Helvetica').text('1. हॉस्टल के नियमों का पालन किया जाएगा।');
    doc.end();

  } catch (err) {
    console.error('pdf error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: String(err) }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      console.log('GOOGLE_SERVICE_ACCOUNT found — initializing Firebase');
      const serviceAccount = typeof process.env.GOOGLE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
        : process.env.GOOGLE_SERVICE_ACCOUNT;
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      firebaseInitialized = true;
    // Create PDF matching StudentForm print layout more precisely
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-${id}.pdf`);
    doc.pipe(res);

    // small helpers
    const drawImageBuf = (buf, x, y, w, h) => {
      try { doc.image(buf, x, y, { fit: [w, h], align: 'center' }); } catch (e) { /* ignore */ }
    };
    const decodeDataUrlToBuf = (dataUrl) => {
      if (!dataUrl || typeof dataUrl !== 'string') return null;
      const m = String(dataUrl).match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (!m) return null;
      return Buffer.from(m[2], 'base64');
    };

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header block (match StudentForm styles)
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(22).text('आतिया गर्ल्स हॉस्टल', { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#374151').text('ATIYA GIRLS HOSTEL', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(10).text('रामपाड़ा कटिहार / Rampada Katihar', { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(13).text('नामांकन फॉर्म / ADMISSION FORM', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(9).text(`दिनांक / Date: ${data.admissionDate || ''}`, { align: 'right' });
    doc.moveDown(0.4);

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

    // Create student
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

    // List students
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

    // Generate PDF for a student and stream as attachment (match StudentForm style)
    app.get('/api/students/:id/pdf', async (req, res) => {
      if (!db) return res.status(500).send('Firestore not initialized');
      try {
        const { id } = req.params;
        const docRef = db.collection('students').doc(id);
        const snap = await docRef.get();
        if (!snap.exists) return res.status(404).json({ error: 'Not found' });
        const data = snap.data() || {};

        const doc = new PDFDocument({ size: 'A4', margin: 36 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=student-${id}.pdf`);
        doc.pipe(res);

        // helper functions
        const decodeDataUrlToBuf = (dataUrl) => {
          if (!dataUrl || typeof dataUrl !== 'string') return null;
          const m = String(dataUrl).match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
          if (!m) return null;
          return Buffer.from(m[2], 'base64');
        };
        const drawImage = (buf, x, y, w, h) => { try { doc.image(buf, x, y, { fit: [w, h], align: 'center' }); } catch (e) { } };

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // Header
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(22).text('आतिया गर्ल्स हॉस्टल', { align: 'center' });
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#374151').text('ATIYA GIRLS HOSTEL', { align: 'center' });
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(10).text('रामपाड़ा कटिहार / Rampada Katihar', { align: 'center' });
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(13).text('नामांकन फॉर्म / ADMISSION FORM', { align: 'center' });
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(9).text(`दिनांक / Date: ${data.admissionDate || ''}`, { align: 'right' });
        doc.moveDown(0.4);

        // Photos
        const imgBoxW = 130; const imgBoxH = 130; const gap = 20;
        const leftX = doc.page.margins.left;
        const rightX = leftX + imgBoxW + gap;
        doc.font('Helvetica-Bold').fontSize(10).text('पिता/माता का फोटो / Parent Photo', leftX, doc.y);
        const imgY = doc.y + 6;
        doc.rect(leftX, imgY, imgBoxW, imgBoxH).stroke();
        doc.rect(rightX, imgY, imgBoxW, imgBoxH).stroke();
        const parentBuf = decodeDataUrlToBuf(data.parentPhoto);
        const studentBuf = decodeDataUrlToBuf(data.studentPhoto);
        if (parentBuf) drawImage(parentBuf, leftX + 8, imgY + 8, imgBoxW - 16, imgBoxH - 16);
        doc.font('Helvetica-Bold').fontSize(10).text('छात्रा का फोटो / Student Photo', rightX, doc.y);
        if (studentBuf) drawImage(studentBuf, rightX + 8, imgY + 8, imgBoxW - 16, imgBoxH - 16);
        doc.y = imgY + imgBoxH + 14;

        // Two-column info
        const colW = (pageWidth - gap) / 2;
        const leftColX = doc.page.margins.left;
        const rightColX = leftColX + colW + gap;
        const infoPairs = [
          ['छात्रा का नाम', data.studentName || ''],
          ['माता का नाम', data.motherName || ''],
          ['पिता का नाम', data.fatherName || ''],
          ['जन्म तिथि', data.dob || '']
        ];
        let curY = doc.y;
        for (let i=0;i<infoPairs.length;i+=2) {
          const left = infoPairs[i]; const right = infoPairs[i+1];
          doc.font('Helvetica-Bold').fontSize(10).text(left[0] + ':', leftColX, curY, { width: colW });
          doc.font('Helvetica').text(' ' + (left[1] || ''), leftColX + 0, curY, { width: colW });
          if (right) {
            doc.font('Helvetica-Bold').fontSize(10).text(right[0] + ':', rightColX, curY, { width: colW });
            doc.font('Helvetica').text(' ' + (right[1] || ''), rightColX + 0, curY, { width: colW });
          }
          curY += 18;
        }
        doc.y = curY + 6;

        // Contact
        doc.font('Helvetica-Bold').fontSize(11).text('संपर्क जानकारी / Contact Information');
        doc.moveDown(0.2);
        doc.font('Helvetica-Bold').fontSize(10).text('मोबाइल नं (1):', leftColX, doc.y, { continued: true }); doc.font('Helvetica').text(' ' + (data.mobile1 || ''));
        doc.font('Helvetica-Bold').text('मोबाइल नं (2):', rightColX, doc.y); doc.font('Helvetica').text(' ' + (data.mobile2 || 'N/A'));
        doc.moveDown(0.4);

        // Address
        doc.font('Helvetica-Bold').fontSize(11).text('स्थायी पता / Permanent Address');
        doc.moveDown(0.2);
        const addrItems = [ ['ग्राम', data.village || ''], ['पोस्ट', data.post || ''], ['थाना', data.policeStation || ''], ['जिला', data.district || ''], ['पिन कोड', data.pinCode || ''] ];
        addrItems.forEach(([label,val]) => { doc.font('Helvetica-Bold').fontSize(10).text(label + ':', { continued: true }); doc.font('Helvetica').text(' ' + (val||'')); });
        doc.moveDown(0.4);

        // Allowed Visitors
        doc.font('Helvetica-Bold').fontSize(11).text('छात्रा से मिलने वाले का नाम / Allowed Visitors'); doc.moveDown(0.2);
        for (let i=1;i<=4;i++) { const v = data[`allowedPerson${i}`]; if (v) doc.font('Helvetica').fontSize(10).text(`${i}. ${v}`); }
        doc.moveDown(0.4);

        // Coaching
        doc.font('Helvetica-Bold').fontSize(11).text('कोचिंग विवरण / Coaching Details'); doc.moveDown(0.2);
        for (let i=1;i<=4;i++) {
          const name = data[`coaching${i}Name`]; const addr = data[`coaching${i}Address`];
          if (name || addr) {
            const cardX = doc.page.margins.left; const cardW = pageWidth; const beforeY = doc.y;
            doc.rect(cardX, beforeY, cardW, 36).fillOpacity(0.03).fillAndStroke('#fce7f3', '#fce7f3');
            doc.fillColor('black'); doc.font('Helvetica-Bold').fontSize(10).text(`कोचिंग ${i}: ${name || ''}`, cardX + 6, beforeY + 6);
            if (addr) doc.font('Helvetica').fontSize(9).text(`पता: ${addr}`, cardX + 6, beforeY + 20);
            doc.moveDown(2);
          }
        }

        // Signatures
        doc.moveDown(1);
        const sigY = doc.y + 10; const sigW = (pageWidth - gap)/2; const leftSigX = doc.page.margins.left; const rightSigX = leftSigX + sigW + gap;
        doc.moveTo(leftSigX, sigY).lineTo(leftSigX + sigW - 10, sigY).stroke(); doc.font('Helvetica').fontSize(10).text(data.studentSignature || '', leftSigX, sigY + 4); doc.fontSize(9).text('छात्रा का हस्ताक्षर / Student Signature', leftSigX, sigY + 18);
        doc.moveTo(rightSigX, sigY).lineTo(rightSigX + sigW - 10, sigY).stroke(); doc.font('Helvetica').fontSize(10).text(data.parentSignature || '', rightSigX, sigY + 4); doc.fontSize(9).text('पिता/माता का हस्ताक्षर / Parent Signature', rightSigX, sigY + 18);

        // Second page - affidavit and rules
        doc.addPage(); doc.font('Helvetica-Bold').fontSize(14).text('शपथ पत्र', { align: 'center' }); doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(11).text(`मैं ${data.parentSignature || ''} अपनी पुत्री / बहन ${data.studentName || ''} ग्राम ${data.village || ''} पो॰ ${data.post || ''} थाना ${data.policeStation || ''} जिला ${data.district || ''} को अपना मर्ज़ी से आतिया गर्ल्स हॉस्टल में रख रहा हूँ। मैं और मेरी पुत्री / बहन यह ${data.admissionDate || ''} शपथ लेते हैं कि हॉस्टल के निम्नलिखित नियमों का पालन करेंगे।`, { align: 'justify' }); doc.moveDown(0.5);
        const rulesList = [
          'हॉस्टल से बाहर निकलने के पूर्व का आने के समय हॉस्टल इंचार्ज से अनुमति लेने अनिवार्य होगा।',
          'कोचिंग का समय प्राप्त होने के 30 मिनट पूर्व हॉस्टल से निकलना एवं कोचिंग के समाप्त होने पर 30 मिनट के अंदर हॉस्टल वापस आना अनिवार्य होगा।',
          'हॉस्टल के अन्दर साफाई का विधि। स्वयं रखना।',
          'हॉस्टल से निकलने के पूर्व पक्का एवं बर्त्ती को बंद करना अनिवार्य है नहीं करने पर 50 रुपया दंड लगेगा।',
          'हॉस्टल से निकलने के बाद मेरी पुत्री अगर भाग जाती हैं तो इसके लिये हॉस्टल जिम्मेदार नहीं होगा।',
          'हॉस्टल _____ प्रत्येक हर महीने के 01 तारिख से 05 तारिख तक जमा करना अनिवार्य हैं।',
          'अभिवावक से आग्रह है कि अपनी बच्ची से रविवार को ही मिले। मिलने वाले मे माता–पिता अपना भाई–बहन के अलावा कोई नहीं मिलना हैं।',
          'मिलने के पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है। गुरु जी से आग्रह है कि हॉस्टल रक्षा में प्रवेश न करें। एवं मिलने का समय 30 मिनट से कम हो।',
          'खिड़कीयों पर खड़ा होना सख़्ती से मनाही हैं।',
          'कोई भी वस्तु खिड़की से बाहर न फेकें। कचड़ा पेटी का प्रयोग करें।',
          'पढ़ाई पर बिश। ध्यान रखें।',
          'कोई भी समस्या होने पर इसे की शिकायत हॉस्टल इंचार्ज को फोन दें।',
          'जब भी हॉस्टल छोड़ना (खाली) करना हो तो एक माह पूर्व बताना अनिवार्य है नहीं तो दुस्त माह का _____ टुक देना होगा।'
        ];
        doc.fontSize(10).font('Helvetica'); rulesList.forEach((r,i) => { doc.text(`${i+1}. ${r}`, { paragraphGap: 4, align: 'justify' }); });
        doc.moveDown(2); doc.font('Helvetica-Bold').fontSize(11).text('धन्यवाद', { align: 'center' }); doc.end();

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
