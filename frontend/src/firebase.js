import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzDxyAnNdWab0jZMNCCspFt04iemC2ItI",
  authDomain: "firestore-ac9f4.firebaseapp.com",
  projectId: "firestore-ac9f4",
  storageBucket: "firestore-ac9f4.appspot.com",
  messagingSenderId: "369710914036",
  appId: "1:369710914036:web:73cb9f6327058fddac81a1",
  measurementId: "G-MXQLB5074G"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error; // Re-throw to prevent the app from starting with invalid Firebase config
}

export { auth, db, app };
// Re-export commonly used auth helpers so components can import from './firebase'
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged };
// Re-export some firestore helpers used across the app
export { doc, setDoc, serverTimestamp };