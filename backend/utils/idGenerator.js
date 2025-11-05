import admin from 'firebase-admin';

// Utilities for generating formatted IDs and creating hostels/students
export const formatHostelId = (num) => String(num).padStart(2, '0');
export const formatStudentId = (num) => String(num).padStart(4, '0');

/**
 * Create a hostel under a user with a 2-digit hostelId and initialize nextStudentSeq
 * Uses transaction to avoid race conditions.
 *
 * data: { name, address, ... }
 */
export async function createHostel(db, userId, data = {}) {
  const userRef = db.collection('users').doc(userId);
  const hostelsRef = userRef.collection('hostels');

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    // If user doc doesn't exist, create a minimal one so hostels can be created.
    if (!userSnap.exists) {
      // create a minimal user profile inside the same transaction
      tx.set(userRef, {
        fullName: data.ownerName || 'Hostel Admin',
        username: `user_${userId}`,
        role: 'admin',
        nextHostelSeq: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // read nextHostelSeq from user doc (default to 1)
    const nextHostelSeq = (userSnap.exists ? (userSnap.get('nextHostelSeq') || 1) : 1);
    const hostelId = formatHostelId(nextHostelSeq);

    const newHostelRef = hostelsRef.doc();
    const hostelPayload = {
      hostelId,
      name: data.name || '',
      address: data.address || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      nextStudentSeq: 1,
      meta: data.meta || null
    };

    tx.set(newHostelRef, hostelPayload);

    // increment user's counter
    tx.update(userRef, { nextHostelSeq: nextHostelSeq + 1 });

    return { id: newHostelRef.id, ...hostelPayload };
  });
}

/**
 * Create a student under a user's hostel and also mirror to top-level 'students' collection
 * studentData: arbitrary fields for student
 * Returns created student doc refs and combinedId
 */
export async function createStudent(db, userId, hostelDocId, studentData = {}) {
  const hostelRef = db.collection('users').doc(userId).collection('hostels').doc(hostelDocId);
  const topStudents = db.collection('students');

  return db.runTransaction(async (tx) => {
    const hostelSnap = await tx.get(hostelRef);
    if (!hostelSnap.exists) throw new Error('Hostel not found: ' + hostelDocId);

    const hostelData = hostelSnap.data();
    const nextStudentSeq = hostelData.nextStudentSeq || 1;
    const studentId = formatStudentId(nextStudentSeq);
    const combinedId = `${hostelData.hostelId}/${studentId}`;

    const studentPayload = {
      studentId,
      hostelId: hostelData.hostelId,
      combinedId,
      ownerUserId: userId,
      ownerHostelDocId: hostelDocId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...studentData
    };

    // create student under hostel subcollection
    const newStudentRef = hostelRef.collection('students').doc();
    tx.set(newStudentRef, studentPayload);

      // NOTE: we no longer mirror students to a top-level 'students' collection.
      // Students are stored under users/{userId}/hostels/{hostelDocId}/students.
      // If needed later, mirroring can be reintroduced as an option.

    // increment nextStudentSeq
    tx.update(hostelRef, { nextStudentSeq: nextStudentSeq + 1 });

    return { studentRef: newStudentRef, combinedId };
  });
}

export default { formatHostelId, formatStudentId, createHostel, createStudent };
