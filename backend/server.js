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
*** End Patch