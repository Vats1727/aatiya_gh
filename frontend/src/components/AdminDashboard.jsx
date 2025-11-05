import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, ArrowRight, Home, UserPlus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Inline styles
const styles = {
  container: {
    minHeight: '100vh',
    padding: '1rem',
    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: '1200px',
    padding: '1.5rem',
    '@media (max-width: 768px)': {
      padding: '1rem',
    },
    '@media (max-width: 480px)': {
      padding: '0.75rem',
    },
  },
  card: {
    background: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '@media (max-width: 768px)': {
      padding: '1.25rem',
    },
    '@media (max-width: 480px)': {
      padding: '1rem',
    },
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px -1px rgba(236, 72, 153, 0.3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#4b5563',
    fontWeight: '600',
    fontSize: '0.9375rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    transition: 'all 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
    },
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  hostelList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginTop: '1.5rem',
  },
  hostelCard: {
    background: 'white',
    borderRadius: '0.75rem',
    padding: '1.25rem',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      borderColor: '#d1d5db',
    },
  },
  error: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    border: '1px solid #fecaca',
  },
  success: {
    color: '#065f46',
    backgroundColor: '#d1fae5',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    border: '1px solid #a7f3d0',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
};

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [form, setForm] = useState({ name: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Use auth/me endpoint which returns the user object
      const altResponse = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!altResponse.ok) throw new Error('Failed to fetch user profile');
      const userObj = await altResponse.json();
      // auth/me returns the user object directly; use it or fallback to previous shape
      setUser(userObj || {});
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again.');
      if (err.message.includes('401')) {
        localStorage.removeItem('token');
        navigate('/admin');
      }
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/admin');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create hostel');
      }

      const data = await response.json();
      setHostels(prev => [...prev, data.data]);
      setSuccess(`Hostel "${data.data.name}" created successfully!`);
      setForm({ name: '', address: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating hostel:', err);
      setError(err.message || 'An error occurred while creating the hostel');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch hostels for the current user
  const fetchHostels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/admin');
          return;
        }
        throw new Error('Failed to fetch hostels');
      }
      
      const data = await response.json();
      setHostels(data.data || []);
    } catch (err) {
      console.error('Error fetching hostels:', err);
      setError('Failed to load hostels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle view students for a hostel
  const handleViewStudents = (hostelId) => {
    navigate(`/hostel/${hostelId}/students`);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchUserProfile();
      await fetchHostels();
    };
    
    loadData();
  }, []);

  // Apply responsive styles function
  const applyResponsiveStyles = (styleObj) => {
    if (!styleObj) return {};
    
    const appliedStyles = { ...styleObj };
    
    if (window.innerWidth <= 768) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 768px)'] || {});
    }
    if (window.innerWidth <= 480) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 480px)'] || {});
    }

    // Remove media query keys from the final style object
    const { '@media (max-width: 768px)': mq768, '@media (max-width: 480px)': mq480, ...cleanStyles } = appliedStyles;
    return cleanStyles;
  };

  if (loading && hostels.length === 0) {
    return (
      <div style={applyResponsiveStyles(styles.container)}>
        <div style={styles.loading}>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={applyResponsiveStyles(styles.container)}>
        <div style={applyResponsiveStyles(styles.error)}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={styles.button}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div style={applyResponsiveStyles(styles.container)}>
      <div style={applyResponsiveStyles(styles.content)}>
        {/* Profile Section */}
        <div style={applyResponsiveStyles(styles.card)}>
          <div style={styles.profile}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#1f2937' }}>{user?.name || 'User'}</h2>
              <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={applyResponsiveStyles(styles.error)}>
            {error}
          </div>
        )}
        {success && (
          <div style={applyResponsiveStyles(styles.success)}>
            {success}
          </div>
        )}

        {/* Add Hostel Form */}
        <div style={applyResponsiveStyles(styles.card)}>
          <h3 style={{ marginTop: 0, color: '#1f2937', marginBottom: '1.25rem' }}>
            Add New Hostel
          </h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="name" style={styles.label}>
                Hostel Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter hostel name"
                style={styles.input}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label htmlFor="address" style={styles.label}>
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter hostel address"
                style={styles.input}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
              disabled={isSubmitting || !form.name || !form.address}
              onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.transform = 'translateY(0)')}
              onTouchStart={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(0.98)')}
              onTouchEnd={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Plus size={18} />
              {isSubmitting ? 'Creating...' : 'Add Hostel'}
            </button>
          </form>
        </div>

        {/* Hostels List */}
        <div style={applyResponsiveStyles(styles.card)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#1f2937' }}>Your Hostels</h3>
            <span style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
              {hostels.length} {hostels.length === 1 ? 'hostel' : 'hostels'}
            </span>
          </div>
          
          {loading ? (
            <div style={styles.loading}>Loading hostels...</div>
          ) : hostels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>You haven't added any hostels yet.</p>
              <p>Add your first hostel using the form above.</p>
            </div>
          ) : (
            <div style={styles.hostelList}>
              {hostels.map(hostel => (
                <div 
                  key={hostel.id} 
                  style={{
                    ...styles.hostelCard,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleViewStudents(hostel.id)}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h4 style={{ margin: '0 0 0.75rem', color: '#1f2937', fontSize: '1.125rem' }}>
                    {hostel.name}
                  </h4>
                  <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.9375rem' }}>
                    {hostel.address}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {hostel.studentCount || 0} {hostel.studentCount === 1 ? 'student' : 'students'}
                    </span>
                    <span style={{ 
                      color: '#7c3aed',
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'color 0.2s'
                    }}>
                      View Students <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;