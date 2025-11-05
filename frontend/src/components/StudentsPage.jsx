import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, Edit, Trash2 } from 'lucide-react';

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
          <button 
            onClick={handleAddStudent}
            style={styles.addButton}
          >
            <UserPlus size={16} style={{ marginRight: '8px' }} />
            Add New Student
          </button>
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
                <th style={styles.th}>Mobile Number</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{student.applicationNumber || 'N/A'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.avatar}>
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <span>{student.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{student.mobile1 || 'N/A'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        style={{ ...styles.actionButton, ...styles.viewButton }}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
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
