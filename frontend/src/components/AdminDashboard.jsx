import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Edit, Check, X, Trash, Menu } from 'lucide-react';
import { useResponsiveStyles } from '../utils/responsiveStyles';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const baseStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1rem',
      boxSizing: 'border-box',
      width: '100%',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    },
    header: {
      background: 'white',
      padding: '1rem',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
    },
    title: {
      color: '#db2777',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      margin: 0,
      flex: 1,
      minWidth: 'max-content',
    },
    headerActions: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      width: '100%',
      '@media (min-width: 640px)': {
        width: 'auto',
      },
    },
    button: {
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.25rem',
      fontSize: '0.9375rem',
      minHeight: '48px',
      minWidth: '48px',
      ':hover': {
        transform: 'translateY(-2px)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
      ':disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
      },
    },
    addButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
    },
    logoutButton: {
      background: '#4b5563',
      color: 'white',
    },
    menuButton: {
      background: 'transparent',
      color: '#6b21a8',
      padding: '0.5rem',
      '@media (min-width: 768px)': {
        display: 'none',
      },
    },
    tableWrapper: {
      width: '100%',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
    table: {
      width: '100%',
      minWidth: '600px',
      borderCollapse: 'collapse',
    },
    th: {
      background: '#f3e8ff',
      padding: '1rem',
      textAlign: 'left',
      color: '#6b21a8',
      fontWeight: '600',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '1rem',
      borderTop: '1px solid #f3f4f6',
      verticalAlign: 'middle',
    },
    actionButton: {
      padding: '0.5rem',
      border: 'none',
      borderRadius: '0.375rem',
      margin: '0.125rem',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '36px',
      minHeight: '36px',
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'scale(1.1)',
      },
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6b21a8',
      fontSize: '1.125rem',
    },
    error: {
      background: '#fee2e2',
      color: '#b91c1c',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      borderLeft: '4px solid #dc2626',
    },
    statusBadge: {
      padding: '0.375rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500',
      display: 'inline-block',
      textAlign: 'center',
      minWidth: '80px',
    },
    pendingBadge: {
      background: '#fffbeb',
      color: '#b45309',
      border: '1px solid #fcd34d',
    },
    approvedBadge: {
      background: '#ecfdf5',
      color: '#065f46',
      border: '1px solid #6ee7b7',
    },
    rejectedBadge: {
      background: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fca5a5',
    },
    mobileCard: {
      display: 'none',
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      padding: '1rem',
      marginBottom: '1rem',
      border: '1px solid #e5e7eb',
    },
    mobileCardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #f3f4f6',
      '&:last-child': {
        borderBottom: 'none',
        marginBottom: 0,
        paddingBottom: 0,
      },
    },
    mobileLabel: {
      fontWeight: '600',
      color: '#4b5563',
      minWidth: '100px',
    },
    mobileValue: {
      flex: 1,
      textAlign: 'right',
    },
    mobileActions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap',
      marginTop: '0.75rem',
      paddingTop: '0.75rem',
      borderTop: '1px solid #f3f4f6',
    },
    '@media (max-width: 1024px)': {
      container: {
        padding: '0.75rem',
      },
      header: {
        padding: '0.875rem',
        marginBottom: '1.25rem',
      },
      title: {
        fontSize: '1.375rem',
      },
      th: {
        padding: '0.875rem 0.75rem',
        fontSize: '0.875rem',
      },
      td: {
        padding: '0.875rem 0.75rem',
      },
      button: {
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
      },
    },
    '@media (max-width: 768px)': {
      container: {
        padding: '0.5rem',
      },
      header: {
        padding: '0.75rem',
        marginBottom: '1rem',
        flexDirection: 'column',
        alignItems: 'stretch',
      },
      title: {
        fontSize: '1.25rem',
        textAlign: 'center',
        marginBottom: '0.5rem',
      },
      headerActions: {
        justifyContent: 'center',
        gap: '0.5rem',
      },
      button: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
      },
      tableWrapper: {
        display: 'none',
      },
      mobileCard: {
        display: 'block',
      },
    },
    '@media (max-width: 480px)': {
      container: {
        padding: '0.25rem',
      },
      header: {
        padding: '0.75rem 0.5rem',
        marginBottom: '0.75rem',
      },
      title: {
        fontSize: '1.125rem',
      },
      headerActions: {
        flexDirection: 'column',
        gap: '0.5rem',
      },
      button: {
        width: '100%',
        padding: '0.625rem',
      },
      mobileCard: {
        padding: '0.75rem',
        marginBottom: '0.75rem',
      },
      mobileCardRow: {
        flexDirection: 'column',
        gap: '0.25rem',
        paddingBottom: '0.5rem',
        marginBottom: '0.5rem',
      },
      mobileLabel: {
        minWidth: 'auto',
        fontSize: '0.875rem',
      },
      mobileValue: {
        textAlign: 'left',
        fontSize: '0.9375rem',
      },
      mobileActions: {
        gap: '0.25rem',
      },
      actionButton: {
        minWidth: '32px',
        minHeight: '32px',
        padding: '0.375rem',
      },
    },
  };

  // Apply responsive styles
  const styles = useResponsiveStyles(baseStyles);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('adminAuthenticated');
      if (!isAuthenticated) {
        navigate('/admin');
      }
    };

    checkAuth();
    fetchStudents();
  }, [navigate]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin');
  };

  const handleStatusChange = async (id, status) => {
    try {
      // Use existing PUT /api/students/:id to update status (merge)
      const response = await fetch(`${API_BASE}/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state by matching `id` field
      setStudents(prev => prev.map(student => (
        (student.id === id) ? { ...student, status } : student
      )));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (id) => {
    // Redirect to form with editId query so StudentForm can load the data
    navigate(`/?editId=${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const ok = window.confirm('Are you sure you want to delete this record? This action cannot be undone.');
      if (!ok) return;
      const response = await fetch(`${API_BASE}/api/students/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete record');
      // Remove from local state
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = async (id) => {
    try {
      // Request server-rendered PDF and download it
      const response = await fetch(`${API_BASE}/api/students/${id}/pdf`);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `student-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNew = () => {
    navigate('/');
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.header-actions')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusText = status || 'pending';
    return (
      <span style={{
        ...styles.statusBadge,
        ...(statusText === 'pending' ? styles.pendingBadge :
           statusText === 'approved' ? styles.approvedBadge :
           styles.rejectedBadge)
      }}>
        {statusText}
      </span>
    );
  };

  // Render action buttons
  const renderActionButtons = (studentId) => (
    <>
      <button
        style={{ ...styles.actionButton, background: '#10b981' }}
        onClick={(e) => {
          e.stopPropagation();
          handleStatusChange(studentId, 'approved');
        }}
        aria-label="Approve"
      >
        <Check size={16} color="white" />
      </button>
      <button
        style={{ ...styles.actionButton, background: '#ef4444' }}
        onClick={(e) => {
          e.stopPropagation();
          handleStatusChange(studentId, 'rejected');
        }}
        aria-label="Reject"
      >
        <X size={16} color="white" />
      </button>
      <button
        style={{ ...styles.actionButton, background: '#6366f1' }}
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(studentId);
        }}
        aria-label="Edit"
      >
        <Edit size={16} color="white" />
      </button>
      <button
        style={{ ...styles.actionButton, background: '#8b5cf6' }}
        onClick={(e) => {
          e.stopPropagation();
          handleDownload(studentId);
        }}
        aria-label="Download"
      >
        <Download size={16} color="white" />
      </button>
      <button
        style={{ ...styles.actionButton, background: '#ef4444' }}
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(studentId);
        }}
        aria-label="Delete"
      >
        <Trash size={16} color="white" />
      </button>
    </>
  );

  if (loading) {
    return <div style={styles.loading}>Loading student data...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <button 
              style={styles.menuButton} 
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          <div 
            className="header-actions"
            style={{
              ...styles.headerActions,
              display: isMenuOpen ? 'flex' : 'none',
              '@media (min-width: 768px)': {
                display: 'flex',
              },
            }}
          >
            <button 
              style={{ ...styles.button, ...styles.addButton }} 
              onClick={handleAddNew}
            >
              Add New Student
            </button>
            <button 
              style={{ ...styles.button, ...styles.logoutButton }} 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {error && <div style={styles.error} role="alert">{error}</div>}

        {/* Desktop Table View */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>District</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={`desktop-${student.id}`}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={styles.td}>{student.studentName}</td>
                  <td style={styles.td}>{student.mobile1}</td>
                  <td style={styles.td}>{student.district}</td>
                  <td style={styles.td}>
                    {renderStatusBadge(student.status)}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {renderActionButtons(student.id)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div style={{ '@media (min-width: 769px)': { display: 'none' } }}>
          {students.map((student, idx) => (
            <div key={`mobile-${student.id}`} style={styles.mobileCard}>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>#</span>
                <span style={styles.mobileValue}>{idx + 1}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>Name</span>
                <span style={styles.mobileValue}>{student.studentName}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>Contact</span>
                <span style={styles.mobileValue}>{student.mobile1}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>District</span>
                <span style={styles.mobileValue}>{student.district}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>Status</span>
                <span style={styles.mobileValue}>
                  {renderStatusBadge(student.status)}
                </span>
              </div>
              <div style={styles.mobileActions}>
                {renderActionButtons(student.id)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;