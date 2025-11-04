import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsiveStyles } from '../utils/responsiveStyles';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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

  // Apply responsive styles
  const styles = useResponsiveStyles(baseStyles);

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
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        localStorage.setItem('adminAuthenticated', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Admin Login</h1>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <div style={styles.inputGroup}>
          <label htmlFor="username" style={styles.label}>
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter username"
            disabled={isSubmitting}
            autoComplete="username"
            required
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter password"
            disabled={isSubmitting}
            autoComplete="current-password"
            required
          />
        </div>
        
        <button
          type="submit"
          style={styles.button}
          disabled={isSubmitting || !credentials.username || !credentials.password}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;