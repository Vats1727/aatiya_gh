import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, Menu, X, Home, UserPlus, LogOut, Edit, Trash2 } from 'lucide-react';

// Base styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'none',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '280px',
    backgroundColor: 'white',
    borderRight: '1px solid #e2e8f0',
    padding: '1.5rem 0',
    transition: 'transform 0.3s ease-in-out',
    '@media (max-width: 768px)': {
      position: 'fixed',
      top: '64px',
      left: 0,
      bottom: 0,
      zIndex: 90,
      transform: 'translateX(-100%)',
      '&.open': {
        transform: 'translateX(0)',
      },
    },
  },
  sidebarHeader: {
    padding: '0 1.5rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.25rem',
  },
  nav: {
    padding: '0 0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    color: '#4b5563',
    textDecoration: 'none',
    borderRadius: '0.5rem',
    margin: '0.25rem 0.75rem',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#1e40af',
    },
    '&.active': {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      fontWeight: '500',
    },
  },
  navIcon: {
    marginRight: '0.75rem',
    width: '20px',
    height: '20px',
  },
  content: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    '@media (max-width: 768px)': {
      padding: '1rem',
    },
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9375rem',
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
  },
  primaryButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    '&:hover:not(:disabled)': {
      backgroundColor: '#1e3a8a',
      transform: 'translateY(-1px)',
    },
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    '&:hover:not(:disabled)': {
      backgroundColor: '#b91c1c',
      transform: 'translateY(-1px)',
    },
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '1.5rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    },
  },
  cardHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
  },
  cardBody: {
    padding: '1.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    },
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
    },
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #e5e7eb',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 80,
    display: 'none',
    '@media (max-width: 768px)': {
      '&.open': {
        display: 'block',
      },
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    color: '#6b7280',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #fecaca',
  },
  // Add more styles as needed
};

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && 
          !sidebarRef.current.contains(event.target) && 
          !menuButtonRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [navigate]);

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

            <button onClick={handleLogout} style={applyResponsiveStyles(styles.logoutButton)} title="Logout">
              <LogOut size={16} style={{ marginRight: '6px' }} /> Logout
            </button>
          </div>
        </div>

        {/* Inline Add Hostel form shown on this page */}
        {showAddHostel && (
          <div style={applyResponsiveStyles(styles.card)}>
            <h3 style={{ margin: 0, marginBottom: '0.75rem', color: '#6b21a8' }}>Add New Hostel</h3>
            <form onSubmit={handleAddHostel} style={applyResponsiveStyles(styles.form)}>
              <input
                name="name"
                value={newHostel.name}
                onChange={(e) => setNewHostel(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Hostel name"
                style={applyResponsiveStyles(styles.input)}
                required
              />
              <input
                name="address"
                value={newHostel.address}
                onChange={(e) => setNewHostel(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Hostel address"
                style={applyResponsiveStyles(styles.input)}
                required
              />
              <button 
                type="submit" 
                style={applyResponsiveStyles(styles.primaryButton)}
                disabled={!newHostel.name || !newHostel.address}
              >
                Add Hostel
              </button>
            </form>
          </div>
        )}

          {/* Hostels List */}
          <div style={applyResponsiveStyles(styles.card)}>
            <h3 style={{ margin: 0, marginBottom: '1rem', color: '#6b21a8' }}>Your Hostels</h3>
            {hostels.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No hostels found. Add your first hostel above.</p>
            ) : (
              <div style={applyResponsiveStyles(styles.tableContainer)}>
                <table style={applyResponsiveStyles(styles.table)}>
                  <thead>
                    <tr>
                      <th style={applyResponsiveStyles(styles.th)}>Name</th>
                      <th style={applyResponsiveStyles(styles.th)}>Address</th>
                      <th style={applyResponsiveStyles(styles.th)}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.map((hostel) => (
                      <tr key={hostel.id}>
                        <td style={applyResponsiveStyles(styles.td)}>{hostel.name}</td>
                        <td style={applyResponsiveStyles(styles.td)}>{hostel.address || 'N/A'}</td>
                        <td style={applyResponsiveStyles(styles.td)}>
                          <button
                            onClick={() => handleViewStudents(hostel.id)}
                            style={applyResponsiveStyles(styles.actionButton)}
                            title="View Students"
                          >
                            <Users size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setNewHostel({ name: hostel.name, address: hostel.address });
                              setSelectedHostel(hostel);
                              setShowAddHostel(true);
                            }}
                            style={applyResponsiveStyles(styles.actionButton)}
                            title="Edit Hostel"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm('Delete this hostel? This will remove the hostel and its students.')) return;
                              const token = localStorage.getItem('token');
                              fetch(`${API_BASE}/api/users/me/hostels/${hostel.id}`, {
                                method: 'DELETE',
                                headers: { 
                                  'Authorization': token && token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                }
                              })
                              .then(res => {
                                if (!res.ok) throw new Error('Failed to delete hostel');
                                setHostels(prev => prev.filter(h => h.id !== hostel.id));
                              })
                              .catch(err => { 
                                console.error('Delete error:', err); 
                                alert('Failed to delete hostel'); 
                              });
                            }}
                            style={applyResponsiveStyles({ ...styles.actionButton, color: '#dc2626' })}
                            title="Delete Hostel"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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