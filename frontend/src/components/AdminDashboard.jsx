import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, ArrowRight, Home, UserPlus } from 'lucide-react';

// Add spin animation
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Add the styles to the document
const styleElement = document.createElement('style');
styleElement.textContent = spinKeyframes;
document.head.appendChild(styleElement);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Function to make the actual API call
  const makeApiCall = async (token) => {
    console.log('Making API request to:', `${API_BASE}/api/auth/me`);
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin');
        return null;
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  // Function to fetch user profile with retry logic
  const fetchUserProfile = async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
      setError('');
    } else {
      setIsRetrying(true);
    }
    
    console.log('Starting to fetch user profile...');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token found:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const startTime = Date.now();
      
      // Try the API call with a timeout
      try {
        const data = await Promise.race([
          makeApiCall(token),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Backend server is taking too long to respond')), 10000)
          )
        ]);
        
        if (!data) return; // Handled in makeApiCall (e.g., 401)
        
        console.log(`Request completed in ${Date.now() - startTime}ms`);
        
        const userData = {
          name: data.fullName || 'User',
          email: data.username || '',
          role: data.role || 'admin'
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
        setRetryCount(0); // Reset retry count on success
        
      } catch (fetchError) {
        console.error('API call error:', fetchError);
        
        // If this is a retry attempt, increment the count
        if (isRetry) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          
          if (newRetryCount < 3) {
            // Auto-retry up to 3 times with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, newRetryCount), 10000);
            console.log(`Retrying in ${delay}ms... (Attempt ${newRetryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchUserProfile(true);
          }
        }
        
        throw fetchError;
      }
      
    } catch (err) {
      console.error('Error fetching user profile:', {
        message: err.message,
        stack: err.stack
      });
      setError(`Failed to load user profile: ${err.message}`);
    }
  };

  // Fetch hostels for the current user
  const fetchHostels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch hostels');
      
      const data = await response.json();
      setHostels(data.data || []);
      
      // If there are hostels, select the first one by default
      if (data.data && data.data.length > 0) {
        setSelectedHostel(data.data[0]);
        fetchStudents(data.data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for a specific hostel
  const fetchStudents = async (hostelId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch students');
      
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

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchUserProfile();
      await fetchHostels();
    };
    loadData();
  }, []);

  // Format date to display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check authentication and fetch data on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin');
      return;
    }
  }, [navigate]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1.5rem 1rem',
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
      background: 'white',
      padding: '1.25rem',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
    },
    title: {
      color: '#db2777',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      margin: 0,
      lineHeight: '1.3',
    },
    headerActions: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      alignItems: 'center',
      '@media (max-width: 600px)': {
        width: '100%',
        flexDirection: 'column',
        gap: '0.5rem',
      },
    },
    searchContainer: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      marginBottom: '1.5rem',
      '@media (max-width: 600px)': {
        flexDirection: 'column',
        gap: '0.5rem',
        width: '100%',
      },
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '0.5rem 1rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      '&:focus': {
        outline: 'none',
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)',
      },
      '@media (max-width: 600px)': {
        width: '100%',
      },
    },
    statusFilter: {
      padding: '0.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      '&:focus': {
        outline: 'none',
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)',
      },
    },
    logoutButton: {
      background: '#4b5563',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.9375rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      ':hover': {
        opacity: 0.9,
        transform: 'translateY(-1px)',
      },
    },
    addButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      padding: '0.625rem 1.25rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '0.9375rem',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      ':hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
      },
    },
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      msOverflowStyle: '-ms-autohiding-scrollbar',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      background: 'white',
      marginBottom: '2rem',
    },
    table: {
      width: '100%',
      minWidth: '800px',
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
    th: {
      background: '#f3e8ff',
      padding: '0.875rem 1rem',
      textAlign: 'left',
      color: '#6b21a8',
      fontWeight: '600',
      fontSize: '0.875rem',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '0.875rem 1rem',
      borderTop: '1px solid #e5e7eb',
      verticalAlign: 'middle',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
    actionCell: {
      whiteSpace: 'nowrap',
    },
    actionButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      padding: '0',
      margin: '0 2px',
      borderRadius: '4px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#f9fafb',
        borderColor: '#d1d5db',
        transform: 'translateY(-1px)',
      },
      '&:active': {
        backgroundColor: '#f3f4f6',
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6b21a8',
      fontSize: '1.1rem',
      fontWeight: '500',
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
        fontSize: '0.875rem',
        '&:focus': {
          outline: 'none',
          borderColor: '#8b5cf6',
          boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)'
        }
      }
    },
    filterSelect: {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb'
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
    if (window.innerWidth <= 1024 && styleObj['@media (max-width: 1024px)']) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 1024px)']);
    }
    if (window.innerWidth <= 768 && styleObj['@media (max-width: 768px)']) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 768px)']);
    }
    if (window.innerWidth <= 480 && styleObj['@media (max-width: 480px)']) {
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

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          maxWidth: '32rem',
          width: '100%',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ marginRight: '0.75rem', marginTop: '0.25rem' }}>
              <svg style={{ color: '#ef4444', width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#b91c1c', marginBottom: '0.5rem' }}>
                Could not connect to the server
              </h3>
              <div style={{ color: '#991b1b', marginBottom: '1rem' }}>
                <p>{error}</p>
              </div>
              <div>
                <button
                  onClick={() => {
                    setError('');
                    fetchUserProfile();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  <svg style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#4b5563' }}>
          <p style={{ marginBottom: '0.5rem' }}>If the problem persists, please check:</p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', textAlign: 'left', display: 'inline-block' }}>
            <li>Your internet connection</li>
            <li>If the backend server is running</li>
            <li>Check the browser's console for more details</li>
          </ul>
        </div>
      </div>
    );
  }
  // Loading state
  if (loading || isRetrying) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '4rem',
          width: '4rem',
          border: '0.5rem solid #f3f3f3',
          borderTop: '0.5rem solid #3b82f6',
          marginBottom: '1rem'
        }}></div>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: '#1e40af'
        }}>
          {isRetrying ? 'Trying to reconnect...' : 'Loading your dashboard...'}
        </h2>
        <p style={{
          color: '#4b5563',
          marginBottom: '1.5rem'
        }}>
          {isRetrying 
            ? `Attempt ${retryCount + 1} of 3`
            : 'Please wait while we load your information.'}
        </p>
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
                onClick={() => navigate('/hostel/register')}
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
              <button 
                onClick={() => navigate('/')}
                style={{
                  ...applyResponsiveStyles(styles.addButton),
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  '@media (max-width: 600px)': { flex: 1 }
                }}
                type="button"
              >
                <UserPlus size={18} className="mr-2" />
                New Student
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/admin');
                }}
                style={{
                  ...applyResponsiveStyles(styles.logoutButton),
                  '@media (max-width: 600px)': { flex: 1 }
                }}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>

          <div style={applyResponsiveStyles(styles.header)}>
            <h1 style={applyResponsiveStyles(styles.title)}>Hostel Management</h1>
          </div>

        <div style={applyResponsiveStyles(styles.tableContainer)}>
          <table style={{ 
            ...applyResponsiveStyles(styles.table), 
            width: '100%', 
            borderCollapse: 'collapse' 
          }}>
            <thead>
              <tr>
                <th style={styles.th}>Hostel Name</th>
                <th style={styles.th}>Number of Students</th>
              </tr>
            </thead>
            <tbody>
              {hostels.map((hostel, idx) => (
                <tr key={hostel.id}>
                  <td style={styles.td}>{hostel.name}</td>
                  <td style={styles.td}>{hostel.studentsCount}</td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleHostelSelect(hostel)}
                      style={{ ...styles.actionButton, ...styles.editButton }}
                      title="View Students"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedHostel && (
          <div style={applyResponsiveStyles(styles.tableContainer)}>
            <table style={{ 
              ...applyResponsiveStyles(styles.table), 
              width: '100%', 
              borderCollapse: 'collapse' 
            }}>
              <thead>
                <tr>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>District</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id}>
                    <td style={styles.td}>{student.studentName}</td>
                    <td style={styles.td}>{student.mobile1}</td>
                    <td style={styles.td}>{student.district}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;