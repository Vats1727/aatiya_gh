import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';

// Use the same API_BASE as other components
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

// For debugging
console.log('API_BASE:', API_BASE);

// Helper to calculate closing balance
const calculateClosingBalance = (currentBalance, amount) => {
  const current = parseFloat(currentBalance) || 0;
  const payment = parseFloat(amount) || 0;
  return (current + payment).toFixed(2);
};

const PaymentPage = () => {
  const { hostelId, studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [remarks, setRemarks] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  useEffect(() => {
    const fetchStudentAndPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin');
          return;
        }

        console.log('Fetching from:', `${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`);

        // Fetch student details
        const response = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Log response status and headers for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
          const text = await response.text();
          console.error('Response text:', text);
          throw new Error(`Failed to fetch student: ${response.status} ${text}`);
        }

        // Try to parse as JSON
        let data;
        try {
          const text = await response.text();
          console.log('Response text:', text);
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          throw new Error('Invalid JSON response from server');
        }

        const studentData = data.data || data; // Handle both response formats
        
        if (!studentData) {
          throw new Error('No student data received');
        }

        console.log('Received student data:', studentData);
        
        setStudent(studentData);
        setCurrentBalance(studentData.currentBalance || 0);
        
        // Fetch payment history if it exists
        if (studentData.payments && Array.isArray(studentData.payments)) {
          setPaymentHistory(studentData.payments);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        alert(`Error loading student data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndPayments();
  }, [hostelId, studentId, navigate]);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');

      const payment = {
        amount: Number(paymentAmount),
        mode: paymentMode,
        remarks,
        timestamp: new Date().toISOString(),
        type: 'credit', // credit means payment received
        currentBalance: Number(currentBalance),
        closingBalance: Number(calculateClosingBalance(currentBalance, paymentAmount))
      };

      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payment)
      });

      if (!res.ok) throw new Error('Failed to save payment');

      const updated = await res.json();
      const updatedData = updated.data || updated;
      
      setStudent(updatedData);
      setCurrentBalance(updatedData.currentBalance || 0);
      if (updatedData.payments) {
        setPaymentHistory(updatedData.payments);
      }
      
      // Reset form
      setPaymentAmount('');
      setRemarks('');
      alert('Payment recorded successfully');

    } catch (err) {
      console.error('Payment failed:', err);
      alert('Failed to record payment');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!student) {
    return <div>Student not found</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Static profile navbar (sticky) - show current admin info if available */}
      {(() => {
        let stored = null;
        try { stored = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { stored = null; }
        const display = stored?.name || stored?.displayName || (stored?.email && stored.email.split('@')[0]) || null;
        if (!display) return null;
        return (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 8, zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {String(display).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{display}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{stored?.email || ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => navigate(`/hostel/${hostelId}/students`)} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#06b6d4', color: 'white', cursor: 'pointer' }}>Student list</button>
                <button onClick={() => navigate('/admin/dashboard')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#06b6d4', color: 'white', cursor: 'pointer' }}>Hostel list</button>
                <button onClick={() => { localStorage.removeItem('token'); navigate('/admin'); }} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>Logout</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Payment Details - {student.studentName}</h2>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '20px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Current Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              ₹{currentBalance}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Closing Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              ₹{calculateClosingBalance(currentBalance, paymentAmount)}
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="View Payment History"
          >
            <Info size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmitPayment}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Payment Amount (₹)
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => {
                setPaymentAmount(e.target.value);
                setClosingBalance(calculateClosingBalance(currentBalance, e.target.value));
              }}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                minHeight: '80px'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: '#10b981',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Record Payment
          </button>
        </form>
      </div>

      {/* Payment History Modal */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Payment History</h3>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ×
              </button>
            </div>

            {paymentHistory.length === 0 ? (
              <p>No payment history available</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Mode</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        {new Date(payment.timestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        ₹{payment.amount}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        {payment.type === 'credit' ? 'Received' : 'Debit'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        {payment.mode}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        {payment.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;