import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Edit, Check, X, Trash } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

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
      padding: '0.4rem 0.75rem',
      border: 'none',
      borderRadius: '0.375rem',
      marginRight: '0.5rem',
      marginBottom: '0.25rem',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      fontSize: '0.8125rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'translateY(-1px)',
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
      margin: '0 0 1rem 0'
    },
    searchInput: {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      minWidth: '220px'
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

  // Filter students locally based on search and status
  const filterStudents = () => {
    const q = String(searchQuery || '').trim().toLowerCase();
    const filtered = allStudents.filter(s => {
      // status filter
      if (statusFilter && statusFilter !== 'all') {
        if ((s.status || 'pending') !== statusFilter) return false;
      }
      if (!q) return true;
      // match name or mobile1 or mobile2
      const name = String(s.studentName || '').toLowerCase();
      const m1 = String(s.mobile1 || '').toLowerCase();
      const m2 = String(s.mobile2 || '').toLowerCase();
      return name.includes(q) || m1.includes(q) || m2.includes(q);
    });
    setStudents(filtered);
  };

  useEffect(() => {
    filterStudents();
  }, [searchQuery, statusFilter, allStudents]);

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
        setAllStudents(data);
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
      setAllStudents(prev => prev.map(student => (
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
  setAllStudents(prev => prev.filter(s => s.id !== id));
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
        <div style={applyResponsiveStyles(styles.header)}>
          <h1 style={applyResponsiveStyles(styles.title)}>Admin Dashboard</h1>
          <div style={applyResponsiveStyles(styles.headerActions)}>
            <button 
              style={applyResponsiveStyles(styles.addButton)} 
              onClick={handleAddNew}
              type="button"
            >
              Add New Student
            </button>
            <button 
              style={applyResponsiveStyles(styles.logoutButton)} 
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={applyResponsiveStyles(styles.error)}>
            {error}
          </div>
        )}

        <div style={applyResponsiveStyles(styles.tableContainer)}>
          <table style={{ 
            ...applyResponsiveStyles(styles.table), 
            width: '100%', 
            borderCollapse: 'collapse' 
          }}>
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
                        <tr key={student.id}>
                          <td style={styles.td}>{idx + 1}</td>
                          <td style={styles.td}>{student.studentName}</td>
                          <td style={styles.td}>{student.mobile1}</td>
                          <td style={styles.td}>{student.district}</td>
                          <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(student.status === 'pending' ? styles.pendingBadge :
                         student.status === 'approved' ? styles.approvedBadge :
                         styles.rejectedBadge)
                    }}>
                      {student.status || 'pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{ 
                        ...styles.actionButton, 
                        background: '#10b981' 
                      }}
                      onClick={() => handleStatusChange(student.id, 'approved')}
                      title="Approve"
                      type="button"
                      aria-label={`Approve ${student.studentName}`}
                    >
                      <Check size={16} color="white" />
                    </button>
                    <button
                      style={{ 
                        ...styles.actionButton, 
                        background: '#ef4444' 
                      }}
                      onClick={() => handleStatusChange(student.id, 'rejected')}
                      title="Reject"
                      type="button"
                      aria-label={`Reject ${student.studentName}`}
                    >
                      <X size={16} color="white" />
                    </button>
                    <button
                      style={{ 
                        ...styles.actionButton, 
                        background: '#6366f1' 
                      }}
                      onClick={() => handleEdit(student.id)}
                      title="Edit"
                      type="button"
                      aria-label={`Edit ${student.studentName}`}
                    >
                      <Edit size={16} color="white" />
                    </button>
                    <button
                      style={{ 
                        ...styles.actionButton, 
                        background: '#8b5cf6' 
                      }}
                      onClick={() => handleDownload(student.id)}
                      title="Download"
                      type="button"
                      aria-label={`Download ${student.studentName}'s form`}
                    >
                      <Download size={16} color="white" />
                    </button>
                    <button
                      style={{ ...styles.actionButton, background: '#ef4444' }}
                      onClick={() => handleDelete(student.id)}
                      title="Delete"
                    >
                      <Trash size={16} color="white" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};

export default AdminDashboard;