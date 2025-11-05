import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzDxyAnNdWab0jZMNCCspFt04iemC2ItI",
  authDomain: "firestore-ac9f4.firebaseapp.com",
  projectId: "firestore-ac9f4",
  storageBucket: "firestore-ac9f4.firebasestorage.app",
  messagingSenderId: "369710914036",
  appId: "1:369710914036:web:73cb9f6327058fddac81a1",
  measurementId: "G-MXQLB5074G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };