import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, Edit, Trash2, Check, X, Download } from 'lucide-react';
import { downloadStudentPdf } from '../utils/pdfUtils';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Custom hook for window size tracking
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

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

        const response = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch students');

        const data = await response.json();
        setStudents(data.data || []);

        if (data.data && data.data.length > 0) {
          setHostel({
            id: hostelId,
            name: data.data[0].hostelName || 'Hostel',
            address: data.data[0].hostelAddress || '',
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
  }, [hostelId, navigate]);

  const handleAddStudent = () => navigate(`/hostel/${hostelId}/add-student`);

  const updateStudentStatus = async (studentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
<<<<<<< HEAD
      if (!token) {
        navigate('/admin');
        return { success: false, error: 'Not authenticated' };
      }
      
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
=======
      if (!token) return alert('Not authenticated');
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}/status`, {
>>>>>>> 7b075585e70c5870001eb3dc24f00efde5b8787a
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

  const handleAccept = (student) => updateStudentStatus(student.id, 'approved');
  const handleReject = (student) => updateStudentStatus(student.id, 'rejected');
  const handleDownload = (student) => downloadStudentPdf(student).catch(() => alert('Failed to download PDF'));
  const handleViewStudent = (studentId) => navigate(`/hostel/${hostelId}/student/${studentId}`);
  const handleEditStudent = (student) =>
    navigate(`/hostel/${hostelId}/edit-student/${student.id}`, { state: { student } });

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete student');
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete student');
    }
  };

  const windowSize = useWindowSize();
  const isMobile = windowSize.width <= 768;
  const isSmallMobile = windowSize.width <= 480;

  if (loading)
    return (
      <div style={styles.container}>
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>Loading...</p>
      </div>
    );

  if (error)
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Dashboard
        </button>
      </div>
    );

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
            <button onClick={handleAddStudent} style={styles.addButton}>
              Add Student
            </button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Application No.</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  style={index % 2 === 0 ? styles.trEven : styles.trOdd}
                >
                  <td style={styles.td}>{student.applicationNumber || 'N/A'}</td>
                  <td style={styles.td}>{student.studentName || 'N/A'}</td>
                  <td style={styles.td}>{student.status || 'Pending'}</td>
                  <td style={styles.td}>{student.mobileNumber || 'N/A'}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleViewStudent(student.id)} style={styles.iconButton}>
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleEditStudent(student)} style={styles.iconButton}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDownload(student)} style={styles.iconButton}>
                      <Download size={16} />
                    </button>
                    <button onClick={() => handleDelete(student.id)} style={styles.iconButton}>
                      <Trash2 size={16} />
                    </button>
                    {student.status !== 'approved' && (
                      <button onClick={() => handleAccept(student)} style={styles.iconButton}>
                        <Check size={16} />
                      </button>
                    )}
                    {student.status !== 'rejected' && (
                      <button onClick={() => handleReject(student)} style={styles.iconButton}>
                        <X size={16} />
                      </button>
                    )}
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
