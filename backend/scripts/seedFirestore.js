import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import initializeFirebase, { db as maybeDb } from '../config/firebase.js';
import { createHostel, createStudent } from '../utils/idGenerator.js';

async function loadServiceAccount() {
  // initializeFirebase() in config/firebase will look for env var or local serviceAccountKey.json
  const ok = initializeFirebase();
  if (!ok) {
    console.error('Failed to initialize Firebase Admin SDK. Ensure serviceAccountKey.json exists in backend/ or set env var.');
    process.exit(1);
  }
}

async function seed() {
  await loadServiceAccount();
  const db = admin.firestore();

  try {
    console.log('Seeding Firestore with sample SuperAdmin, Admin, Hostels and Students...');

    // Create a super admin user
    const superAdminRef = db.collection('users').doc();
    await superAdminRef.set({
      fullName: 'Super Admin',
      username: 'superadmin',
      role: 'superadmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created superadmin:', superAdminRef.id);

    // Create an admin user
    const adminRef = db.collection('users').doc();
    await adminRef.set({
      fullName: 'Hostel Admin',
      username: 'admin1',
      role: 'admin',
      nextHostelSeq: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const adminId = adminRef.id;
    console.log('Created admin user:', adminId);

    // Create two hostels for this admin
    const h1 = await createHostel(db, adminId, { name: 'Hostel One', address: 'Address 1' });
    console.log('Created hostel1', h1);
    const h2 = await createHostel(db, adminId, { name: 'Hostel Two', address: 'Address 2' });
    console.log('Created hostel2', h2);

    // Add students to hostel1
    const s1 = await createStudent(db, adminId, h1.id, { studentName: 'Student A', mobile1: '9999999999' });
    console.log('Created student1 with combinedId', s1.combinedId);
    const s2 = await createStudent(db, adminId, h1.id, { studentName: 'Student B', mobile1: '8888888888' });
    console.log('Created student2 with combinedId', s2.combinedId);

    // Add a student to hostel2
    const s3 = await createStudent(db, adminId, h2.id, { studentName: 'Student C', mobile1: '7777777777' });
    console.log('Created student3 with combinedId', s3.combinedId);

    console.log('Seeding complete. You can inspect Firestore console to verify created documents.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Firestore:', err);
    process.exit(2);
  }
}

seed();
