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

  // Apply responsive styles
const applyResponsiveStyles = (styleObj) => {
  const result = { ...styleObj };
  
  // Remove media query properties
  Object.keys(result).forEach(key => {
    if (key.startsWith('@media')) {
      delete result[key];
    }
  });

  // Apply mobile styles if needed
  if (window.innerWidth < 768) {
    if (styleObj['@media (max-width: 768px)']) {
      Object.assign(result, styleObj['@media (max-width: 768px)']);
    }
  }
  
  if (window.innerWidth < 480) {
    if (styleObj['@media (max-width: 480px)']) {
      Object.assign(result, styleObj['@media (max-width: 480px)']);
    }
  }

  return result;
};

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

  // Store the raw token (no 'Bearer ' prefix)
  localStorage.setItem('token', idToken);
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
  // Use the admin dashboard route to match admin area routing
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