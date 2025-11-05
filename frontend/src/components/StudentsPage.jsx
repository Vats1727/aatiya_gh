import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, Edit, Trash2, Check, X, Download } from 'lucide-react';
import { downloadStudentPdf } from '../utils/pdfUtils';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StudentsPage = () => {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/admin');
          return;
        }
        
        // Fetch students for this hostel using the correct endpoint
        const response = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch students');
        
        const data = await response.json();
        setStudents(data.data || []);
        
        // If we have students, we can get hostel details from the first student or set a default
        if (data.data && data.data.length > 0) {
          setHostel({
            id: hostelId,
            name: data.data[0].hostelName || 'Hostel',
            address: data.data[0].hostelAddress || ''
          });
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [hostelId]);

  const handleAddStudent = () => {
    navigate(`/hostel/${hostelId}/add-student`);
  };

  const updateStudentStatus = async (studentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update status');
      }
      const updated = await res.json();
      // Update local state
      setStudents(prev => prev.map(s => (s.id === updated.id || s.id === studentId ? { ...s, ...updated } : s)));
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
      return { success: false, error: err };
    }
  };

  const handleAccept = async (student) => {
    // backend expects 'approved'
    await updateStudentStatus(student.id, 'approved');
  };

  const handleReject = async (student) => {
    await updateStudentStatus(student.id, 'rejected');
  };

  const handleDownload = async (student) => {
    try {
      // student object should contain full form data saved earlier; pass directly to PDF util
      await downloadStudentPdf(student);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>⏳</div>
          <div>Loading students...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>⚠️ Error</div>
          <p>{error}</p>
          <button 
            onClick={() => navigate(-1)}
            style={{
              ...styles.backButton,
              marginTop: '1rem',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: 'white',
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          onClick={() => navigate(-1)}
          style={styles.backButton}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Dashboard
        </button>
        
        <h1 style={styles.title}>{hostel?.name || 'Hostel'} - Students</h1>
        
        <button 
          onClick={handleAddStudent}
          style={styles.addButton}
        >
          <UserPlus size={18} style={{ marginRight: '8px' }} />
          Add New Student
        </button>
      </div>
      
      {hostel?.address && (
        <p style={styles.address}>
          <span style={{ fontWeight: '500', color: '#4b5563' }}>Address: </span>
          {hostel.address}
        </p>
      )}
      
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3 style={{ margin: 0, color: '#4b5563', fontSize: '1.125rem' }}>Student Records</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Search students..." 
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                minWidth: '250px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                ':focus': {
                  borderColor: '#8b5cf6',
                  boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
                },
              }}
            />
            <select 
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                fontSize: '0.9375rem',
                outline: 'none',
                cursor: 'pointer',
                ':focus': {
                  borderColor: '#8b5cf6',
                  boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
                },
              }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        {students.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#111827' }}>No students found</h3>
            <p style={{ margin: 0, maxWidth: '400px' }}>
              {hostel?.name ? 
                `No students have been added to ${hostel.name} yet.` : 
                'No students found for this hostel.'
              }
            </p>
            <button 
              onClick={handleAddStudent}
              style={{
                ...styles.addButton,
                marginTop: '1.5rem',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
              }}
            >
              <UserPlus size={18} style={{ marginRight: '8px' }} />
              Add Your First Student
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Application No.</th>
                  <th style={styles.th}>Student Details</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Contact</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const computedAppNo = (() => {
                    if (student.applicationNumber) return student.applicationNumber;
                    if (student.combinedId) return String(student.combinedId).replace(/\//g, '');
                    const hostelCode = student.hostelId || (hostel && hostel.hostelId) || null;
                    if (student.studentId && hostelCode) return `${String(hostelCode)}${String(student.studentId)}`;
                    return 'N/A';
                  })();

                  return (
                    <tr key={student.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ ...styles.nameText, fontFamily: 'monospace' }}>{computedAppNo}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={styles.avatar}>
                            {student.studentName ? student.studentName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={styles.nameText}>{student.studentName || student.name || 'N/A'}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                              {student.email || 'No email provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(student.status === 'approved' ? styles.statusAccepted : 
                              student.status === 'rejected' ? styles.statusRejected : 
                              styles.statusPending)
                        }}>
                          {student.status ? (
                            student.status === 'approved' ? 'Approved' : 
                            student.status === 'rejected' ? 'Rejected' : 'Pending'
                          ) : 'Pending'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.nameText}>{student.mobile1 || 'N/A'}</div>
                        {student.mobile2 && (
                          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                            Alt: {student.mobile2}
                          </div>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actionButtons}>
                          <button 
                            onClick={() => handleDownload(student)} 
                            style={{ ...styles.iconButton, ...styles.downloadButton }} 
                            title="Download Application"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => navigate(`/hostel/${hostelId}/add-student?editId=${student.id}&hostelDocId=${student.ownerHostelDocId || hostel?.id || hostelId}`)} 
                            style={{ ...styles.iconButton, ...styles.editButton }} 
                            title="Edit Student"
                          >
                            <Edit size={16} />
                          </button>
                          {student.status !== 'approved' && (
                            <button 
                              onClick={() => handleAccept(student)} 
                              style={{ ...styles.iconButton, ...styles.acceptButton }} 
                              title="Approve Application"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {student.status !== 'rejected' && (
                            <button 
                              onClick={() => handleReject(student)} 
                              style={{ ...styles.iconButton, ...styles.rejectButton }} 
                              title="Reject Application"
                            >
                              <X size={16} />
                            </button>
                          )}
                          <button 
                            onClick={async () => {
                              if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
                              try {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${student.id}`, { 
                                  method: 'DELETE', 
                                  headers: { 
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  } 
                                });
                                if (!res.ok) throw new Error('Delete failed');
                                setStudents(prev => prev.filter(s => s.id !== student.id));
                              } catch (err) {
                                console.error('Delete failed', err);
                                alert('Failed to delete student. Please try again.');
                              }
                            }} 
                            style={{ ...styles.iconButton, ...styles.deleteButton }} 
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
    boxSizing: 'border-box',
    width: '100%',
  },
  tableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '1rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.03)',
    padding: '1.5rem',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    marginBottom: '1rem',
    borderBottom: '1px solid #f0f0f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 0.5rem',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontWeight: '600',
    fontSize: '0.8125rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #f3f4f6',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9375rem',
    color: '#4b5563',
    backgroundColor: 'white',
    '&:first-child': {
      borderTopLeftRadius: '0.75rem',
      borderBottomLeftRadius: '0.75rem',
    },
    '&:last-child': {
      borderTopRightRadius: '0.75rem',
      borderBottomRightRadius: '0.75rem',
    },
  },
  tr: {
    transition: 'all 0.2s ease',
    '&:hover td': {
      backgroundColor: '#f9fafb',
    },
  },
  actionButton: {
    padding: '0.5rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  viewButton: {
    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    color: 'white',
  },
  editButton: {
    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    color: 'white',
  },
  deleteButton: {
    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
    color: 'white',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  nameText: {
    fontSize: '0.9375rem',
    color: '#111827',
    fontWeight: '500',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.375rem 0.875rem',
    borderRadius: '9999px',
    fontSize: '0.8125rem',
    fontWeight: '600',
    letterSpacing: '0.025em',
    textTransform: 'capitalize',
  },
  statusAccepted: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#047857',
  },
  statusRejected: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#b91c1c',
  },
  statusPending: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#b45309',
  },
  iconButton: {
    padding: '0.5rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  acceptButton: {
    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    color: 'white',
  },
  rejectButton: {
    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
    color: 'white',
  },
  downloadButton: {
    background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
    color: 'white',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '1.5rem',
    borderRadius: '1rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid rgba(0, 0, 0, 0.03)',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    background: '#f3f4f6',
    border: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    color: '#4b5563',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#e5e7eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '44px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  address: {
    color: '#6b7280',
    marginBottom: '1.5rem',
    fontSize: '0.9375rem',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(0, 0, 0, 0.03)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '1rem',
    margin: '1.5rem 0',
    border: '1px dashed #e5e7eb',
    color: '#6b7280',
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    fontSize: '1rem',
    fontWeight: '500',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
    border: '1px solid #fecaca',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
};

export default StudentsPage;
