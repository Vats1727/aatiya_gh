import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const HostelRegister = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    const token = localStorage.getItem('token');
    if (!token) return setMsg('Not authenticated');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/hostels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, address })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || 'Failed to create hostel');
        return;
      }
      const payload = await res.json();
      setMsg(`Created hostel ${payload.hostelId} - ${payload.name}`);
      setName(''); setAddress('');
    } catch (err) {
      console.error(err);
      setMsg('Failed to create hostel');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Hostel</h2>
      {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Hostel name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>{loading ? 'Creating...' : 'Create Hostel'}</button>
      </form>
    </div>
  );
};

export default HostelRegister;
