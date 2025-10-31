const admin = require('firebase-admin');

async function run() {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    const db = admin.firestore();
    console.log('Initialized Firebase Admin SDK. Attempting to read students collection...');
    const snap = await db.collection('students').limit(5).get();
    console.log('Fetched documents count:', snap.size);
    snap.forEach(doc => console.log(doc.id, doc.data()));
    process.exit(0);
  } catch (err) {
    console.error('Error during Firestore test:', err);
    process.exit(2);
  }
}

run();
