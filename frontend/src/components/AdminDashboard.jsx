import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, ArrowRight, Home, UserPlus, LogOut } from 'lucide-react';

// Use production URL if environment variable is not set
const API_BASE = import.meta.env.VITE_API_BASE || 'https://aatiya-gh-backend.onrender.com';

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  // Helper to get Authorization header value. Accepts tokens stored as
  // either raw JWT or prefixed with "Bearer ".
  const getAuthHeader = () => {
    const raw = localStorage.getItem('token');
    if (!raw) return null;
    return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
  };

  // Helper to get raw JWT without Bearer prefix (for basic validation)
  const getRawToken = () => {
    const raw = localStorage.getItem('token');
    if (!raw) return null;
    return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  };

// Fetch user profile function
const fetchUserProfile = async () => {
    try {
      const authHeader = getAuthHeader();
      const rawToken = getRawToken();
      if (!authHeader || !rawToken) {
        navigate('/admin');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin');
        return;
      }
      throw new Error('Failed to fetch user profile');
    }

    const userObj = await response.json();
    setUser(userObj);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    if (err.message.includes('401') || err.message.includes('unauthorized')) {
      localStorage.removeItem('token');
      navigate('/admin');
    }
    setError('Failed to load user profile');
  }
};

// Fetch hostels function
const fetchHostels = async () => {
  try {
    setLoading(true);
      const authHeader = getAuthHeader();
      const rawToken = getRawToken();
      if (!authHeader || !rawToken) {
        navigate('/admin');
        return;
      }

      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
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
    setError('Failed to load hostels');
    if (err.message.includes('401')) {
      localStorage.removeItem('token');
      navigate('/admin');
    }
  } finally {
    setLoading(false);
  }
};

