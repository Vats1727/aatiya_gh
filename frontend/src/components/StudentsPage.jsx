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
      if (!token) return alert('Not authenticated');
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setStudents((prev) =>
        prev.map((s) => (s.id === updated.id || s.id === studentId ? { ...s, ...updated } : s))
      );
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
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
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} style={{ marginRight: '8px' }} /> {!isSmallMobile && 'Back to Dashboard'}
        </button>
        <h1 style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          {hostel?.name || 'Hostel'} - Students
        </h1>
        <button onClick={handleAddStudent} style={styles.addButton}>
          <UserPlus size={16} style={{ marginRight: '6px' }} /> {!isSmallMobile && 'Add Student'}
        </button>
      </header>

      <div style={styles.content}>
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
  container: { minHeight: '100vh', backgroundColor: '#f8fafc' },
  header: { background: '#1e40af', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center' },
  backButton: { background: 'none', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  addButton: { background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' },
  content: { padding: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem', background: '#f1f5f9' },
  td: { padding: '0.75rem', borderBottom: '1px solid #e2e8f0' },
  trEven: { background: '#fff' },
  trOdd: { background: '#f9fafb' },
  iconButton: { background: 'none', border: 'none', cursor: 'pointer', margin: '0 4px' },
  emptyState: { textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '8px' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px' },
};

export default StudentsPage;
