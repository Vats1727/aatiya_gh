import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, Edit, Trash2, Plus } from 'lucide-react';

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
            'Authorization': `Bearer ${token}`
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

  const handleViewStudent = (studentId) => {
    navigate(`/hostel/${hostelId}/student/${studentId}`);
  };

  const handleEditStudent = (studentId, e) => {
    e.stopPropagation();
    navigate(`/hostel/${hostelId}/edit-student/${studentId}`);
  };

  const handleDeleteStudent = async (studentId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/students/${studentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete student');
        }

        // Refresh students list
        setStudents(students.filter(student => student.id !== studentId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading students...</p>
        </div>
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
          onClick={() => navigate(-1)}
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
        <div style={styles.headerLeft}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={styles.backButton}
          >
            <ArrowLeft size={18} style={{ marginRight: '8px' }} />
            Back to Dashboard
          </button>
          <h1 style={styles.title}>{hostel?.name || 'Hostel'} - Students</h1>
        </div>
        
        <button 
          onClick={handleAddStudent}
          style={styles.primaryButton}
        >
          <Plus size={18} style={{ marginRight: '8px' }} />
          New Student
        </button>
      </div>
      
      {hostel?.address && <p style={styles.address}>{hostel.address}</p>}
      
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Student List</h3>
          <span style={styles.studentCount}>{students.length} {students.length === 1 ? 'student' : 'students'}</span>
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
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>
                    <span style={styles.appNumber}>{student.applicationNumber || 'N/A'}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={styles.avatar}>
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div style={styles.studentName}>{student.name || 'N/A'}</div>
                        <div style={styles.studentCourse}>{student.course || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.email}>{student.email || 'N/A'}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.phone}>{student.mobile1 || 'N/A'}</div>
                    {student.mobile2 && <div style={styles.phone}>{student.mobile2}</div>}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.status}>
                      {student.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleViewStudent(student.id)}
                        style={{ ...styles.actionButton, ...styles.viewButton }}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleEditStudent(student.id, e)}
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteStudent(student.id, e)}
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
    padding: '24px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  address: {
    color: '#6b7280',
    margin: '0 0 24px 0',
    fontSize: '15px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  studentCount: {
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  th: {
    textAlign: 'left',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    color: '#4b5563',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#1f2937',
    verticalAlign: 'middle',
  },
  trEven: {
    backgroundColor: '#ffffff',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  trOdd: {
    backgroundColor: '#f9fafb',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
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
  backButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    color: '#4b5563',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f9fafb',
      borderColor: '#d1d5db',
    },
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(147, 51, 234, 0.2)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

export default StudentsPage;
