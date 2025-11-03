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
    },
    form: {
      background: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      margin: '1rem',
      boxSizing: 'border-box',
    },
    title: {
      textAlign: 'center',
      color: '#db2777',
      fontSize: '1.75rem',
      marginBottom: '1.5rem',
      lineHeight: '1.2',
    },
    inputGroup: {
      marginBottom: '1.25rem',
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
      padding: '0.75rem 1rem',
      border: '2px solid #fbcfe8',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      minHeight: '48px',
      ':focus': {
        borderColor: '#ec4899',
        boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)',
      },
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      WebkitTapHighlightColor: 'transparent',
      minHeight: '48px',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
      ':disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
    },
    error: {
      color: '#ef4444',
      marginBottom: '1rem',
      textAlign: 'center',
      fontSize: '0.9375rem',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
    },
    // Responsive styles
    '@media (max-width: 1024px)': {
      form: {
        padding: '1.75rem',
        maxWidth: '380px',
      },
      title: {
        fontSize: '1.625rem',
      },
    },
    '@media (max-width: 768px)': {
      container: {
        padding: '0.75rem',
      },
      form: {
        padding: '1.5rem',
        margin: '0.75rem',
        maxWidth: '100%',
      },
      title: {
        fontSize: '1.5rem',
        marginBottom: '1.25rem',
      },
      input: {
        padding: '0.75rem',
        fontSize: '0.9375rem',
      },
      button: {
        padding: '0.875rem',
        fontSize: '0.9375rem',
      },
    },
    '@media (max-width: 480px)': {
      container: {
        padding: '0.5rem',
        minHeight: '100vh',
      },
      form: {
        padding: '1.25rem',
        margin: '0.5rem',
        borderRadius: '0.75rem',
      },
      title: {
        fontSize: '1.375rem',
        marginBottom: '1rem',
      },
      inputGroup: {
        marginBottom: '1rem',
      },
      input: {
        padding: '0.75rem',
        fontSize: '0.9375rem',
      },
      button: {
        padding: '0.875rem',
        fontSize: '0.9375rem',
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
      <form 
        style={styles.form} 
        onSubmit={handleSubmit}
        aria-label="Admin login form"
      >
        <h1 style={styles.title}>Admin Login</h1>
        
        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}
        
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
            required
            autoComplete="username"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            disabled={isSubmitting}
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
            required
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            disabled={isSubmitting}
          />
        </div>
        
        <button 
          type="submit" 
          style={{
            ...styles.button,
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-live="polite"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;