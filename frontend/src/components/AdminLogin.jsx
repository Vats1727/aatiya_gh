import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
    },
    form: {
      background: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
    },
    title: {
      textAlign: 'center',
      color: '#db2777',
      fontSize: '2rem',
      marginBottom: '2rem',
    },
    inputGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#374151',
      fontWeight: '600',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #fbcfe8',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      outline: 'none',
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    },
    error: {
      color: '#ef4444',
      marginBottom: '1rem',
      textAlign: 'center',
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      localStorage.setItem('adminAuthenticated', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Admin Login</h1>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>
        <button
          type="submit"
          style={styles.button}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;