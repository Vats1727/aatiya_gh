import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, signInWithEmailAndPassword } from '../firebase';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

// Hardcoded superadmin credentials
const SUPERADMIN_CREDENTIALS = {
  username: 'superadmin@gmail.com',
  password: 'superadmin@123'
};

// Common styles for consistent UI
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)',
    padding: '1.5rem',
    boxSizing: 'border-box',
    width: '100%',
  },
  card: {
    background: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '28rem',
    padding: '2.5rem',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logo: {
    width: '3.5rem',
    height: '3.5rem',
    margin: '0 auto 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.75rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.5rem',
    lineHeight: '1.25',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.9375rem',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.9375rem',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
      backgroundColor: 'white',
    },
    '&::placeholder': {
      color: '#94a3b8',
    },
  },
  passwordWrapper: {
    position: 'relative',
  },
  togglePassword: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    cursor: 'pointer',
    '&:hover': {
      color: '#64748b',
    },
  },
  button: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    '&:hover': {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    },
    '&:disabled': {
      opacity: '0.7',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    border: '1px solid #fecaca',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  link: {
    color: '#3b82f6',
    fontWeight: '500',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
};

// Mobile styles
const mobileStyles = {
  '@media (max-width: 640px)': {
    container: {
      padding: '1rem',
    },
    card: {
      padding: '1.5rem',
    },
    title: {
      fontSize: '1.25rem',
    },
  },
};

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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

  // Merge base styles with mobile styles if needed
  const getResponsiveStyles = (baseStyle) => {
    return {
      ...baseStyle,
      ...(window.innerWidth <= 640 && mobileStyles['@media (max-width: 640px)'])
    };
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <Lock size={24} />
          </div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to your admin account</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}
          
          <div style={styles.inputGroup}>
            <Mail size={18} style={styles.inputIcon} />
            <input
              type="email"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              style={styles.input}
              autoComplete="username"
              autoFocus
            />
          </div>
          
          <div style={styles.inputGroup}>
            <Lock size={18} style={styles.inputIcon} />
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                style={styles.input}
                autoComplete="current-password"
              />
              <div onClick={() => setShowPassword(!showPassword)} style={styles.togglePassword}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading || !credentials.username || !credentials.password}
            style={{
              ...styles.button,
              opacity: (isLoading || !credentials.username || !credentials.password) ? 0.7 : 1,
              cursor: (isLoading || !credentials.username || !credentials.password) ? 'not-allowed' : 'pointer',
              ':active': {
                transform: (isLoading || !credentials.username || !credentials.password) ? 'scale(1)' : 'scale(0.98)',
              },
              ':hover': {
                transform: (isLoading || !credentials.username || !credentials.password) ? 'scale(1)' : 'scale(1.02)',
              },
            }}
            onMouseOver={(e) => !isLoading && !(!credentials.username || !credentials.password) && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={(e) => !isLoading && !(!credentials.username || !credentials.password) && (e.currentTarget.style.transform = 'scale(0.98)')}
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
    </div>
  );
};

export default AdminLogin;