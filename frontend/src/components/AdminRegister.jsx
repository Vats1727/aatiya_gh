import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminRegister = () => {
  const [form, setForm] = useState({ fullName: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.username || !form.password) return setError('All fields required');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, username: form.username, password: form.password, role: 'admin' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Registration failed');
        return;
      }
      const payload = await res.json();
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Register error', err);
      setError('Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, width: 360 }}>
        <h2 style={{ marginTop: 0 }}>Admin Register</h2>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 8 }}>
          <label>Full name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Username</label>
          <input name="username" value={form.username} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Confirm Password</label>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
    </div>
  );
};

export default AdminRegister;
