import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Add responsive CSS styles
const responsiveStyles = `
  @media (min-width: 768px) {
    .desktop-table {
      display: block !important;
    }
    .mobile-cards {
      display: none !important;
    }
  }

  @media (max-width: 767px) {
    .desktop-table {
      display: none !important;
    }
    .mobile-cards {
      display: flex !important;
    }
  }

  @media (max-width: 640px) {
    .history-controls {
      flex-direction: column;
      gap: 0.5rem;
    }

    .ledger-button {
      width: 100%;
    }

    .payment-form {
      padding: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .card-actions-mobile {
      flex-direction: column;
    }

    .action-button-mobile {
      width: 100%;
    }
  }

  * {
    box-sizing: border-box;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = responsiveStyles;
  if (!document.head.querySelector('style[data-component="StudentPayments"]')) {
    styleTag.setAttribute('data-component', 'StudentPayments');
    document.head.appendChild(styleTag);
  }
}

const StudentPayments = () => {
  const { hostelId, studentId } = useParams();
  const navigate = useNavigate();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
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
    try {
      if (!dateStr) return '—';
      const dateObj = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(dateObj.getTime())) return '—';
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '—';
    }
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

      // Helper function to trim remarks to max 5 words
      const getTruncatedRemarks = (remarks) => {
        if (!remarks) return '';
        const words = String(remarks).trim().split(/\s+/).slice(0, 5);
        return words.join(' ');
      };

      // Prepare rows for payments within [start, end]
      const rows = [];
      let running = openingBal;

      for (const p of allPayments) {
        if (start && p.timestamp < start) continue;
        if (end && p.timestamp > end) continue;

        // compute effect of this transaction
        const amt = Number(p.amount) || 0;
        const remarks = getTruncatedRemarks(p.remarks);
          if (p.type === 'credit') {
            // student paid: reduces due (running = running - amt)
            running = running - amt;
            rows.push({ date: p.timestamp, paymentMode: (p.paymentMode || ''), remarks: remarks, debit: '', credit: amt, running });
          } else {
            // debit (refund/adjustment): increases due
            running = running + amt;
            rows.push({ date: p.timestamp, paymentMode: (p.paymentMode || ''), remarks: remarks, debit: amt, credit: '', running });
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
    lines.push(['Date', 'Payment Mode', 'Debit ', 'Credit ', 'Running Balance '].join(','));
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
                <th style="text-align:left; border-right:1px solid #e6e6e6; padding:8px; border-bottom:1px solid #e6e6e6">Remarks</th>
                <th style="text-align:right; border-right:1px solid #e6e6e6; padding:8px; border-bottom:1px solid #e6e6e6">Debit (₹)</th>
                <th style="text-align:right; border-right:1px solid #e6e6e6; padding:8px; border-bottom:1px solid #e6e6e6">Credit (₹)</th>
                <th style="text-align:right; padding:8px; border-bottom:1px solid #e6e6e6"> Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:8px; border-right:1px solid #e6e6e6">Opening</td>
                <td style="padding:8px; border-right:1px solid #e6e6e6"></td>
                <td style="text-align:right; padding:8px; border-right:1px solid #e6e6e6"></td>
                <td style="text-align:right; padding:8px; border-right:1px solid #e6e6e6"></td>
                <td style="text-align:right; padding:8px">${formatCurrency(ledgerOpeningBalance)} ${ledgerOpeningBalance > 0 ? 'Dr' : ledgerOpeningBalance < 0 ? 'Cr' : ''}</td>
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
          <div style="font-weight:600">Closing Balance: ${formatCurrency(closing)} ${closing > 0 ? 'Dr' : closing < 0 ? 'Cr' : ''}</div>
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
        <h1 style={styles.title}>Manage Payments</h1>
        {/* ledger controls moved into student info section */}
      </div>

      <div style={styles.content}>
        <div style={styles.studentInfo}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'clamp(0.5rem, 3vw, 1rem)', flexDirection: 'row', flexWrap: 'wrap', width: '100%' }} className="student-info-wrapper">
            <div style={{ flex: '1 1 auto', minWidth: 'clamp(150px, 40%, 400px)' }}>
              <h2 style={styles.studentName}>{student.studentName}</h2>
              <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#6b7280', marginBottom: '0.5rem' }}>
                {student.hostelName || student.hostel?.name || 'Hostel'}
              </div>
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

            {/* New Payment button - right aligned at top */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', flexShrink: 0 }}>
              {!showPaymentForm && (
                <button type="button" onClick={() => setShowPaymentForm(true)} style={{ ...styles.submitButton, padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.6rem, 2vw, 1rem)' }}>New Payment</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.75rem)', alignItems: 'flex-end', flexWrap: 'wrap', width: '100%', minWidth: 0 }} className="history-controls">
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 'clamp(100px, 30vw, 150px)' }}>
                <label style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#374151', marginBottom: 4 }}>From</label>
                <input type="date" value={ledgerStart} onChange={(e) => setLedgerStart(e.target.value)} style={{ padding: 'clamp(0.4rem, 1.5vw, 0.5rem)', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 'clamp(100px, 30vw, 150px)' }}>
                <label style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#374151', marginBottom: 4 }}>To</label>
                <input type="date" value={ledgerEnd} onChange={(e) => setLedgerEnd(e.target.value)} style={{ padding: 'clamp(0.4rem, 1.5vw, 0.5rem)', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', boxSizing: 'border-box' }} />
              </div>
              <button onClick={() => generateLedger(ledgerStart, ledgerEnd)} disabled={!ledgerStart || !ledgerEnd} style={{ padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.6rem, 2vw, 0.9rem)', background: (!ledgerStart || !ledgerEnd) ? '#d1d5db' : '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: (!ledgerStart || !ledgerEnd) ? 'not-allowed' : 'pointer', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', fontWeight: '500', whiteSpace: 'nowrap', minWidth: 'clamp(70px, 20vw, 130px)', opacity: (!ledgerStart || !ledgerEnd) ? 0.6 : 1 }} className="ledger-button">{ledgerLoading ? 'Generating...' : 'Generate Ledger'}</button>
            </div>
          </div>
        </div>

        {showPaymentForm && (
          <div style={styles.formSection}>
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
                  <label style={styles.label}>Remarks</label>
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

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={styles.submitButton}>Add Payment</button>
                  <button type="button" onClick={() => { setShowPaymentForm(false); setNewPayment({ amount: '', paymentMode: 'cash', remarks: '', type: 'credit' }); }} style={{ ...styles.actionButton, backgroundColor: '#f3f4f6' }}>Cancel</button>
                </div>
              </form>
            </div>
        )}

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
                    {/* Desktop Table View */}
                    <div style={{ display: 'none' }} className="desktop-table">
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
                                  <div>Rent</div>
                                  <div style={{ fontSize: '0.8em', color: '#6b7280' }}>
                                    (Standard: {formatCurrency(monthlyFee)})
                                  </div>
                                </div>
                              ) : 'Rent'}
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

                    {/* Mobile Card View */}
                    <div style={styles.paymentCardContainer} className="mobile-cards">
                      {/* Opening Fee Card */}
                      <div style={styles.paymentCard}>
                        <div style={styles.cardRow}>
                          <div style={styles.cardLabel}>Date</div>
                          <div style={styles.cardValue}>{formatDate(student.createdAt || new Date().toISOString())}</div>
                        </div>
                        <div style={styles.cardRow}>
                          <div style={styles.cardLabel}>Type</div>
                          <div style={styles.cardValue}>
                            {hasCustomFee ? 'Applied Monthly Fee' : 'Rent'}
                          </div>
                        </div>
                        {hasCustomFee && monthlyFee > 0 && (
                          <div style={styles.cardRow}>
                            <div style={styles.cardLabel}>Standard</div>
                            <div style={styles.cardValue}>{formatCurrency(monthlyFee)}</div>
                          </div>
                        )}
                        <div style={styles.cardRow}>
                          <div style={styles.cardLabel}>Debit</div>
                          <div style={{ ...styles.cardValue, color: '#dc2626', fontWeight: '600' }}>
                            {formatCurrency(usedFee)}
                          </div>
                        </div>
                      </div>

                      {/* Payment History Cards */}
                      {payments.map((payment, i) => (
                        <div key={i} style={styles.paymentCard}>
                          <div style={styles.cardRow}>
                            <div style={styles.cardLabel}>Date</div>
                            <div style={styles.cardValue}>{formatDate(payment.timestamp)}</div>
                          </div>
                          <div style={styles.cardRow}>
                            <div style={styles.cardLabel}>Mode</div>
                            <div style={styles.cardValue}>{payment.paymentMode || '—'}</div>
                          </div>
                          {payment.remarks && (
                            <div style={styles.cardRow}>
                              <div style={styles.cardLabel}>Remarks</div>
                              <div style={styles.cardValue}>{payment.remarks}</div>
                            </div>
                          )}
                          <div style={styles.cardRow}>
                            <div style={styles.cardLabel}>Amount</div>
                            <div style={{
                              ...styles.cardValue,
                              color: payment.type === 'debit' ? '#dc2626' : '#059669',
                              fontWeight: '600'
                            }}>
                              {payment.type === 'debit' ? `Debit: ${formatCurrency(payment.amount)}` : `Credit: ${formatCurrency(payment.amount)}`}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Balance Card */}
                      <div style={{ ...styles.paymentCard, backgroundColor: '#f9fafb', borderLeft: '4px solid #8b5cf6' }}>
                        <div style={{ ...styles.cardRow, fontWeight: '600' }}>
                          <div style={styles.cardLabel}>Balance</div>
                          <div style={{
                            ...styles.cardValue,
                            color: feesDue > 0 ? '#b91c1c' : (advancePaid > 0 ? '#059669' : '#6b7280'),
                            fontWeight: '600'
                          }}>
                            {feesDue > 0 ? `Due: ${formatCurrency(feesDue)}` : (advancePaid > 0 ? `Advance: ${formatCurrency(advancePaid)}` : `₹0`)}
                          </div>
                        </div>
                      </div>
                    </div>
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
                <button onClick={downloadLedgerCsv} style={{ padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', fontWeight: '500', whiteSpace: 'nowrap' }}>Download Excel (CSV)</button>
                <button onClick={downloadLedgerPdf} style={{ padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: 6, border: '1px solid #8b5cf6', background: '#8b5cf6', color: 'white', cursor: 'pointer', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', fontWeight: '500', whiteSpace: 'nowrap' }}>Download PDF</button>
                <button onClick={() => { setLedgerVisible(false); }} style={{ padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', fontWeight: '500', whiteSpace: 'nowrap' }}>Close</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {/* Desktop Table View */}
              <div className="desktop-table" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Remarks</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Debit</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Credit</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>No transactions in the selected period</td></tr>
                    ) : (
                      ledgerRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ padding: 8 }}>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: 8 }}>{r.paymentMode}{r.remarks ? ` (${r.remarks})` : ''}</td>
                          <td style={{ padding: 8, textAlign: 'right', color: r.debit ? '#dc2626' : undefined }}>{r.debit || ''}</td>
                          <td style={{ padding: 8, textAlign: 'right', color: r.credit ? '#059669' : undefined }}>{r.credit || ''}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(r.running)}</td>
                        </tr>
                      ))
                    )}
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', padding: 8, fontWeight: 700 }}>Opening Balance</td>
                      <td style={{ textAlign: 'right', padding: 8, fontWeight: 700 }}>{formatCurrency(ledgerOpeningBalance)} {ledgerOpeningBalance > 0 ? 'Dr' : ledgerOpeningBalance < 0 ? 'Cr' : ''}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', padding: 8, fontWeight: 700 }}>Closing Balance</td>
                      <td style={{ textAlign: 'right', padding: 8, fontWeight: 700 }}>{formatCurrency(ledgerRows.length ? ledgerRows[ledgerRows.length-1].running : ledgerOpeningBalance)} {(ledgerRows.length ? ledgerRows[ledgerRows.length-1].running : ledgerOpeningBalance) > 0 ? 'Dr' : (ledgerRows.length ? ledgerRows[ledgerRows.length-1].running : ledgerOpeningBalance) < 0 ? 'Cr' : ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 3vw, 1rem)' }}>
                {ledgerRows.length === 0 ? (
                  <div style={{ padding: 12, color: '#6b7280', textAlign: 'center' }}>No transactions in the selected period</div>
                ) : (
                  ledgerRows.map((r, i) => (
                    <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 'clamp(0.75rem, 3vw, 1rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#6b7280', minWidth: 'clamp(80px, 30vw, 120px)' }}>Date</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>{new Date(r.date).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#6b7280', minWidth: 'clamp(80px, 30vw, 120px)' }}>Mode</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>{r.paymentMode}{r.remarks ? ` (${r.remarks})` : ''}</span>
                      </div>
                      {r.debit && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: '#6b7280', minWidth: 'clamp(80px, 30vw, 120px)' }}>Debit</span>
                          <span style={{ flex: 1, textAlign: 'right', color: '#dc2626', fontWeight: 500 }}>{r.debit}</span>
                        </div>
                      )}
                      {r.credit && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: '#6b7280', minWidth: 'clamp(80px, 30vw, 120px)' }}>Credit</span>
                          <span style={{ flex: 1, textAlign: 'right', color: '#059669', fontWeight: 500 }}>{r.credit}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, borderTop: '1px solid #d1d5db', paddingTop: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                        <span style={{ fontWeight: 600, color: '#6b7280', minWidth: 'clamp(80px, 30vw, 120px)' }}>Balance</span>
                        <span style={{ flex: 1, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(r.running)}</span>
                      </div>
                    </div>
                  ))
                )}
                {ledgerRows.length > 0 && (
                  <>
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 'clamp(0.75rem, 3vw, 1rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#6b7280', minWidth: 'clamp(80px, 30vw, 120px)' }}>Opening Balance</span>
                        <span style={{ flex: 1, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(ledgerOpeningBalance)} {ledgerOpeningBalance > 0 ? 'Dr' : ledgerOpeningBalance < 0 ? 'Cr' : ''}</span>
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 'clamp(0.75rem, 3vw, 1rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#059669', minWidth: 'clamp(80px, 30vw, 120px)' }}>Closing Balance</span>
                        <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatCurrency(ledgerRows[ledgerRows.length-1].running)} {ledgerRows[ledgerRows.length-1].running > 0 ? 'Dr' : ledgerRows[ledgerRows.length-1].running < 0 ? 'Cr' : ''}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper: Get responsive styles based on screen size
const getResponsiveStyles = () => {
  const isMobile = window?.innerWidth < 768;
  return { isMobile };
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
    padding: '1.5rem',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
    margin: 0,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    gap: '1rem',
    flexWrap: 'wrap',
    padding: '1rem 0',
    borderBottom: '1px solid #e2e8f0',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#4b5563',
    transition: 'all 0.2s ease',
    fontSize: '0.875rem',
    fontWeight: '500',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
    },
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    background: 'linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '1.5rem',
    overflowX: 'auto',
    marginBottom: '2rem',
  },
  studentInfo: {
    marginBottom: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  studentName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.2',
  },
  balanceSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#4b5563',
    fontSize: '1rem',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    borderLeft: '4px solid #8b5cf6',
    marginTop: '0.5rem',
  },
  balanceAmount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e293b',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
  },
  formSection: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 1.5rem 0',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #e2e8f0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '0.25rem',
  },
  input: {
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.9375rem',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
      backgroundColor: 'white',
    },
    '&::placeholder': {
      color: '#94a3b8',
    },
  },
  select: {
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.9375rem',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    width: '100%',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1em',
    paddingRight: '2.5rem',
    transition: 'all 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
      backgroundColor: 'white',
    },
  },
  submitButton: {
    padding: '0.75rem 1.25rem',
    background: 'linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9375rem',
    boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
    },
  },
  cardValue: {
    flex: 1,
    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
    color: '#111827',
    wordBreak: 'break-word',
  },
  historyControls: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
    flexWrap: 'wrap',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  actionButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#4b5563',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: '1 1 auto',
    minWidth: '100px',
    whiteSpace: 'nowrap',
    fontWeight: '500',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  historyModal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem',
    boxSizing: 'border-box',
  },
  historyContent: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: '2rem',
    width: '100%',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#6b7280',
    padding: 0,
    lineHeight: 1,
    transition: 'color 0.2s',
    '&:hover': {
      color: '#111827',
    },
  },
  historySummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  summaryLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  historyList: {
    marginTop: '1.5rem',
  },
  noHistory: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  historyTableWrapper: {
    overflowX: 'auto',
  },
  historyTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    fontWeight: '600',
    color: '#4b5563',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  paymentCardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  paymentCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#ffffff',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  cardLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6b7280',
    flex: '0 0 auto',
  },
};

export default StudentPayments;