// Use effect for initial load
useEffect(() => {
  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }
      await fetchUserProfile();
      await fetchHostels();
    } catch (err) {
      console.error('Error loading initial data:', err);
      if (err.message.includes('401')) {
        localStorage.removeItem('token');
        navigate('/admin');
      }
    }
  };

  loadInitialData();
}, [navigate]);

  // Fetch students for a specific hostel
  const fetchStudents = async (hostelId) => {
    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      if (!authHeader) {
        localStorage.removeItem('token');
        navigate('/admin');
        return;
      }

      const response = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/admin');
          return;
        }
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle hostel selection
  const handleHostelSelect = (hostel) => {
    setSelectedHostel(hostel);
    fetchStudents(hostel.id);
  };

  // Handle view students for a hostel
  const handleViewStudents = (hostelId) => {
    navigate(`/hostel/${hostelId}/students`);
  };

  // Handle add new hostel
  const handleAddHostel = async (e) => {
    e.preventDefault();
    if (!newHostel.name || !newHostel.address) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        setError('Authentication required');
        navigate('/admin');
        return;
      }

      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(newHostel)
      });

      if (!response.ok) {
        throw new Error('Failed to create hostel');
      }

  const data = await response.json();
  // backend might return { hostel } or { data: hostel } or the hostel directly
  const created = data?.hostel || data?.data || data;
  setHostels(prev => [...prev, created]);
      setNewHostel({ name: '', address: '' });
      setShowAddHostel(false);
      setError('');
    } catch (err) {
      setError('Failed to create hostel. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin');
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchHostels();
  }, []);

  // Check authentication and fetch data on component mount
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const rawToken = getRawToken();
        const authHeader = getAuthHeader();
        if (!rawToken || !authHeader) {
          throw new Error('No token found');
        }

        // Basic token format validation (JWT should have 3 parts)
        const tokenParts = rawToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }

        try {
          // First verify the token by fetching the user profile
          await fetchUserProfile();
          // Then fetch the hostels data
          await fetchHostels();
        } catch (err) {
          if (err.response?.status === 401 || 
              err.message.includes('401') || 
              err.message.includes('unauthorized')) {
            throw new Error('Session expired. Please login again.');
          }
          throw err;
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        setError(err.message || 'Authentication failed');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
    padding: '2rem 1rem',
    boxSizing: 'border-box',
    width: '100%',
    overflowX: 'hidden',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '1.5rem',
    borderRadius: '1rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    border: '1px solid rgba(0, 0, 0, 0.05)'
  },
  title: {
    color: '#db2777',
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      width: '100%',
      flexDirection: 'column',
      gap: '0.75rem',
    },
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '44px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 15px rgba(147, 51, 234, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  secondaryButton: {
    background: 'white',
    color: '#7c3aed',
    border: '2px solid #e9d5ff',
    '&:hover': {
      background: '#f5f3ff',
      boxShadow: '0 2px 10px rgba(124, 58, 237, 0.1)',
    },
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
    borderLeft: '4px solid #dc2626',
    fontSize: '0.9375rem',
    lineHeight: '1.5',
  },
  hostelGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    padding: '0 1rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f0abfc 0%, #c4b5fd 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1rem',
    color: '#6d28d9',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 0.25rem',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
  },
  cardContent: {
    flex: 1,
    marginBottom: '1.5rem',
  },
  cardFooter: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentCount: {
    display: 'flex',
    alignItems: 'center',
    color: '#6b7280',
    fontSize: '0.875rem',
    '& svg': {
      marginRight: '0.5rem',
    },
  },
  viewButton: {
    background: 'transparent',
    border: 'none',
    color: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9375rem',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#f5f3ff',
    },
  },
  formContainer: {
    maxWidth: '500px',
    margin: '2rem auto',
    background: 'white',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#4b5563',
    fontWeight: '500',
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
    backgroundColor: '#f9fafb',
    '&:focus': {
      borderColor: '#ec4899',
      boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)',
      backgroundColor: '#ffffff',
    },
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
  },
  cancelButton: {
    background: 'transparent',
    border: '2px solid #e5e7eb',
    color: '#6b7280',
    '&:hover': {
      background: '#f9fafb',
      boxShadow: 'none',
    },
  },
  toolbar: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    margin: '0 0 1rem 0',
    '& input[type="search"]': {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      minWidth: '220px',
      '&:focus': {
        outline: 'none',
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)'
      }
    }
  },
  searchContainer: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '0.75rem',
      width: '100%',
    },
  },
  searchInput: {
      flex: 1,
      minWidth: '250px',
      padding: '0.875rem 1.25rem',
      border: '2px solid #f0f0f0',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      minHeight: '52px',
      backgroundColor: '#ffffff',
      '&:focus': {
        borderColor: '#ec4899',
        boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)',
      },
      '::placeholder': {
        color: '#9ca3af',
      },
      '@media (max-width: 768px)': {
        width: '100%',
      },
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '1rem',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid rgba(0, 0, 0, 0.03)',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      marginTop: '1.25rem',
    },
    // Removed duplicate input style
    submitButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      padding: '1rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '1.05rem',
      marginTop: '0.5rem',
      transition: 'all 0.2s ease',
      minHeight: '52px',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)',
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 5px rgba(147, 51, 234, 0.3)',
      },
      '&:disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
    },
    filterSelect: {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb'
    },
    statusBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.8125rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
    },
    pendingBadge: {
      background: '#fef3c7',
      color: '#92400e',
    },
    approvedBadge: {
      background: '#dcfce7',
      color: '#166534',
    },
    rejectedBadge: {
      background: '#fee2e2',
      color: '#991b1b',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem 1rem',
      color: '#6b7280',
      fontSize: '1rem',
      lineHeight: '1.5',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      marginTop: '1.5rem',
      gap: '0.5rem',
      flexWrap: 'wrap',
    },
    pageInfo: {
      margin: '0 1rem',
      color: '#4b5563',
      fontSize: '0.875rem',
    },
    pageButton: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
      minWidth: '2.5rem',
      textAlign: 'center',
      '&:hover': {
        background: '#f3f4f6',
      },
      '&.active': {
        background: '#8b5cf6',
        color: 'white',
        borderColor: '#8b5cf6',
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
        background: '#f3f4f6',
      },
    },
    // Removed sortableHeader style as sorting is disabled
    '@media (max-width: 1024px)': {
      container: {
        padding: '1.25rem 0.75rem',
      },
      header: {
        padding: '1rem',
        marginBottom: '1.25rem',
      },
      title: {
        fontSize: '1.375rem',
      },
    },
    '@media (max-width: 768px)': {
      container: {
        padding: '1rem 0.5rem',
      },
      header: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
      },
      title: {
        fontSize: '1.25rem',
      },
      headerActions: {
        width: '100%',
        justifyContent: 'space-between',
      },
      th: {
        padding: '0.75rem 0.5rem',
        fontSize: '0.8125rem',
      },
      td: {
        padding: '0.75rem 0.5rem',
        fontSize: '0.8125rem',
      },
    },
    '@media (max-width: 480px)': {
      container: {
        padding: '0.75rem 0.25rem',
      },
      header: {
        padding: '0.875rem',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
      },
      title: {
        fontSize: '1.25rem',
      },
      logoutButton: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
      },
      addButton: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
      },
      tableContainer: {
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
      },
      th: {
        padding: '0.625rem 0.5rem',
        fontSize: '0.75rem',
      },
      td: {
        padding: '0.625rem 0.5rem',
        fontSize: '0.75rem',
      },
      actionButton: {
        padding: '0.35rem 0.5rem',
        fontSize: '0.75rem',
        marginRight: '0.25rem',
        marginBottom: '0.25rem',
      },
      statusBadge: {
        padding: '0.2rem 0.5rem',
        fontSize: '0.75rem',
      },
    },
  };

  const applyResponsiveStyles = (styleObj) => {
    const appliedStyles = { ...styleObj };

    // Handle media query styles
    if (window.innerWidth <= 1024) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 1024px)']);
    }
    if (window.innerWidth <= 768) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 768px)']);
    }
    if (window.innerWidth <= 480) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 480px)']);
    }

    // Remove media query keys
    const {
      '@media (max-width: 1024px)': mq1024,
      '@media (max-width: 768px)': mq768,
      '@media (max-width: 480px)': mq480,
      ...cleanStyles
    } = appliedStyles;

    return cleanStyles;
  };

  if (loading) {
    return (
      <div style={applyResponsiveStyles(styles.container)}>
        <div style={applyResponsiveStyles(styles.content)}>
          <div style={applyResponsiveStyles(styles.loading)}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={applyResponsiveStyles(styles.container)}>
        <div style={applyResponsiveStyles(styles.content)}>
          <div style={applyResponsiveStyles(styles.error)}>
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={applyResponsiveStyles(styles.container)}>
      <div style={applyResponsiveStyles(styles.content)}>
        {/* User Profile Section */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                {user?.name || 'User'}
              </h2>
              <p style={{
                margin: '0.25rem 0 0',
                color: '#6b7280',
                fontSize: '0.9375rem'
              }}>
                {user?.email || ''}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setShowAddHostel(true)}
              style={{
                ...applyResponsiveStyles(styles.addButton),
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                '@media (max-width: 600px)': { flex: 1 }
              }}
              type="button"
            >
              <Home size={18} className="mr-2" />
              New Hostel
            </button>
          </div>
        </div>

        {/* Inline Add Hostel form shown on this page */}
        {showAddHostel && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}>
            <div style={{
              ...cardStyle,
              maxWidth: '500px',
              width: '100%',
              margin: 0,
              padding: '2rem',
              position: 'relative',
            }}>
              <button 
                onClick={() => setShowAddHostel(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  padding: '0.25rem',
                  '&:hover': {
                    color: '#6b7280',
                  },
                }}
              >
                &times;
              </button>
              
              <h2 style={{ 
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: '0 0 1.5rem',
                color: '#1f2937',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Add New Hostel
              </h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4b5563',
                  fontWeight: '500',
                  fontSize: '0.9375rem',
                }}>
                  Hostel Name
                </label>
                <input
                  type="text"
                  value={newHostel.name}
                  onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                  placeholder="Enter hostel name"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f9fafb',
                    '&:focus': {
                      borderColor: '#8b5cf6',
                      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
                      backgroundColor: '#ffffff',
                    },
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4b5563',
                  fontWeight: '500',
                  fontSize: '0.9375rem',
                }}>
                  Address
                </label>
                <textarea
                  value={newHostel.address}
                  onChange={(e) => setNewHostel({ ...newHostel, address: e.target.value })}
                  placeholder="Enter hostel address"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f9fafb',
                    '&:focus': {
                      borderColor: '#8b5cf6',
                      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
                      backgroundColor: '#ffffff',
                    },
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6',
              }}>
                <button 
                  onClick={() => setShowAddHostel(false)}
                  style={{
                    ...secondaryButtonStyle,
                    padding: '0.75rem 1.25rem',
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddHostel}
                  style={{
                    ...buttonStyle,
                    padding: '0.75rem 1.5rem',
                    opacity: !newHostel.name ? 0.7 : 1,
                    cursor: !newHostel.name ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!newHostel.name}
                >
                  Add Hostel
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={headerStyle}>
          <h1 style={titleStyle}>Hostel Dashboard</h1>
          <div style={headerActionsStyle}>
            <button 
              onClick={handleLogout}
              style={secondaryButtonStyle}
            >
              <LogOut size={18} style={{ marginRight: '8px' }} />
              {isMobile ? 'Logout' : 'Sign Out'}
            </button>
            <button 
              onClick={() => setShowAddHostel(true)}
              style={buttonStyle}
            >
              <Plus size={18} style={{ marginRight: '8px' }} />
              {isMobile ? 'Add' : 'Add New Hostel'}
            </button>
          </div>
        </div>

        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Hostel Name</th>
                <th>Number of Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hostels.length > 0 ? (
                hostels.map((hostel) => (
                  <tr key={hostel.id}>
                    <td style={{ fontWeight: '500', color: '#1f2937' }}>{hostel.name}</td>
                    <td style={{ color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Users size={16} style={{ marginRight: '8px', color: '#8b5cf6' }} />
                        {hostel.studentsCount || 0} {hostel.studentsCount === 1 ? 'Student' : 'Students'}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewStudents(hostel.id)}
                        style={actionButtonStyle}
                        title="View Students"
                      >
                        <ArrowRight size={18} />
                        <span style={{ marginLeft: '6px' }}>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <div style={{ marginBottom: '1rem' }}>📋</div>
                    <p style={{ margin: '0.5rem 0' }}>No hostels found</p>
                    <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9375rem' }}>
                      Get started by adding your first hostel
                    </p>
                    <button 
                      onClick={() => setShowAddHostel(true)}
                      style={{
                        ...buttonStyle,
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.9375rem',
                      }}
                    >
                      <Plus size={16} style={{ marginRight: '8px' }} />
                      Add Hostel
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedHostel && (
          <div style={tableContainerStyle}>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Students in {selectedHostel.name}</h3>
              <button 
                onClick={() => setSelectedHostel(null)}
                style={{
                  ...secondaryButtonStyle,
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                }}
              >
                Back to Hostels
              </button>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Application No</th>
                  <th>Contact</th>
                  <th>District</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: '500', color: '#1f2937' }}>{student.studentName}</td>
                      <td style={{ fontFamily: 'monospace', color: '#6b7280' }}>{student.combinedId || '-'}</td>
                      <td style={{ color: '#6b7280' }}>{student.mobile1 || '-'}</td>
                      <td style={{ color: '#6b7280' }}>{student.district || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      <div style={{ marginBottom: '1rem' }}>👥</div>
                      <p style={{ margin: 0 }}>No students found in this hostel</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;