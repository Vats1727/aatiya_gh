import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsiveStyles } from '../utils/responsiveStyles';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const HostelRegister = () => {
  const [form, setForm] = useState({ 
    name: '', 
    address: '' 
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // If no user is signed in, redirect to login
        navigate('/admin');
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
      minWidth: '320px',
    },
    form: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '500px',
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
    },
    textarea: {
      width: '100%',
      padding: '0.875rem 1rem',
      border: '2px solid #f0f0f0',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      minHeight: '120px',
      backgroundColor: '#f9fafb',
      resize: 'vertical',
    },
    button: {
      padding: '1rem 1.5rem',
      borderRadius: '0.75rem',
      fontSize: '1.05rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      WebkitTapHighlightColor: 'transparent',
      minHeight: '52px',
      width: '100%',
      textAlign: 'center',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
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
    secondaryButton: {
      background: 'white',
      color: '#4b5563',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#f9fafb',
        borderColor: '#d1d5db',
        transform: 'translateY(-2px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      ':active': {
        transform: 'translateY(0)',
        boxShadow: 'none',
      },
    },
    error: {
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      marginBottom: '1.25rem',
      fontSize: '0.9rem',
      border: '1px solid #fecaca',
    },
    success: {
      color: '#065f46',
      backgroundColor: '#d1fae5',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      marginBottom: '1.25rem',
      fontSize: '0.9rem',
      border: '1px solid #a7f3d0',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '1rem',
    },
  };

  // Apply responsive styles
  const styles = useResponsiveStyles({
    ...baseStyles,
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
      textarea: {
        minHeight: '120px',
        fontSize: '1.05rem',
        padding: '0.875rem 1rem',
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
      buttonGroup: {
        flexDirection: 'column',
        gap: '0.75rem',
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
      textarea: {
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
      },
      textarea: {
        minHeight: '100px',
      },
      buttonGroup: {
        flexDirection: 'column',
        gap: '0.75rem',
      },
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
    
    if (!user) {
      setError('Authentication required. Please log in.');
      return;
    }
    
    if (!form.name.trim() || !form.address.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get a fresh ID token
      const idToken = await user.getIdToken(true);
      
      const res = await fetch(`${API_BASE}/api/users/me/hostels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim()
        })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create hostel');
      }
      
      const payload = await res.json();
      setError('');
      
      // Show success message
      setError(`Successfully created hostel: ${payload.name}`);
      
      // Reset form
      setForm({ name: '', address: '' });
      
    } catch (err) {
      console.error('Hostel creation error:', err);
      setError(err.message || 'An error occurred while creating the hostel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ name: '', address: '' });
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>Register New Hostel</h2>
        
        {error && (
          <div style={error.startsWith('Successfully') ? styles.success : styles.error}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="name">
              Hostel Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter hostel name"
              required
              style={{
                ...styles.input,
                ':focus': {
                  borderColor: '#ec4899',
                  boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)',
                  backgroundColor: '#ffffff',
                },
              }}
              disabled={isSubmitting}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="address">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter full address"
              required
              style={{
                ...styles.textarea,
                ':focus': {
                  borderColor: '#ec4899',
                  boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)',
                  backgroundColor: '#ffffff',
                },
              }}
              disabled={isSubmitting}
            />
          </div>
          
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <svg 
                    style={{
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginRight: '8px',
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
                  Creating...
                </>
              ) : 'Create Hostel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HostelRegister;
