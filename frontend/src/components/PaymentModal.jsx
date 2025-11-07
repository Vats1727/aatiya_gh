import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function PaymentModal({ visible, onClose, student, hostelId, hostelFee }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('credit');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !student) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/payments/${encodeURIComponent(student.id)}`);
        if (!res.ok) throw new Error('Failed to load payments');
        const payload = await res.json();
        if (!mounted) return;
        setPayments(payload.data || []);
      } catch (err) {
        console.error('Failed to fetch payments', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [visible, student]);

  const totalPaid = payments.reduce((s, p) => s + (p.type === 'credit' ? Number(p.amount || 0) : -Number(p.amount || 0)), 0);
  const pending = (Number(hostelFee || 0) - totalPaid) || 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert('Enter a valid amount');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        student_id: student.id,
        hostel_id: hostelId,
        amount: Number(amount),
        type,
        remarks,
        month: null
      };
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to add payment');
      }
      const data = await res.json();
      setPayments(prev => [data.data || { id: data.id, ...payload }, ...prev]);
      setAmount(''); setRemarks(''); setType('credit');
    } catch (err) {
      console.error('Add payment failed', err);
      alert('Failed to add payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(920px, 95%)', background: '#fff', borderRadius: 8, padding: 16, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Payments — {student.studentName || student.name || 'Student'}</h3>
          <div>
            <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: 6 }}>Close</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', padding: 12, borderRadius: 8, background: '#f8fafc' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Hostel fee</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{hostelFee ? `${hostelFee}` : 'N/A'}</div>
          </div>
          <div style={{ flex: '1 1 200px', padding: 12, borderRadius: 8, background: '#f8fafc' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Total paid</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{totalPaid}</div>
          </div>
          <div style={{ flex: '1 1 200px', padding: 12, borderRadius: 8, background: '#fff1f2' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Pending amount</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#dc2626' }}>{pending}</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Transaction history</h4>
          {loading ? <div>Loading...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #fafafa' }}>{p.created_at ? new Date(p.created_at._seconds ? p.created_at._seconds * 1000 : p.created_at).toLocaleString() : '—'}</td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #fafafa' }}>{p.amount}</td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #fafafa' }}>{p.type}</td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #fafafa' }}>{p.remarks || ''}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={4} style={{ padding: 12 }}>No transactions yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Add payment</h4>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', flex: '1 1 150px' }} />
              <select value={type} onChange={e => setType(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <input placeholder="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', flex: '1 1 240px' }} />
              <button type="submit" disabled={submitting} style={{ padding: '8px 12px', borderRadius: 6, background: '#10b981', color: 'white', border: 'none' }}>{submitting ? 'Adding...' : 'Add Payment'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
