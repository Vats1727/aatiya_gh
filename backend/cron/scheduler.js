import cron from 'node-cron';
import admin from 'firebase-admin';

/**
 * Create a billing key like 'YYYY-MM' for the provided date (month is 1-based)
 */
function billingMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${m}-${y}`;
}

/**
 * Run monthly debit process once. It will iterate users -> hostels -> students
 * and create a 'debit' payment with billingMonth if not already present for that month.
 * Returns an object with summary counts.
 */
export async function runMonthlyDebitsOnce(db, opts = {}) {
  if (!db) throw new Error('Firestore db required');
  const now = opts.date ? new Date(opts.date) : new Date();
  const monthKey = billingMonthKey(now);
  const summary = { users: 0, hostels: 0, students: 0, debitsCreated: 0, skipped: 0 };

  const usersSnap = await db.collection('users').get();
  summary.users = usersSnap.size;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const hostelsSnap = await db.collection('users').doc(userId).collection('hostels').get();
    summary.hostels += hostelsSnap.size;

    for (const hostelDoc of hostelsSnap.docs) {
      const hostelData = hostelDoc.data() || {};
      const hostelId = hostelDoc.id;
      const studentsSnap = await db.collection('users').doc(userId).collection('hostels').doc(hostelId).collection('students').get();
      summary.students += studentsSnap.size;

      for (const studentDoc of studentsSnap.docs) {
        const studentRef = studentDoc.ref;
        const studentData = studentDoc.data() || {};

        // Only bill active students
        if (studentData.status !== 'active') {
          summary.skipped += 1;
          continue;
        }

        // Determine billing amount: prefer student.monthlyFee then hostel.monthlyFee then appliedFee
        const amount = Number(studentData.monthlyFee ?? hostelData.monthlyFee ?? studentData.appliedFee ?? 0);
        if (!amount || Number.isNaN(amount) || amount <= 0) {
          summary.skipped += 1;
          continue; // noop for zero-fee students
        }

        // Check if a debit entry for this billing month already exists
        const paymentsCol = studentRef.collection('payments');
        const existing = await paymentsCol.where('billingMonth', '==', monthKey).limit(1).get();
        if (!existing.empty) {
          summary.skipped += 1;
          continue; // already billed
        }

        // Use a transaction to create the debit payment and update student's currentBalance
        try {
          await db.runTransaction(async (tx) => {
            const sSnap = await tx.get(studentRef);
            if (!sSnap.exists) throw new Error('Student disappeared during billing');
            const sData = sSnap.data() || {};
            const currentBalance = Number(sData.currentBalance ?? sData.appliedFee ?? sData.monthlyFee ?? 0) || 0;
            const newBalance = currentBalance + amount; // debit increases balance

            const paymentRef = paymentsCol.doc();
            const payload = {
              amount,
              type: 'debit',
              paymentMode: 'Rent Dr',
              remarks: opts.remarks || `Monthly fee for ${monthKey}`,
              billingMonth: monthKey,
              timestamp: (new Date()).toISOString(),
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            tx.set(paymentRef, payload);
            tx.update(studentRef, { currentBalance: newBalance, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          });
          summary.debitsCreated += 1;
        } catch (err) {
          console.error('Failed to create monthly debit for', studentRef.path, err);
          summary.skipped += 1;
        }
      }
    }
  }

  return summary;
}

/**
 * Schedule the monthly debits to run at 00:05 on the 1st day of every month.
 * Returns the scheduled task instance so it can be stopped if needed.
 */
export function scheduleMonthlyDebits(db, opts = {}) {
  if (!db) throw new Error('Firestore db required');
  // Run at 00:05 on day-of-month 1
  const expression = opts.cronExpression || '5 0 1 * *';
  console.log('Scheduling monthly debits with expression:', expression);

  const task = cron.schedule(expression, async () => {
    console.log('Running scheduled monthly debits at', new Date().toISOString());
    try {
      const res = await runMonthlyDebitsOnce(db, opts);
      console.log('Monthly debits summary:', res);
    } catch (err) {
      console.error('Scheduled monthly debits failed:', err);
    }
  }, {
    scheduled: true,
    timezone: opts.timezone || 'UTC'
  });

  // Optionally run once on startup if the flag is set
  if (opts.runOnStartup) {
    (async () => {
      console.log('Running monthly debits once on startup (runOnStartup=true)');
      try {
        const res = await runMonthlyDebitsOnce(db, opts);
        console.log('Startup monthly debits summary:', res);
      } catch (err) {
        console.error('Startup monthly debits failed:', err);
      }
    })();
  }

  return task;
}

export default scheduleMonthlyDebits;
