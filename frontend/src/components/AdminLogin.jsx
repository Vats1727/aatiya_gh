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
      padding: '1rem',
      boxSizing: 'border-box',
    },
    form: {
      background: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      margin: '1rem',
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
      padding: '0.75rem',
      border: '2px solid #fbcfe8',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    button: {
      width: '100%',
      padding: '0.875rem',
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s',
      WebkitTapHighlightColor: 'transparent',
    },
    error: {
      color: '#ef4444',
      marginBottom: '1rem',
      textAlign: 'center',
      fontSize: '0.9375rem',
    },
    '@media (max-width: 768px)': {
      form: {
        padding: '1.25rem',
        margin: '0.75rem',
      },
      title: {
        fontSize: '1.5rem',
        marginBottom: '1.25rem',
      },
      input: {
        padding: '0.6875rem',
        fontSize: '0.9375rem',
      },
      button: {
        padding: '0.8125rem',
        fontSize: '0.9375rem',
      },
    },
    '@media (max-width: 480px)': {
      container: {
        padding: '0.75rem',
      },
      form: {
        padding: '1rem',
        margin: '0.5rem',
      },
      title: {
        fontSize: '1.375rem',
        marginBottom: '1rem',
      },
      inputGroup: {
        marginBottom: '1rem',
      },
      input: {
        padding: '0.625rem',
        fontSize: '0.9375rem',
      },
      button: {
        padding: '0.75rem',
        fontSize: '0.9375rem',
      },
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

  const applyResponsiveStyles = (styleObj) => {
    const appliedStyles = { ...styleObj };

    if (window.innerWidth <= 768) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 768px)']);
    }
    if (window.innerWidth <= 480) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 480px)']);
    }

    const { '@media (max-width: 768px)': mq768, '@media (max-width: 480px)': mq480, ...cleanStyles } = appliedStyles;
    return cleanStyles;
  };

  return (
    <div style={applyResponsiveStyles(styles.container)}>
      <form 
        style={applyResponsiveStyles(styles.form)} 
        onSubmit={handleSubmit}
        onTouchStart={() => {}} 
      >
        <h1 style={applyResponsiveStyles(styles.title)}>Admin Login</h1>
        {error && <div style={applyResponsiveStyles(styles.error)}>{error}</div>}
        <div style={applyResponsiveStyles(styles.inputGroup)}>
          <label style={applyResponsiveStyles(styles.label)}>Username</label>
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            style={applyResponsiveStyles(styles.input)}
            required
            autoComplete="username"
          />
        </div>
        <div style={applyResponsiveStyles(styles.inputGroup)}>
          <label style={applyResponsiveStyles(styles.label)}>Password</label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            style={applyResponsiveStyles(styles.input)}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          style={{
            ...applyResponsiveStyles(styles.button),
            ':active': {
              transform: 'scale(0.98)',
            },
            ':hover': {
              transform: 'scale(1.02)',
            },
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;