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
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
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
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={() => navigate('/admin/dashboard')}
          style={styles.backButton}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/admin/dashboard')}
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
          <UserPlus size={16} style={{ marginRight: '8px' }} />
          Add Student
        </button>
      </div>
      
      <p style={styles.address}>{hostel?.address}</p>
      
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3>Students</h3>
        </div>
        
        {students.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No students found in this hostel.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Application No.</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Mobile Number</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                // Compute application number display:
                // preferred: student.applicationNumber
                // else if student.combinedId exists (e.g. "02/0001") show without slash -> "020001"
                // else if student.studentId and hostel.hostelId available, join them
                const computedAppNo = (() => {
                  if (student.applicationNumber) return student.applicationNumber;
                    if (student.combinedId) return String(student.combinedId).replace(/\//g, '');
                  // some records may store studentId and hostelId separately
                  const hostelCode = student.hostelId || (hostel && hostel.hostelId) || null;
                  if (student.studentId && hostelCode) return `${String(hostelCode)}${String(student.studentId)}`;
                  return 'N/A';
                })();

                return (
                <tr key={student.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{computedAppNo}</td>
                  <td style={styles.td}>
                    <span style={styles.nameText}>{student.studentName || student.name || 'N/A'}</span>
                  </td>
                  <td style={styles.td}>{student.mobile1 || 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={{...styles.statusBadge, ...(student.status === 'approved' ? styles.statusAccepted : student.status === 'rejected' ? styles.statusRejected : {})}}>
                      {student.status ? (student.status === 'approved' ? 'Accepted' : student.status === 'rejected' ? 'Rejected' : student.status) : 'Pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleAccept(student)} style={{ ...styles.iconButton, ...styles.acceptButton }} title="Accept">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleReject(student)} style={{ ...styles.iconButton, ...styles.rejectButton }} title="Reject">
                        <X size={16} />
                      </button>
                      <button onClick={() => navigate(`/hostel/${hostelId}/add-student?editId=${student.id}&hostelDocId=${student.ownerHostelDocId || hostel?.id || hostelId}`)} style={{ ...styles.iconButton, ...styles.editButton }} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDownload(student)} style={{ ...styles.iconButton, ...styles.downloadButton }} title="Download">
                        <Download size={16} />
                      </button>
                      <button onClick={async () => {
                          if (!confirm('Delete this student? This cannot be undone.')) return;
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${student.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                            if (!res.ok) throw new Error('Delete failed');
                            setStudents(prev => prev.filter(s => s.id !== student.id));
                          } catch (err) {
                            console.error('Delete failed', err);
                            alert('Failed to delete student');
                          }
                        }} style={{ ...styles.iconButton, ...styles.deleteButton }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                      
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontWeight: '600',
    fontSize: '0.875rem',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    color: '#4b5563',
  },
  trEven: {
    backgroundColor: '#ffffff',
  },
  trOdd: {
    backgroundColor: '#f9fafb',
  },
  actionButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      opacity: 0.8,
    },
  },
  viewButton: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  editButton: {
    backgroundColor: '#f0fdf4',
    color: '#15803d',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
  },
  nameText: {
    fontSize: '0.95rem',
    color: '#111827',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontWeight: 600,
    fontSize: '0.75rem',
  },
  statusAccepted: {
    backgroundColor: '#ecfccb',
    color: '#365314',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
    color: '#7f1d1d',
  },
  iconButton: {
    padding: '6px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
  },
  acceptButton: {
    backgroundColor: '#ecfdf5',
    color: '#0f766e',
  },
  rejectButton: {
    backgroundColor: '#fff1f2',
    color: '#9f1239',
  },
  downloadButton: {
    backgroundColor: '#eef2ff',
    color: '#3730a3',
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
  backButton: {
    display: 'flex',
    alignItems: 'center',
    background: '#f3f4f6',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    color: '#4b5563',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#e5e7eb',
      transform: 'translateY(-1px)',
    },
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#6b21a8',
    margin: 0,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
    },
  },
  address: {
    color: '#64748b',
    marginBottom: '30px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #e2e8f0',
  },
  studentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)',
    },
    transition: 'all 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #fecaca',
  },
};

export default StudentsPage;
