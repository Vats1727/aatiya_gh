import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { Download, Edit, Check, X, Trash } from 'lucide-react';
=======
import { FileDown, Edit, Check, X, Trash, FileText } from 'lucide-react';
import { downloadStudentPdf } from '../utils/pdfUtils';
>>>>>>> 97c7dd9c95d43b36839af09cd525257c86b6509f

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig] = useState({ key: null, direction: 'asc' });
  const rowsPerPage = 10;
  const navigate = useNavigate();

  // Simple sort function that just returns the array as is
  const sortArray = (array) => {
    return [...array]; // Return a copy of the array without sorting
  };

  // Filter students based on search query and status
  const filterStudents = () => {
    const q = String(searchQuery || '').trim().toLowerCase();
    return allStudents.filter(student => {
      // Status filter - case insensitive comparison
      if (statusFilter !== 'all') {
        const studentStatus = String(student.status || '').toLowerCase();
        if (studentStatus !== statusFilter.toLowerCase()) return false;
      }
      
      // If no search query, return all matching status
      if (!q) return true;
      
      // Search in name and mobile numbers
      const name = String(student.studentName || '').toLowerCase();
      const mobile1 = String(student.mobile1 || '').toLowerCase();
      const mobile2 = String(student.mobile2 || '').toLowerCase();
      
      return name.includes(q) || mobile1.includes(q) || mobile2.includes(q);
    });
  };

  // Get current students for pagination
  const getCurrentStudents = () => {
    const filtered = filterStudents();
    const sorted = sortArray(filtered);
    
    // Calculate pagination
    const indexOfLastStudent = currentPage * rowsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - rowsPerPage;
    
    // Add sequential numbers to each student
    const studentsWithNumbers = sorted.map((student, index) => ({
      ...student,
      seqNum: index + 1
    }));
    
    return {
      currentStudents: studentsWithNumbers.slice(indexOfFirstStudent, indexOfLastStudent),
      totalPages: Math.ceil(sorted.length / rowsPerPage)
    };
  };
  
  const { currentStudents, totalPages } = getCurrentStudents();
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);
  
  // Apply filters whenever search query or status changes
  useEffect(() => {
    if (allStudents.length > 0) {
      const filtered = filterStudents();
      setStudents(filtered);
    }
  }, [searchQuery, statusFilter, allStudents]);

  // Fetch students data
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/students`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setAllStudents(data);
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication and fetch data on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }
    fetchStudents();
  }, [navigate]);

  const styles = {
    // ... existing styles ...
    editButton: {
      color: '#3b82f6',
      '&:hover': {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
      },
    },
    viewButton: {
      color: '#10b981',
      '&:hover': {
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
      },
    },
    deleteButton: {
      color: '#ef4444',
      '&:hover': {
        backgroundColor: '#fef2f2',
        borderColor: '#ef4444',
      },
    },
    acceptButton: {
      color: '#10b981',
      '&:hover': {
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    rejectButton: {
      color: '#f59e0b',
      '&:hover': {
        backgroundColor: '#fffbeb',
        borderColor: '#f59e0b',
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
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
    statusFilter: {
      padding: '0.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      '&:focus': {
        outline: 'none',
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)',
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

  const handleDownloadStudentPdf = async (student) => {
    try {
      const result = await downloadStudentPdf(student);
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

<<<<<<< HEAD
  const handleDownload = async (id) => {
    try {
      // First, get the student data
      const studentRes = await fetch(`${API_BASE}/api/students/${id}`);
      if (!studentRes.ok) throw new Error('Failed to fetch student data');
      const studentData = await studentRes.json();
      
      // Then request server-side PDF endpoint which returns a PDF attachment
      const response = await fetch(`${API_BASE}/api/students/${id}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF from server');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${studentData.studentName || 'student'}-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
=======
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const response = await fetch(`${API_BASE}/api/students/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete student');
        fetchStudents(); // Refresh the list
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Failed to delete student');
      }
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await fetch(`${API_BASE}/api/students/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      
      // Refresh the student list
      fetchStudents();
>>>>>>> 97c7dd9c95d43b36839af09cd525257c86b6509f
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Failed to ${status} student: ${err.message}`);
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
            <div style={applyResponsiveStyles(styles.searchContainer)}>
              <input
                type="text"
                placeholder="Search by name or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={applyResponsiveStyles(styles.searchInput)}
                aria-label="Search students"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={applyResponsiveStyles(styles.statusFilter)}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', '@media (max-width: 600px)': { width: '100%' } }}>
              <button 
                style={{ ...applyResponsiveStyles(styles.addButton), '@media (max-width: 600px)': { flex: 1 } }} 
                onClick={handleAddNew}
                type="button"
              >
                Add New
              </button>
              <button 
                style={{ ...applyResponsiveStyles(styles.logoutButton), '@media (max-width: 600px)': { flex: 1 } }} 
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={applyResponsiveStyles(styles.error)}>
            {error}
          </div>
        )}

        {/* Pagination Controls */}
        {students.length > 0 && (
          <div style={styles.pagination}>
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              style={styles.pageButton}
              type="button"
              aria-label="First page"
            >
              ««
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={styles.pageButton}
              type="button"
              aria-label="Previous page"
            >
              «
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              style={styles.pageButton}
              type="button"
              aria-label="Next page"
            >
              »
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              style={styles.pageButton}
              type="button"
              aria-label="Last page"
            >
              »»
            </button>
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
              {currentStudents.map((student, idx) => (
                <tr key={student.id}>
                  <td style={styles.td}>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
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
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => navigate(`/student-form?editId=${student.id}`)}
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDownloadStudentPdf(student)}
                        style={{ ...styles.actionButton, ...styles.viewButton }}
                        title="View/Download PDF"
                      >
                        <FileDown size={16} />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(student.id, 'approved')}
                        style={{ 
                          ...styles.actionButton, 
                          ...styles.acceptButton,
                          ...(student.status === 'approved' && { 
                            backgroundColor: '#ecfdf5',
                            borderColor: '#10b981'
                          })
                        }}
                        title="Approve Application"
                        disabled={student.status === 'approved'}
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(student.id, 'rejected')}
                        style={{ 
                          ...styles.actionButton, 
                          ...styles.rejectButton,
                          ...(student.status === 'rejected' && { 
                            backgroundColor: '#fffbeb',
                            borderColor: '#f59e0b'
                          })
                        }}
                        title="Reject Application"
                        disabled={student.status === 'rejected'}
                      >
                        <X size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div style={styles.emptyState}>
              No students found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;