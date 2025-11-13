import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, signInWithEmailAndPassword } from '../firebase';

// Hardcoded superadmin credentials
const SUPERADMIN_CREDENTIALS = {
  username: 'superadmin@gmail.com',
  password: 'superadmin@123'
};

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)',
      padding: '1rem',
      boxSizing: 'border-box',
      width: '100%',
      minWidth: '320px',
    },
    form: {
      background: 'white',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      width: '100%',
      maxWidth: '480px',
      margin: '0.5rem',
      boxSizing: 'border-box',
      border: '1px solid #e2e8f0',
    },
    title: {
      textAlign: 'center',
      color: '#1e293b',
      fontSize: '1.5rem',
      marginBottom: '1.25rem',
      lineHeight: '1.25',
      fontWeight: '600',
    },
    inputGroup: {
      marginBottom: '1rem',
      width: '100%',
    },
    label: {
      display: 'block',
      marginBottom: '0.375rem',
      color: '#334155',
      fontWeight: '500',
      fontSize: '0.875rem',
    },
    input: {
      width: '100%',
      padding: '0.625rem 0.875rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      minHeight: '44px',
      backgroundColor: '#ffffff',
    },
    button: {
      width: '100%',
      padding: '0.75rem 1rem',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      WebkitTapHighlightColor: 'transparent',
      minHeight: '44px',
      marginTop: '0.25rem',
      // hover/active handled via inline handlers where needed
    },
    error: {
      color: '#b91c1c',
      marginBottom: '1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      fontWeight: '500',
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if superadmin credentials
      if (
        credentials.username === SUPERADMIN_CREDENTIALS.username &&
        credentials.password === SUPERADMIN_CREDENTIALS.password
      ) {
        // Set superadmin token and navigate to superadmin dashboard
        localStorage.setItem('token', 'superadmin-token');
        localStorage.setItem('isSuperAdmin', 'true');
        const profile = { name: 'Super Admin', email: credentials.username };
        localStorage.setItem('user', JSON.stringify(profile));
        navigate('/admin/dashboard');
        return;
      }

      // Regular admin login via Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.username,
        credentials.password
      );
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();

      // Store the raw token (no 'Bearer ' prefix)
      localStorage.setItem('token', idToken);
      localStorage.setItem('isSuperAdmin', 'false');
      
      // Decode token payload and store a lightweight user profile for UI
      try {
        const payloadPart = idToken.split('.')[1];
        if (payloadPart) {
          const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
          const json = decodeURIComponent(atob(padded).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(json);
          const profile = { name: payload.name || payload.displayName || payload.email?.split?.('@')?.[0] || '', email: payload.email };
          localStorage.setItem('user', JSON.stringify(profile));
        }
      } catch (e) {
        // ignore decode errors
      }
      
      // Navigate after successful login
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Admin Login</h1>
        
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter your email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="off"
          />
        </div>
        
        <div style={styles.inputGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={styles.label}>Password</label>
            {/* <Link 
              to="/forgot-password" 
              style={{
                fontSize: '0.875rem',
                color: '#7c3aed',
                textDecoration: 'none',
                fontWeight: '500',
                ':hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Forgot Password?
            </Link> */}
          </div>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.button,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            ':active': {
              transform: isLoading ? 'scale(1)' : 'scale(0.98)',
            },
            ':hover': {
              transform: isLoading ? 'scale(1)' : 'scale(1.02)',
            },
          }}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseOut={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
          onTouchStart={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
          onTouchEnd={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: '#4b5563',
          fontSize: '0.9375rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
        }}>
          Don't have an account?{' '}
          <Link 
            to="/admin/register" 
            style={{
              color: '#7c3aed',
              textDecoration: 'none',
              fontWeight: '600',
              ':hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;