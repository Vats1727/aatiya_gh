import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, signInWithEmailAndPassword } from '../firebase';

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
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1rem',
      boxSizing: 'border-box',
      width: '100%',
      minWidth: '320px', // Ensure minimum width for very small devices
    },
    form: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      margin: '1rem',
      boxSizing: 'border-box',
      border: '1px solid rgba(0, 0, 0, 0.05)',
    },
    title: {
      textAlign: 'center',
      color: '#db2777',
      fontSize: '1.75rem',
      marginBottom: '1.5rem',
      lineHeight: '1.2',
      fontWeight: '700',
    },
    inputGroup: {
      marginBottom: '1.5rem',
      width: '100%',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#374151',
      fontWeight: '600',
      fontSize: '0.9375rem',
    },
    input: {
      width: '100%',
      padding: '0.875rem 1rem',
      border: '2px solid #f0f0f0',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      minHeight: '52px',
      backgroundColor: '#f9fafb',
      ':focus': {
        borderColor: '#ec4899',
        boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)',
        backgroundColor: '#ffffff',
      },
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.75rem',
      fontSize: '1.05rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      WebkitTapHighlightColor: 'transparent',
      minHeight: '52px',
      marginTop: '0.5rem',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)',
      },
      ':active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 5px rgba(147, 51, 234, 0.3)',
      },
      ':disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
    },
    error: {
      color: '#dc2626',
      marginBottom: '1.25rem',
      textAlign: 'center',
      fontSize: '0.9375rem',
      padding: '0.875rem',
      borderRadius: '0.5rem',
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.username,
        credentials.password
      );
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Store the token in localStorage with 'Bearer ' prefix
      localStorage.setItem('token', `Bearer ${idToken}`);
      
      // Navigate after successful login
      navigate('/dashboard');
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
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="off"
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
            placeholder="Enter password"
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
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <span style={{ color: '#6b7280' }}>Don't have an account? </span>
          <Link 
            to="/register" 
            style={{
              color: '#9333ea',
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