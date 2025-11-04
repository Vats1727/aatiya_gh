import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let firebaseInitialized = false;
// Exported `db` will be assigned after successful initialization to avoid
// calling admin.firestore() at module import time (which requires an app).
export let db = null;

const initializeFirebase = () => {
  // If an app already exists, reuse it instead of initializing again.
  try {
    if (admin.apps && admin.apps.length > 0) {
      firebaseInitialized = true;
      db = admin.firestore();
      console.log('Firebase already initialized - reusing existing app');
      return true;
    }
  } catch (e) {
    // ignore and continue to initialization path
  }
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
      // Check several likely locations relative to repo and this file so scripts run regardless of CWD
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      // 1) backend/serviceAccountKey.json relative to repo root when running from repo root
      const localPath1 = path.resolve('./backend/serviceAccountKey.json');
      // 2) serviceAccountKey.json in repo root
      const localPath2 = path.resolve('./serviceAccountKey.json');
      // 3) serviceAccountKey.json located next to this config file (backend/config/../serviceAccountKey.json)
      const localPath3 = path.resolve(__dirname, '..', 'serviceAccountKey.json');
      // 4) serviceAccountKey.json in the backend directory (one level up from config)
      const localPath4 = path.resolve(__dirname, '..', '..', 'serviceAccountKey.json');

      const candidates = [localPath1, localPath2, localPath3, localPath4];
      let found = null;
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          found = p;
          break;
        }
      }

      if (found) {
        console.log(`Local serviceAccountKey.json found — initializing Firebase (dev) at ${found}`);
        const serviceAccount = JSON.parse(fs.readFileSync(found, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        firebaseInitialized = true;
      }
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK:', err);
  }

  if (!firebaseInitialized) {
    console.error('Firebase Admin SDK was not initialized. Set GOOGLE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in backend/');
    return false;
  }

  try {
    // assign exported db after successful initialization
    db = admin.firestore();
    console.log('Firestore initialized');
  } catch (err) {
    console.error('Failed to get Firestore instance:', err);
    return false;
  }

  return true;
};

export const isInitialized = () => firebaseInitialized;
export default initializeFirebase;