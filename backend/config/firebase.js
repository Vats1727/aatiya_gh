import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;
let db = null;

const initializeFirebase = () => {
  // If already initialized, return existing instances
  if (firebaseApp && db) {
    return { firebaseApp, db };
  }

  // Check for existing app instance
  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    db = admin.firestore();
    console.log('Reusing existing Firebase app instance');
    return { firebaseApp, db };
  }
  try {
    // Try to load service account from environment variables or file
    let serviceAccount;
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      console.log('Initializing Firebase with GOOGLE_SERVICE_ACCOUNT_BASE64');
      const buf = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
      serviceAccount = JSON.parse(buf.toString('utf8'));
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      console.log('Initializing Firebase with GOOGLE_SERVICE_ACCOUNT');
      serviceAccount = typeof process.env.GOOGLE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
        : process.env.GOOGLE_SERVICE_ACCOUNT;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Initializing Firebase with Application Default Credentials');
      firebaseApp = admin.initializeApp();
    } else {
      // Try to find service account file in common locations
      const possiblePaths = [
        path.resolve(__dirname, '../serviceAccountKey.json'),
        path.resolve(process.cwd(), 'serviceAccountKey.json'),
        path.resolve(process.cwd(), 'backend/serviceAccountKey.json'),
        path.resolve(__dirname, '../../serviceAccountKey.json')
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          console.log(`Found service account file at: ${filePath}`);
          serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          break;
        }
      }
    }

    if (!firebaseApp) {
      if (!serviceAccount) {
        throw new Error('No Firebase service account found. Please set up your Firebase credentials.');
      }
      
      // Derive storage bucket name from env or service account project_id
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (serviceAccount && serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined);

      // Initialize Firebase with the service account and optional storage bucket
      const initOptions = {
        credential: admin.credential.cert(serviceAccount)
      };
      if (storageBucket) initOptions.storageBucket = storageBucket;
      firebaseApp = admin.initializeApp(initOptions);
    }

    // Initialize Firestore with settings
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    
    console.log('Firebase Admin SDK and Firestore initialized successfully');
    
    return { firebaseApp, db };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
};

// Initialize immediately when this module is imported
const { firebaseApp: initializedApp, db: firestoreDb } = initializeFirebase();

// Export the initialized instances
export { initializedApp as firebaseApp, firestoreDb as db };
export default { firebaseApp: initializedApp, db: firestoreDb };