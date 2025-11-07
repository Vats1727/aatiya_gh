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
        const studentData = await studentRes.json();
        setStudent(studentData);

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

      // Update student's current balance (assume currentBalance = amount owed)
      setStudent(prev => {
        const prevBalance = Number(prev?.currentBalance) || 0;
        const newBalance = type === 'credit' ? prevBalance - amount : prevBalance + amount;
        return {
          ...prev,
          currentBalance: newBalance
        };
      });

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

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

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

  // derived totals for UI
  const totals = calculateTotals(payments);
  const studentFees = Number(student?.hostelFees ?? student?.fees ?? student?.totalFees ?? 0);
  const feesDue = studentFees ? Math.max(0, studentFees - totals.netPaid) : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(`/hostel/${hostelId}/students`)} style={styles.backButton}>
          <ArrowLeft size={18} />
          <span style={{ marginLeft: '0.5rem' }}>Back to Students</span>
        </button>
        <h1 style={styles.title}>Manage Payments</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.studentInfo}>
          <h2 style={styles.studentName}>{student.studentName}</h2>
          <div style={styles.balanceSection}>
            <span>Current Balance:</span>
            <div style={styles.balanceAmount}>
              ₹{student.currentBalance || 0}
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
              <label style={styles.label}>Type</label>
              <select
                value={newPayment.type}
                onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value }))}
                style={styles.select}
              >
                <option value="credit">Payment Received</option>
                <option value="debit">Refund/Adjustment</option>
              </select>
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
                  <div style={styles.summaryLabel}>Total Paid</div>
                  <div style={{ ...styles.summaryValue, color: '#059669' }}>{formatCurrency(totals.totalCredit)}</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Total Refunds</div>
                  <div style={{ ...styles.summaryValue, color: '#dc2626' }}>{formatCurrency(totals.totalDebit)}</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Net Paid</div>
                  <div style={styles.summaryValue}>{formatCurrency(totals.netPaid)}</div>
                </div>
                {studentFees > 0 && (
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Fees Due</div>
                    <div style={{ ...styles.summaryValue, color: feesDue > 0 ? '#b91c1c' : '#059669' }}>{formatCurrency(feesDue)}</div>
                  </div>
                )}
              </div>

              <div style={styles.historyList}>
                {payments.length === 0 ? (
                  <div style={styles.noHistory}>No payment records found</div>
                ) : (
                  payments.map((payment, index) => (
                    <div key={payment.id || index} style={styles.historyItem}>
                      <div style={styles.historyItemHeader}>
                        <span style={styles.historyDate}>{formatDate(payment.timestamp)}</span>
                        <span style={{
                          ...styles.historyAmount,
                          color: payment.type === 'credit' ? '#059669' : '#dc2626'
                        }}>
                          {payment.type === 'credit' ? '+' : '-'}₹{payment.amount}
                        </span>
                      </div>
                      <div style={styles.historyItemDetails}>
                        <span style={styles.paymentMode}>Mode: {payment.paymentMode}</span>
                        {payment.remarks && (
                          <div style={styles.remarks}>{payment.remarks}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
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