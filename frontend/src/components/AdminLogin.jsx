import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        navigate('/hostel-register');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Base styles for the component
  const baseStyles = {
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
    // Responsive overrides for mobile
    '@media (max-width: 600px)': {
      container: {
        padding: '0.75rem',
        minHeight: '100%',
        height: '100%',
        alignItems: 'flex-start',
        paddingTop: '2rem',
        background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%)',
      },
      form: {
        padding: '1.75rem 1.5rem',
        margin: '0.5rem',
        maxWidth: '100%',
        borderRadius: '1rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
      },
      title: {
        fontSize: '1.65rem',
        marginBottom: '1.5rem',
      },
      inputGroup: {
        marginBottom: '1.25rem',
      },
      input: {
        fontSize: '1.05rem',
        padding: '0.875rem 1rem',
        minHeight: '56px',
      },
      button: {
        fontSize: '1.1rem',
        padding: '1rem',
        minHeight: '56px',
      },
      label: {
        fontSize: '1rem',
        marginBottom: '0.625rem',
      },
    },
    // Extra small devices
    '@media (max-width: 360px)': {
      form: {
        padding: '1.5rem 1.25rem',
      },
      title: {
        fontSize: '1.5rem',
        marginBottom: '1.25rem',
      },
      input: {
        fontSize: '1rem',
      },
    },
  };

  const applyResponsiveStyles = (styleObj) => {
    if (!styleObj) return {};
    
    const appliedStyles = { ...styleObj };
    
    // Handle nested media queries
    if (window.innerWidth <= 768 && styleObj['@media (max-width: 768px)']) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 768px)']);
    }
    if (window.innerWidth <= 480 && styleObj['@media (max-width: 480px)']) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 480px)']);
    }
    
    // Remove media query keys to prevent React warnings
    const { '@media (max-width: 768px)': mq768, '@media (max-width: 480px)': mq480, ...cleanStyles } = appliedStyles;
    
    return cleanStyles;
  };

  // Add keyframes for loading spinner
  const keyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.email || !credentials.password) {
      return setError('Please enter both email and password');
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      // On successful login, redirect to hostel registration
      navigate('/hostel/register');
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different Firebase auth errors
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.');
          break;
        default:
          setError('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={applyResponsiveStyles(baseStyles.container)}>
        <form style={applyResponsiveStyles(baseStyles.form)} onSubmit={handleSubmit}>
          <h1 style={applyResponsiveStyles(baseStyles.title)}>Admin Login</h1>
          
          {error && (
            <div style={{
              ...applyResponsiveStyles(baseStyles.error),
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          
          <div style={applyResponsiveStyles(baseStyles.inputGroup)}>
            <label style={applyResponsiveStyles(baseStyles.label)}>Email</label>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              style={applyResponsiveStyles(baseStyles.input)}
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
            />
          </div>
          
          <div style={applyResponsiveStyles(baseStyles.inputGroup)}>
            <label style={applyResponsiveStyles(baseStyles.label)}>Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              style={applyResponsiveStyles(baseStyles.input)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
          
          <button
            type="submit"
            style={{
              ...applyResponsiveStyles(baseStyles.button),
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              position: 'relative'
            }}
            disabled={isLoading || !credentials.email || !credentials.password}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {isLoading && (
              <span style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1rem',
                height: '1rem',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                display: 'inline-block'
              }}></span>
            )}
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
    </>
  );
};

export default AdminLogin;