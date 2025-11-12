import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StudentPayments = () => {
  const { hostelId, studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [ledgerStart, setLedgerStart] = useState('');
  const [ledgerEnd, setLedgerEnd] = useState('');
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerOpeningBalance, setLedgerOpeningBalance] = useState(0);
  const [ledgerVisible, setLedgerVisible] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [applicationNo, setApplicationNo] = useState('');
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentMode: 'cash',
    remarks: '',
    type: 'credit' // credit for payment received, debit for refund/adjustment
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin');
          return;
        }

        // Fetch student details
        const studentRes = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!studentRes.ok) throw new Error('Failed to fetch student');
        const studentPayload = await studentRes.json();
        // normalize payload shape (backend may return { data: student } or student directly)
        let studentObj = (studentPayload && (studentPayload.data || studentPayload)) || null;

        // If monthlyFee missing on student, try to enrich from hostels list (authenticated)
        try {
          if (studentObj && (studentObj.monthlyFee == null || studentObj.monthlyFee === '' || Number(studentObj.monthlyFee) === 0)) {
            const hostelsRes = await fetch(`${API_BASE}/api/users/me/hostels`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (hostelsRes.ok) {
              const hostelsPayload = await hostelsRes.json();
              const list = hostelsPayload?.data || hostelsPayload || [];
              const found = (list || []).find(h => String(h.id) === String(hostelId) || String(h._id) === String(hostelId) || String(h.hostelId) === String(hostelId));
              if (found) {
                // prefer numeric values
                const mf = found.monthlyFee != null ? Number(found.monthlyFee) : (found.monthlyfee != null ? Number(found.monthlyfee) : 0);
                studentObj = {
                  ...studentObj,
                  monthlyFee: mf,
                  monthlyFeeCurrency: found.monthlyFeeCurrency || found.monthlyfeeCurrency || studentObj.monthlyFeeCurrency || 'INR',
                  hostelName: found.name || found.hostelName || found.title || studentObj.hostelName || ''
                };
              }
            }
          }
        } catch (e) {
          // ignore enrichment errors and continue with whatever studentObj we have
          console.warn('Failed to enrich student with hostel data:', e);
        }

  setStudent(studentObj);
  // capture application number into dedicated state for reliable usage in exports
  let app = '';
  if (studentObj?.combinedId) {
    // combinedId format like "05/0001" -> convert to digits only: "050001"
    try { app = String(studentObj.combinedId).replace(/\D/g, ''); } catch (e) { app = '' }
  }
  if (!app) {
    app = studentObj?.applicationNumber || studentObj?.applicationNo || studentObj?.application_id || studentObj?.appNo || '';
    // strip non-digits just in case and preserve leading zeros
    if (app) app = String(app).replace(/\D/g, '');
  }
  setApplicationNo(app);

        // Fetch payment history
        const paymentsRes = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}/payments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!paymentsRes.ok) throw new Error('Failed to fetch payments');
        const paymentsData = await paymentsRes.json();
        // normalize and sort payments (newest first)
        const rawPayments = paymentsData.data || [];
        const normalized = rawPayments
          .map(p => ({
            ...p,
            amount: Number(p.amount) || 0,
            type: p.type || 'credit',
            paymentMode: p.paymentMode || p.mode || p.payment_method || '',
            timestamp: p.timestamp || p.createdAt || new Date().toISOString(),
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setPayments(normalized);

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hostelId, studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');

      // capture numeric amount and type before resetting state
      const amount = Number(newPayment.amount) || 0;
      const type = newPayment.type || 'credit';

      const payload = {
        ...newPayment,
        amount,
        type,
        timestamp: new Date().toISOString()
      };

      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to add payment');

      const data = await res.json();

      // Update payments list and reset form
      const newEntry = {
        ...data,
        amount,
        type,
        timestamp: payload.timestamp,
      };
      setPayments(prev => [newEntry, ...prev]);
      setNewPayment({
        amount: '',
        paymentMode: 'cash',
        remarks: '',
        type: 'credit'
      });

      // Do not mutate student's currentBalance here. The UI derives balance
      // from `usedFee` and the `payments` array, so updating `payments` above
      // is sufficient and avoids desyncs.

    } catch (err) {
      console.error('Failed to add payment:', err);
      alert('Failed to add payment');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Student not found</div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateDDMMYYYY = (d) => {
    if (!d) return '';
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Build ledger rows between start and end dates. Includes opening balance and running balance.
  const generateLedger = (startIso, endIso) => {
    try {
      setLedgerLoading(true);
      const start = startIso ? new Date(startIso) : null;
      const end = endIso ? new Date(endIso) : null;

      // Sort payments ascending by timestamp for ledger calculations
      const allPayments = (payments || []).slice().map(p => ({ ...p, timestamp: new Date(p.timestamp) }));
      allPayments.sort((a, b) => a.timestamp - b.timestamp);

      // Sum payments before start to compute opening balance
      let creditBefore = 0;
      let debitBefore = 0;
      for (const p of allPayments) {
        if (start && p.timestamp < start) {
          if (p.type === 'credit') creditBefore += Number(p.amount) || 0;
          else debitBefore += Number(p.amount) || 0;
        }
      }

      const usedFee = Number(student?.appliedFee) || Number(student?.monthlyFee) || 0;
      const openingBal = usedFee - (creditBefore - debitBefore); // positive = due, negative = advance

      // Prepare rows for payments within [start, end]
      const rows = [];
      let running = openingBal;

      for (const p of allPayments) {
        if (start && p.timestamp < start) continue;
        if (end && p.timestamp > end) continue;

        // compute effect of this transaction
        const amt = Number(p.amount) || 0;
          if (p.type === 'credit') {
            // student paid: reduces due (running = running - amt)
            running = running - amt;
            rows.push({ date: p.timestamp, paymentMode: p.paymentMode || '', debit: '', credit: amt, running });
          } else {
            // debit (refund/adjustment): increases due
            running = running + amt;
            rows.push({ date: p.timestamp, paymentMode: p.paymentMode || '', debit: amt, credit: '', running });
          }
      }

      setLedgerOpeningBalance(openingBal);
      setLedgerRows(rows);
      setLedgerVisible(true);
    } catch (err) {
      console.error('generateLedger error', err);
      setLedgerRows([]);
      setLedgerOpeningBalance(0);
      setLedgerVisible(true);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Export ledger to CSV (Excel-friendly)
  const downloadLedgerCsv = () => {
    const startLabel = ledgerStart || 'start';
    const endLabel = ledgerEnd || 'end';
    const filename = `${(student.studentName||'student').replace(/\s+/g,'_')}_ledger_${startLabel}_${endLabel}.csv`;
    const lines = [];
    lines.push(['Date', 'Payment Mode', 'Debit (₹)', 'Credit (₹)', 'Running Balance (₹)'].join(','));
    // Opening balance
    lines.push([`Opening Balance`, '', '', '', `${ledgerOpeningBalance}`].join(','));
    for (const r of ledgerRows) {
      // Use date only (YYYY-MM-DD) for CSV
      const dateObj = r.date instanceof Date ? r.date : new Date(r.date);
      const dateStr = dateObj.toISOString().split('T')[0];
      lines.push([dateStr, `"${(r.paymentMode||'').replace(/"/g,'""')}"`, r.debit || '', r.credit || '', r.running].join(','));
    }
    // Closing balance
    const closing = ledgerRows.length ? ledgerRows[ledgerRows.length-1].running : ledgerOpeningBalance;
    lines.push(['Closing Balance', '', '', '', `${closing}`].join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Export ledger to PDF using existing pdf util
  const downloadLedgerPdf = async () => {
    try {
      // build simple HTML for the ledger with improved styling
      // Ensure hostel name shows (try multiple possible fields on student)
  const hostelName = student?.hostelName || student?.hostel?.name || student?.hostelName || '';
  const appNoForPdf = applicationNo || '';
      const periodStart = ledgerStart ? formatDateDDMMYYYY(ledgerStart) : 'start';
      const periodEnd = ledgerEnd ? formatDateDDMMYYYY(ledgerEnd) : 'end';
      const headerHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; padding: 8px;">
          <div style="text-align:center; margin-bottom:8px;"><h2 style="margin:0; color:#111827;">Ledger Report</h2></div>
          <div style="padding: 18px; border:1px solid #e6e6e6; border-radius:8px; box-shadow:0 6px 18px rgba(15,23,42,0.06); background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
              <div>
                <div style="margin-top:6px; color:#374151;">Student: <strong style="color:#0f172a;">${(student.studentName || '')}</strong></div>
                <div style="margin-top:4px; color:#374151;">Application No: <strong style="color:#0f172a;">${appNoForPdf || '—'}</strong></div>
                <div style="margin-top:4px; color:#374151;">Hostel: <strong style="color:#0f172a;">${hostelName || '—'}</strong></div>
              </div>
              <div style="text-align:right; color:#374151;">
                <div style="font-size:12px; color:#6b7280">Period</div>
                <div style="font-weight:600;">${periodStart} – ${periodEnd}</div>
              </div>
            </div>
            <div style="height:14px"></div>
            <table style="width:100%; border-collapse: collapse; border:1px solid #e6e6e6;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left; border-right:1px solid #e6e6e6; padding:8px; border-bottom:1px solid #e6e6e6">Date</th>
                <th style="text-align:left; border-right:1px solid #e6e6e6; padding:8px; border-bottom:1px solid #e6e6e6">Payment Mode</th>
                <th style="text-align:right; border-right:1px solid #e6e6e6; padding:8px; border-bottom:1px solid #e6e6e6">Debit (₹)</th>
                <th style="text-align:right; border-right:1px solid #e6e6e6; padding:8px; border-bottom:1px solid #e6e6e6">Credit (₹)</th>
                <th style="text-align:right; padding:8px; border-bottom:1px solid #e6e6e6">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:8px; border-right:1px solid #e6e6e6">Opening</td>
                <td style="padding:8px; border-right:1px solid #e6e6e6"></td>
                <td style="text-align:right; padding:8px; border-right:1px solid #e6e6e6"></td>
                <td style="text-align:right; padding:8px; border-right:1px solid #e6e6e6"></td>
                <td style="text-align:right; padding:8px">${ledgerOpeningBalance}</td>
              </tr>
      `;

      const rowsHtml = ledgerRows.map((r, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#fbfbfd'};">
          <td style="padding:8px; border-right:1px solid #eef2f6">${formatDateDDMMYYYY(r.date)}</td>
          <td style="padding:8px; border-right:1px solid #eef2f6">${(r.paymentMode||'')}</td>
          <td style="text-align:right; padding:8px; border-right:1px solid #eef2f6">${r.debit || ''}</td>
          <td style="text-align:right; padding:8px; border-right:1px solid #eef2f6">${r.credit || ''}</td>
          <td style="text-align:right; padding:8px">${formatCurrency(r.running)}</td>
        </tr>
      `).join('');

      const closing = ledgerRows.length ? ledgerRows[ledgerRows.length-1].running : ledgerOpeningBalance;
      const footerHtml = `
            </tbody>
          </table>
          <div style="height:12px"></div>
          <div style="font-weight:600">Closing Balance:  ${formatCurrency(closing)}</div>
        </div>
      `;

  const html = headerHtml + rowsHtml + footerHtml;
  const { generatePdfFromHtmlString } = await import('../utils/pdf');
  const safeName = (student.studentName||'student').replace(/\s+/g,'_');
  await generatePdfFromHtmlString(html, `${safeName}_ledger_${periodStart}_${periodEnd}.pdf`);
    } catch (err) {
      console.error('downloadLedgerPdf error', err);
      alert('Failed to generate PDF');
    }
  };

  const formatCurrency = (v) => {
    const num = Number(v || 0);
    const abs = Math.abs(num).toLocaleString('en-IN');
    return num < 0 ? `-₹${abs}` : `₹${abs}`;
  };

  const calculateTotals = (paymentsArr) => {
    let totalCredit = 0;
    let totalDebit = 0;
    (paymentsArr || []).forEach(p => {
      const amt = Number(p.amount) || 0;
      if (p.type === 'credit') totalCredit += amt;
      else totalDebit += amt;
    });
    const netPaid = totalCredit - totalDebit;
    return { totalCredit, totalDebit, netPaid };
  };

  // Determine the applicable fee (student-specific or default)
  const appliedFee = Number(student?.appliedFee) || 0;
  const monthlyFee = Number(student?.monthlyFee) || 0;
  const usedFee = appliedFee > 0 ? appliedFee : monthlyFee;
  const hasCustomFee = appliedFee > 0 && appliedFee !== monthlyFee;

  // Calculate totals
  const totalCredit = payments
    .filter(p => p.type === 'credit')
    .reduce((a, b) => a + (Number(b.amount) || 0), 0);
    
  const totalDebit = payments
    .filter(p => p.type === 'debit')
    .reduce((a, b) => a + (Number(b.amount) || 0), 0);
    
  // Initial fee is considered as a debit (money owed by student)
  const initialFeeDebit = usedFee || 0;
  const totalDebitIncludingFee = totalDebit + initialFeeDebit;
  
  // Net paid is total payments (credit) minus refunds (debit) and initial fee
  const netPaid = totalCredit - totalDebitIncludingFee;
  
  // Current balance (positive = pending, negative = advance)
  const currentBalance = usedFee - (totalCredit - totalDebit);

  // For UI: separate due vs advance so we can display them in Debit/Credit columns
  const feesDue = currentBalance > 0 ? currentBalance : 0;
  const advancePaid = currentBalance < 0 ? Math.abs(currentBalance) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(`/hostel/${hostelId}/students`)} style={styles.backButton}>
          <ArrowLeft size={18} />
          <span style={{ marginLeft: '0.5rem' }}>Back to Students</span>
        </button>
        <h1 style={styles.title}>Manage Payments</h1>
        {/* ledger controls moved into student info section */}
      </div>

      <div style={styles.content}>
        <div style={styles.studentInfo}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h2 style={styles.studentName}>{student.studentName}</h2>
              {/* <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Application No: <strong style={{ color: '#111827' }}>{student.applicationNumber || student.applicationNo || student.application_id || student.appNo || '—'}</strong></div> */}
              <div style={styles.balanceSection}>
                <span>Current Balance:</span>
                <div style={{
                  ...styles.balanceAmount,
                  color: feesDue > 0 ? '#dc2626' : (advancePaid > 0 ? '#059669' : '#6b7280')  // Red if due, green if advance, gray if zero
                }}>
                  {feesDue > 0 ? 
                    `Due: ${formatCurrency(feesDue)}` : 
                    (advancePaid > 0 ? `Advance: ${formatCurrency(advancePaid)}` : `₹0`)}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={styles.infoButton}
                    title="View Payment History"
                  >
                    <Info size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>From</label>
                <input type="date" value={ledgerStart} onChange={(e) => setLedgerStart(e.target.value)} style={{ padding: '6px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>To</label>
                <input type="date" value={ledgerEnd} onChange={(e) => setLedgerEnd(e.target.value)} style={{ padding: '6px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => generateLedger(ledgerStart, ledgerEnd)} style={{ padding: '8px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{ledgerLoading ? 'Generating...' : 'Generate Ledger'}</button>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.formSection}>
          <h3 style={styles.formTitle}>Add New Payment</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Amount</label>
              <input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                style={styles.input}
                required
                min="0"
              />
            </div>


            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Mode</label>
              <select
                value={newPayment.paymentMode}
                onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMode: e.target.value }))}
                style={styles.select}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Remarks</label>
              <textarea
                value={newPayment.remarks}
                onChange={(e) => setNewPayment(prev => ({ ...prev, remarks: e.target.value }))}
                style={{ ...styles.input, minHeight: '80px' }}
                placeholder="Add any additional notes here..."
              />
            </div>

            <button type="submit" style={styles.submitButton}>Add Payment</button>
          </form>
        </div>

        {showHistory && (
          <div style={styles.historyModal}>
            <div style={styles.historyContent}>
              <div style={styles.historyHeader}>
                <h3>Payment History</h3>
                <button onClick={() => setShowHistory(false)} style={styles.closeButton}>×</button>
              </div>
              {/* Summary */}
              <div style={styles.historySummary}>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Hostel Fee (Debit)</div>
                  <div style={{ ...styles.summaryValue, color: '#dc2626' }}>{formatCurrency(usedFee)}</div>
                </div>
                {hasCustomFee && monthlyFee > 0 && (
                  <div style={styles.summaryItem}>
                    <div style={{ ...styles.summaryLabel, fontSize: '0.9em', color: '#6b7280' }}>Standard Fee</div>
                    <div style={{ ...styles.summaryValue, fontSize: '0.9em', color: '#6b7280' }}>{formatCurrency(monthlyFee)}</div>
                  </div>
                )}
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Total Received</div>
                  <div style={{ ...styles.summaryValue, color: '#059669' }}>{formatCurrency(totalCredit)}</div>
                </div>
                      <div style={{ ...styles.summaryItem, borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ ...styles.summaryLabel, fontWeight: '600' }}>Current Balance</div>
                        <div style={{ 
                          ...styles.summaryValue, 
                          color: feesDue > 0 ? '#b91c1c' : (advancePaid > 0 ? '#059669' : '#6b7280'),
                          fontWeight: '600'
                        }}>
                          {feesDue > 0 
                            ? `Due: ${formatCurrency(feesDue)}` 
                            : (advancePaid > 0 ? `Advance: ${formatCurrency(advancePaid)}` : `₹0`)}
                        </div>
                      </div>
              </div>

              <div style={styles.historyList}>
                {payments.length === 0 ? (
                  <div style={styles.noHistory}>No payment records found</div>
                ) : (
                  <div style={styles.historyTableWrapper}>
                    <table style={styles.historyTable}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>Mode</th>
                          <th style={styles.th}>Remarks</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>Debit</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{formatDate(student.createdAt || new Date().toISOString())}</td>
                          <td>—</td>
                          <td>
                            {hasCustomFee ? (
                              <div>
                                <div>Applied Monthly Fee</div>
                                <div style={{ fontSize: '0.8em', color: '#6b7280' }}>
                                  (Standard: {formatCurrency(monthlyFee)})
                                </div>
                              </div>
                            ) : 'Monthly Fee'}
                          </td>
                          <td style={{ textAlign: 'right', color: '#dc2626' }}>
                            {formatCurrency(usedFee)}
                          </td>
                          <td style={{ textAlign: 'right' }}>—</td>
                        </tr>
                        {payments.map((payment, i) => (
                          <tr key={i}>
                            <td>{formatDate(payment.timestamp)}</td>
                            <td>{payment.paymentMode}</td>
                            <td>{payment.remarks || '—'}</td>
                            <td style={{ textAlign: 'right', color: payment.type === 'debit' ? '#dc2626' : undefined }}>
                              {payment.type === 'debit' ? formatCurrency(payment.amount) : ''}
                            </td>
                            <td style={{ textAlign: 'right', color: payment.type === 'credit' ? '#059669' : undefined }}>
                              {payment.type === 'credit' ? formatCurrency(payment.amount) : ''}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'right', fontWeight: '600' }}>Balance</td>
                          <td style={{ textAlign: 'right', color: feesDue > 0 ? '#b91c1c' : '#6b7280', fontWeight: 600 }}>
                            {feesDue > 0 ? formatCurrency(feesDue) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', color: advancePaid > 0 ? '#059669' : '#6b7280', fontWeight: 600 }}>
                            {advancePaid > 0 ? formatCurrency(advancePaid) : '—'}
                          </td>
                        </tr>
                      </tbody>

                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {ledgerVisible && (
          <div style={{ marginTop: 16, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #eef2ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Ledger Report</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={downloadLedgerCsv} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Download Excel (CSV)</button>
                <button onClick={downloadLedgerPdf} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #8b5cf6', background: '#8b5cf6', color: 'white', cursor: 'pointer' }}>Download PDF</button>
                <button onClick={() => { setLedgerVisible(false); }} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Close</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Opening Balance: {formatCurrency(ledgerOpeningBalance)}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Payment Mode</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Debit</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Credit</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Running</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>No transactions in the selected period</td></tr>
                    ) : (
                      ledgerRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ padding: 8 }}>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: 8 }}>{r.paymentMode}</td>
                          <td style={{ padding: 8, textAlign: 'right', color: r.debit ? '#dc2626' : undefined }}>{r.debit || ''}</td>
                          <td style={{ padding: 8, textAlign: 'right', color: r.credit ? '#059669' : undefined }}>{r.credit || ''}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(r.running)}</td>
                        </tr>
                      ))
                    )}
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', padding: 8, fontWeight: 700 }}>Closing Balance</td>
                      <td style={{ textAlign: 'right', padding: 8, fontWeight: 700 }}>{formatCurrency(ledgerRows.length ? ledgerRows[ledgerRows.length-1].running : ledgerOpeningBalance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem',
    gap: '1rem',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#374151',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '1.5rem',
  },
  studentInfo: {
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
  },
  studentName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.5rem',
  },
  balanceSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    color: '#4b5563',
  },
  balanceAmount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
  },
  infoButton: {
    background: 'none',
    border: 'none',
    padding: '0.25rem',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#374151',
    },
  },
  formSection: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  formTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 1px #8b5cf6',
    },
  },
  select: {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 1px #8b5cf6',
    },
  },
  submitButton: {
    padding: '0.75rem',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#7c3aed',
    },
  },
  historyModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  historyContent: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  historyHeader: {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historySummary: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #eef2ff',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap'
  },
  summaryItem: {
    minWidth: '140px',
    display: 'flex',
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.25rem',
    '&:hover': {
      color: '#374151',
    },
  },
  historyList: {
    padding: '1rem',
    overflowY: 'auto',
  },
  historyTableWrapper: {
    overflowX: 'auto',
  },
  historyTable: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '640px',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    backgroundColor: 'white',
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.875rem',
    color: '#374151',
    verticalAlign: 'top'
  },
  historyItem: {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  historyItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  historyDate: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  historyAmount: {
    fontWeight: '600',
  },
  historyItemDetails: {
    fontSize: '0.875rem',
  },
  paymentMode: {
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  remarks: {
    marginTop: '0.25rem',
    color: '#374151',
  },
  noHistory: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  },
};

export default StudentPayments;