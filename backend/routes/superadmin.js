import express from 'express';

// Create a router factory that accepts a Firestore `db` instance
export default function createSuperAdminRouter(db) {
  const router = express.Router();

  // SuperAdmin endpoint to fetch all users with their hostels, students, and payments
  // GET /api/superadmin/all-data
  // Authorization: Bearer superadmin-token (simple check)
  router.get('/all-data', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    
    try {
      // Simple token validation (you can enhance this with actual token verification)
      const authHeader = req.headers.authorization || '';
      if (!authHeader.includes('superadmin-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const usersSnapshot = await db.collection('users').get();
      const allUsers = [];

      // Iterate through each user
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Get all hostels for this user
        const hostelsSnapshot = await db.collection('users').doc(userId).collection('hostels').get();
        const hostels = [];

        for (const hostelDoc of hostelsSnapshot.docs) {
          const hostelData = hostelDoc.data();
          const hostelId = hostelDoc.id;

          // Get all students for this hostel
          const studentsSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('hostels')
            .doc(hostelId)
            .collection('students')
            .get();

          const students = [];

          for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();
            const studentId = studentDoc.id;

            // Get all payments for this student
            const paymentsSnapshot = await db
              .collection('users')
              .doc(userId)
              .collection('hostels')
              .doc(hostelId)
              .collection('students')
              .doc(studentId)
              .collection('payments')
              .get();

            const payments = paymentsSnapshot.docs.map(paymentDoc => ({
              paymentId: paymentDoc.id,
              ...paymentDoc.data()
            }));

            students.push({
              studentId,
              studentName: studentData.studentName || studentData.name || 'Unknown',
              email: studentData.email || '',
              rollNumber: studentData.rollNumber || '',
              payments
            });
          }

          hostels.push({
            hostelId,
            name: hostelData.name || 'Unknown Hostel',
            address: hostelData.address || '',
            monthlyFee: hostelData.monthlyFee || 0,
            students
          });
        }

        allUsers.push({
          userId,
          name: userData.displayName || userData.fullName || userData.username || 'Unknown',
          email: userData.username || userData.email || '',
          role: userData.role || 'user',
          hostels
        });
      }

      res.json({ 
        success: true,
        data: { users: allUsers },
        message: `Fetched ${allUsers.length} users with all their data`
      });
    } catch (err) {
      console.error('GET /api/superadmin/all-data error:', err);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch superadmin data',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Optional: Get summary statistics for superadmin dashboard
  router.get('/stats', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    
    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.includes('superadmin-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const usersSnapshot = await db.collection('users').get();
      let totalHostels = 0;
      let totalStudents = 0;
      let totalPayments = 0;

      for (const userDoc of usersSnapshot.docs) {
        const hostelsSnapshot = await db.collection('users').doc(userDoc.id).collection('hostels').get();
        totalHostels += hostelsSnapshot.size;

        for (const hostelDoc of hostelsSnapshot.docs) {
          const studentsSnapshot = await db
            .collection('users')
            .doc(userDoc.id)
            .collection('hostels')
            .doc(hostelDoc.id)
            .collection('students')
            .get();
          totalStudents += studentsSnapshot.size;

          for (const studentDoc of studentsSnapshot.docs) {
            const paymentsSnapshot = await db
              .collection('users')
              .doc(userDoc.id)
              .collection('hostels')
              .doc(hostelDoc.id)
              .collection('students')
              .doc(studentDoc.id)
              .collection('payments')
              .get();
            totalPayments += paymentsSnapshot.size;
          }
        }
      }

      res.json({
        success: true,
        stats: {
          totalUsers: usersSnapshot.size,
          totalHostels,
          totalStudents,
          totalPayments
        }
      });
    } catch (err) {
      console.error('GET /api/superadmin/stats error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats'
      });
    }
  });

  // Manual trigger for monthly debits (superadmin-only)
  router.post('/run-monthly-debits', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.includes('superadmin-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // lazy import to avoid cycles
      const { runMonthlyDebitsOnce } = await import('../cron/scheduler.js');
      const result = await runMonthlyDebitsOnce(db, { date: req.body && req.body.date });
      return res.json({ success: true, result });
    } catch (err) {
      console.error('POST /api/superadmin/run-monthly-debits error:', err);
      return res.status(500).json({ success: false, error: 'Failed to run monthly debits', details: err.message });
    }
  });

  return router;
}
