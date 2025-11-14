import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, auth, db, createUserWithEmailAndPassword, updateProfile } from '../firebase';
import { useResponsiveStyles } from '../utils/responsiveStyles';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminRegister = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already fully authenticated (has token)
    const unsubscribe = auth.onAuthStateChanged(user => {
      const token = localStorage.getItem('token');
      if (user && token) {
        // Redirect to the admin dashboard, not the login page
        navigate('/admin/register');
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
      alignItems: 'flex-start',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1rem',
      paddingTop: '2rem',
      boxSizing: 'border-box',
      width: '100%',
      minWidth: '320px',
    },
    form: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      maxHeight: '90vh',
      overflowY: 'auto',
      margin: '0.5rem',
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
      marginBottom: '0.75rem',
      width: '100%',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#374151',
      fontWeight: '600',
      fontSize: 'clamp(0.9rem, 4vw, 1rem)',
    },
    input: {
      width: '100%',
      padding: '0.6rem 0.9rem',
      border: '2px solid #f0f0f0',
      borderRadius: '0.5rem',
      fontSize: '0.95rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      minHeight: '42px',
      backgroundColor: '#f9fafb',
      '::placeholder': {
        color: '#9ca3af',
        opacity: 1,
      },
      ':focus': {
        borderColor: '#ec4899',
        boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)',
        backgroundColor: '#ffffff',
      },
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      WebkitTapHighlightColor: 'transparent',
      minHeight: '44px',
      marginTop: '0.25rem',
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
      color: '#b91c1c',
      backgroundColor: '#fef2f2',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.375rem',
      marginBottom: '0.75rem',
      fontSize: '0.85rem',
      border: '1px solid #fecaca',
      lineHeight: '1.5',
    },
    link: {
      color: '#9333ea',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'color 0.2s ease',
      ':hover': {
        color: '#7c3aed',
        textDecoration: 'underline',
      },
    },
    footer: {
      textAlign: 'center',
      marginTop: '2rem',
      color: '#6b7280',
      fontSize: 'clamp(0.8rem, 3.5vw, 0.9rem)',
      lineHeight: '1.5',
    },
  };

  // Apply responsive styles
  const styles = useResponsiveStyles({
    ...baseStyles,
    // Responsive overrides for mobile
    '@media (max-width: 600px)': {
      container: {
        padding: '0.5rem',
        minHeight: '100vh',
        alignItems: 'flex-start',
        paddingTop: '1rem',
        background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%)',
      },
      form: {
        padding: '1.25rem',
        margin: '0.25rem',
        maxWidth: '100%',
        maxHeight: '95vh',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      title: {
        fontSize: '1.5rem',
        marginBottom: '1rem',
      },
      inputGroup: {
        marginBottom: '0.75rem',
      },
      input: {
        fontSize: '0.95rem',
        padding: '0.6rem 0.9rem',
        minHeight: '44px',
      },
      button: {
        fontSize: '1rem',
        padding: '0.7rem',
        minHeight: '44px',
        marginTop: '0.5rem',
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
  }, {
    small: {
      form: {
        padding: '1.25rem',
        margin: '0.5rem',
        maxWidth: '100%',
      },
      title: {
        fontSize: '1.5rem',
        marginBottom: '1.25rem',
      },
      container: {
        padding: '1rem',
      },
      button: {
        minHeight: '48px',
      },
      input: {
        minHeight: '44px',
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    // Field-level validation
    const errs = {};
    const name = String(form.fullName || '').trim();
    const email = String(form.email || '').trim().toLowerCase();
    const password = String(form.password || '');
    const confirm = String(form.confirmPassword || '');

    if (!name) errs.fullName = 'Full name is required';
    else if (name.length < 3) errs.fullName = 'Full name must be at least 3 characters';
    else if (!/^[\p{L} .'-]+$/u.test(name)) errs.fullName = 'Full name contains invalid characters';

    if (!email) errs.email = 'Email is required';
    else if (!/^[\w-.+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) errs.email = 'Please enter a valid email address';

    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) errs.password = 'Password should include letters and numbers';

    if (password !== confirm) errs.confirmPassword = 'Passwords do not match';

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setError('Please fix the highlighted fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Attempting to create user with email:', form.email);
      
      // Normalize values
      const normalizedEmail = String(form.email || '').trim().toLowerCase();
      const normalizedName = String(form.fullName || '').trim();

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        form.password
      );
      
      console.log('User created, updating profile...');
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: normalizedName
      });
      
      console.log('Profile updated, creating user document...');
      
      // Create user document in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: normalizedEmail,
        displayName: normalizedName,
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('User document created, registration complete');
      setSuccess('Registration successful! Redirecting to login...');

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific Firebase auth errors
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please use a different email or login.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please use a stronger password.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled. Please contact support.');
          break;
        case 'auth/configuration-not-found':
          setError('Authentication service is not properly configured. Please try again later.');
          break;
        default:
          setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>Admin Registration</h2>
        
        {error && (
          <div style={{
            ...styles.error,
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
        {success && (
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#065f46',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="fullName">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              style={styles.input}
              disabled={isSubmitting}
              autoComplete="name"
            />
            {fieldErrors.fullName && (
              <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: 6 }}>{fieldErrors.fullName}</div>
            )}
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              style={styles.input}
              disabled={isSubmitting}
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
            />
            {fieldErrors.email && (
              <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: 6 }}>{fieldErrors.email}</div>
            )}
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              Password (min 6 characters)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password (min 6 characters)"
              required
              minLength="6"
              style={styles.input}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: 6 }}>{fieldErrors.password}</div>
            )}
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              style={styles.input}
              disabled={isSubmitting}
            />
            {fieldErrors.confirmPassword && (
              <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: 6 }}>{fieldErrors.confirmPassword}</div>
            )}
          </div>
          
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            disabled={isSubmitting || !form.fullName || !form.email || !form.password || !form.confirmPassword}
          >
            {isSubmitting ? (
              <>
                <svg 
                  style={{
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }} 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    opacity="0.2" 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
                    fill="currentColor"
                  />
                  <path 
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" 
                    fill="currentColor"
                  />
                </svg>
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>
        
        <div style={styles.footer}>
          Already have an account?{' '}
          <a 
            href="/admin" 
            style={styles.link}
            onClick={(e) => {
              e.preventDefault();
              navigate('/admin');
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
