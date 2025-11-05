import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, ArrowRight, Home, UserPlus, LogOut } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
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

  // Handle view students for a hostel
  const handleViewStudents = (hostelId) => {
    navigate(`/hostel/${hostelId}/students`);
  };

  // Handle add new hostel
  const handleAddHostel = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHostel)
      });
      
      if (!response.ok) throw new Error('Failed to add hostel');
      
      setShowAddHostel(false);
      setNewHostel({ name: '', location: '' });
      await fetchHostels();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin');
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
    card: {
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginTop: '1rem',
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      '&:focus': {
        outline: 'none',
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)',
      },
    },
    submitButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '1rem',
      marginTop: '0.5rem',
      '&:hover': {
        opacity: 0.95,
      },
    },
    hostelGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1.25rem',
      marginTop: '1.5rem',
    },
    hostelCard: {
      background: '#f9fafb',
      padding: '1.25rem',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      },
    },
    viewButton: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginTop: '1rem',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      '&:hover': {
        opacity: 0.9,
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
                <th style={styles.th}>Actions</th>
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
                  <th style={styles.th}>Application No</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>District</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id}>
                    <td style={styles.td}>{student.studentName}</td>
                    <td style={styles.td}>{student.combinedId || '-'}</td>
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