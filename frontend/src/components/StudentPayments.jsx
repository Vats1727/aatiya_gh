import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import '../Styles/StudentPayments.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StudentPayments = () => {
  const { hostelId, studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
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
                  monthlyFeeCurrency: found.monthlyFeeCurrency || found.monthlyfeeCurrency || studentObj.monthlyFeeCurrency || 'INR'
                };
              }
            }
          }
        } catch (e) {
          // ignore enrichment errors and continue with whatever studentObj we have
          console.warn('Failed to enrich student with hostel data:', e);
        }

        setStudent(studentObj);

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
      <div className="studentpayments-container">
        <div className="studentpayments-loading">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="studentpayments-container">
        <div className="studentpayments-error">Student not found</div>
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
    <div className="studentpayments-container">
      <div className="studentpayments-header">
        <button onClick={() => navigate(`/hostel/${hostelId}/students`)} className="studentpayments-backButton">
          <ArrowLeft size={18} />
          <span className="studentpayments-backText">Back to Students</span>
        </button>
        <h1 className="studentpayments-title">Manage Payments</h1>
      </div>

      <div className="studentpayments-content">
        <div className="studentpayments-studentInfo">
          <h2 className="studentpayments-studentName">{student.studentName}</h2>
          <div className="studentpayments-balanceSection">
            <span>Current Balance:</span>
            <div className={`studentpayments-balanceAmount ${feesDue > 0 ? 'text-red' : (advancePaid > 0 ? 'text-green' : 'text-muted')}`}>
              {feesDue > 0 ?
                `Due: ${formatCurrency(feesDue)}` :
                (advancePaid > 0 ? `Advance: ${formatCurrency(advancePaid)}` : `₹0`)}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="studentpayments-infoButton"
                title="View Payment History"
              >
                <Info size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="studentpayments-formSection">
          <h3 className="studentpayments-formTitle">Add New Payment</h3>
          <form onSubmit={handleSubmit} className="studentpayments-form">
            <div className="studentpayments-formGroup">
              <label className="studentpayments-label">Amount</label>
              <input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                className="studentpayments-input"
                required
                min="0"
              />
            </div>


            <div className="studentpayments-formGroup">
              <label className="studentpayments-label">Payment Mode</label>
              <select
                value={newPayment.paymentMode}
                onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMode: e.target.value }))}
                className="studentpayments-select"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="studentpayments-formGroup">
              <label className="studentpayments-label">Remarks</label>
              <textarea
                value={newPayment.remarks}
                onChange={(e) => setNewPayment(prev => ({ ...prev, remarks: e.target.value }))}
                className="studentpayments-textarea"
                placeholder="Add any additional notes here..."
              />
            </div>

            <button type="submit" className="studentpayments-submitButton">Add Payment</button>
          </form>
        </div>

        {showHistory && (
          <div className="studentpayments-historyModal">
            <div className="studentpayments-historyContent">
              <div className="studentpayments-historyHeader">
                <h3>Payment History</h3>
                <button onClick={() => setShowHistory(false)} className="studentpayments-closeButton">×</button>
              </div>
              {/* Summary */}
              <div className="studentpayments-historySummary">
                <div className="studentpayments-summaryItem">
                  <div className="studentpayments-summaryLabel">Hostel Fee (Debit)</div>
                  <div className="studentpayments-summaryValue text-red">{formatCurrency(usedFee)}</div>
                </div>
                {hasCustomFee && monthlyFee > 0 && (
                  <div className="studentpayments-summaryItem">
                    <div className="studentpayments-summaryLabel font-small text-muted">Standard Fee</div>
                    <div className="studentpayments-summaryValue font-small text-muted">{formatCurrency(monthlyFee)}</div>
                  </div>
                )}
                <div className="studentpayments-summaryItem">
                  <div className="studentpayments-summaryLabel">Total Received</div>
                  <div className="studentpayments-summaryValue text-green">{formatCurrency(totalCredit)}</div>
                </div>
                      <div className="studentpayments-summaryItem summary-divider">
                        <div className="studentpayments-summaryLabel font-semibold">Current Balance</div>
                        <div className={`studentpayments-summaryValue font-semibold ${feesDue > 0 ? 'text-red' : (advancePaid > 0 ? 'text-green' : 'text-muted')}`}>
                          {feesDue > 0 
                            ? `Due: ${formatCurrency(feesDue)}` 
                            : (advancePaid > 0 ? `Advance: ${formatCurrency(advancePaid)}` : `₹0`)}
                        </div>
                      </div>
              </div>

              <div className="studentpayments-historyList">
                {payments.length === 0 ? (
                  <div className="studentpayments-noHistory">No payment records found</div>
                ) : (
                  <div className="studentpayments-historyTableWrapper">
                    <table className="studentpayments-historyTable">
                      <thead>
                        <tr>
                          <th className="studentpayments-th">Date</th>
                          <th className="studentpayments-th">Mode</th>
                          <th className="studentpayments-th">Remarks</th>
                          <th className="studentpayments-th text-right">Debit</th>
                          <th className="studentpayments-th text-right">Credit</th>
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
                                <div className="font-small text-muted">
                                  (Standard: {formatCurrency(monthlyFee)})
                                </div>
                              </div>
                            ) : 'Monthly Fee'}
                          </td>
                          <td className="text-right text-red">
                            {formatCurrency(usedFee)}
                          </td>
                          <td className="text-right">—</td>
                        </tr>
                        {payments.map((payment, i) => (
                          <tr key={i}>
                            <td>{formatDate(payment.timestamp)}</td>
                            <td className="paymentMode">{payment.paymentMode}</td>
                            <td className="remarks">{payment.remarks || '—'}</td>
                            <td className={`text-right ${payment.type === 'debit' ? 'text-red' : ''}`}>
                              {payment.type === 'debit' ? formatCurrency(payment.amount) : ''}
                            </td>
                            <td className={`text-right ${payment.type === 'credit' ? 'text-green' : ''}`}>
                              {payment.type === 'credit' ? formatCurrency(payment.amount) : ''}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} className="text-right font-semibold">Balance</td>
                          <td className={`text-right ${feesDue > 0 ? 'text-red' : 'text-muted'} font-semibold`}>
                            {feesDue > 0 ? formatCurrency(feesDue) : '—'}
                          </td>
                          <td className={`text-right ${advancePaid > 0 ? 'text-green' : 'text-muted'} font-semibold`}>
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
      </div>
    </div>
  );
};

export default StudentPayments;