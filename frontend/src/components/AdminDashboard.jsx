import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Edit, Check, X, Trash } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '2rem',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      background: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      color: '#db2777',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      margin: 0,
    },
    logoutButton: {
      background: '#4b5563',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    },
    addButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    table: {
      width: '100%',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    },
    th: {
      background: '#f3e8ff',
      padding: '1rem',
      textAlign: 'left',
      color: '#6b21a8',
      fontWeight: 'bold',
    },
    td: {
      padding: '1rem',
      borderTop: '1px solid #e5e7eb',
    },
    actionButton: {
      padding: '0.5rem',
      border: 'none',
      borderRadius: '0.25rem',
      marginRight: '0.5rem',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6b21a8',
    },
    error: {
      background: '#fee2e2',
      color: '#ef4444',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
    },
    statusBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    pendingBadge: {
      background: '#fef3c7',
      color: '#d97706',
    },
    approvedBadge: {
      background: '#dcfce7',
      color: '#15803d',
    },
    rejectedBadge: {
      background: '#fee2e2',
      color: '#dc2626',
    },
  };

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
    // Open the form view in a new tab with a download flag. The StudentForm will render the same print
    // layout and auto-generate the PDF client-side using html2pdf, producing an identical result.
    try {
      const origin = window.location.origin;
      const url = `${origin}/?editId=${encodeURIComponent(id)}&downloadPdf=1`;
      window.open(url, '_blank');
    } catch (err) {
      setError(String(err));
    }
  };

  const handleAddNew = () => {
    navigate('/');
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <div>
            <button style={styles.addButton} onClick={handleAddNew}>Add New Student</button>
            <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.table}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                      style={{ ...styles.actionButton, background: '#10b981' }}
                      onClick={() => handleStatusChange(student.id, 'approved')}
                      title="Approve"
                    >
                      <Check size={16} color="white" />
                    </button>
                    <button
                      style={{ ...styles.actionButton, background: '#ef4444' }}
                      onClick={() => handleStatusChange(student.id, 'rejected')}
                      title="Reject"
                    >
                      <X size={16} color="white" />
                    </button>
                    <button
                      style={{ ...styles.actionButton, background: '#6366f1' }}
                      onClick={() => handleEdit(student.id)}
                      title="Edit"
                    >
                      <Edit size={16} color="white" />
                    </button>
                    <button
                      style={{ ...styles.actionButton, background: '#8b5cf6' }}
                      onClick={() => handleDownload(student.id)}
                      title="Download"
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