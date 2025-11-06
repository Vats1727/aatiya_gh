import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, Edit, Trash2, Check, X, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadStudentPdf } from '../utils/pdfUtils';
import '../styles.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ITEMS_PER_PAGE = 10;

const StudentsPage = () => {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

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
      // Use generic nested student PUT endpoint (backend handles partial updates)
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
    try {
      await updateStudentStatus(student.id, 'approved');
      // Update local state immediately for better UX
      setStudents(prev => prev.map(s => 
        s.id === student.id ? { ...s, status: 'approved' } : s
      ));
    } catch (error) {
      console.error('Failed to accept student:', error);
    }
  };

  const handleReject = async (student) => {
    try {
      await updateStudentStatus(student.id, 'rejected');
      // Update local state immediately for better UX
      setStudents(prev => prev.map(s => 
        s.id === student.id ? { ...s, status: 'rejected' } : s
      ));
    } catch (error) {
      console.error('Failed to reject student:', error);
    }
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

  // Move hooks to the top level
  const filteredStudents = useMemo(() => {
    if (loading) return [];
    if (error) return [];
    
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        (student.studentName && student.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.applicationNumber && student.applicationNumber.toString().includes(searchTerm)) ||
        (student.combinedId && student.combinedId.toString().includes(searchTerm));
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending' && (!student.status || student.status === 'pending')) ||
        (statusFilter === 'approved' && student.status === 'approved') ||
        (statusFilter === 'rejected' && student.status === 'rejected');
      
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter, loading, error]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const currentStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="container" style={styles.container}>
      <div className="header" style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            style={styles.backButton}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={18} style={{ marginRight: '6px', flexShrink: 0 }} />
            <span>Back to Dashboard</span>
          </button>

          <h1 style={styles.title}>
            {hostel?.name ? `${hostel.name} - Students` : 'Hostel Students'}
          </h1>
          
          <button 
            onClick={handleAddStudent}
            style={styles.addButton}
            aria-label="Add New Student"
          >
            <UserPlus size={18} style={{ marginRight: '6px', flexShrink: 0 }} />
            <span>Add Student</span>
          </button>
        </div>
      </div>
      
      <p style={styles.address}>{hostel?.address}</p>

      {/* Search and Filter Section */}
      <div style={styles.searchFilterContainer}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or application number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.filterContainer}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when changing filter
            }}
            style={styles.statusFilter}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <div className="card" style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3>Students</h3>
        </div>
        
        {filteredStudents.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No students found matching your criteria.</p>
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
              {currentStudents.map((student, index) => {
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
                  <td style={styles.td}>
                    <span style={{...styles.statusBadge, ...(student.status === 'approved' ? styles.statusAccepted : student.status === 'rejected' ? styles.statusRejected : {})}}>
                      {student.status ? (student.status === 'approved' ? 'Accepted' : student.status === 'rejected' ? 'Rejected' : student.status) : 'Pending'}
                    </span>
                  </td>
                  <td style={styles.td}>{student.mobile1 || 'N/A'}</td>
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
        
        {/* Pagination */}
        {filteredStudents.length > ITEMS_PER_PAGE && (
          <div style={styles.pagination}>
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...styles.pageButton,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show first page, last page, current page, and pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === pageNum ? styles.activePageButton : {})
                  }}
                  aria-label={`Page ${pageNum}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                ...styles.pageButton,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
            
            <div style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
        
        <div style={styles.resultCount}>
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredStudents.length)}-{
            Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)
          } of {filteredStudents.length} students
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    margin: '0 auto',
    padding: '1rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
    boxSizing: 'border-box',
    '@media (min-width: 481px)': {
      padding: '1.25rem',
    },
    '@media (min-width: 769px)': {
      maxWidth: '1200px',
      padding: '1.5rem',
    },
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflowX: 'auto',
    width: '100%',
    margin: '0 auto',
    '@media (min-width: 769px)': {
      borderRadius: '0.75rem',
    },
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  table: {
    width: '100%',
    minWidth: '600px', // Ensures table doesn't get too narrow on small screens
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontWeight: '600',
    fontSize: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media (min-width: 481px)': {
      fontSize: '0.8125rem',
      padding: '0.875rem 1rem',
    },
    '@media (min-width: 769px)': {
      fontSize: '0.875rem',
      padding: '1rem 1.25rem',
    },
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.75rem',
    color: '#4b5563',
    verticalAlign: 'middle',
    wordBreak: 'break-word',
    '@media (min-width: 481px)': {
      fontSize: '0.8125rem',
      padding: '0.875rem 1rem',
    },
    '@media (min-width: 769px)': {
      fontSize: '0.875rem',
      padding: '1rem 1.25rem',
    },
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
    padding: '0.4rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
    '@media (min-width: 481px)': {
      padding: '0.5rem',
    },
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
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    position: 'relative',
    zIndex: 10,
    '@media (min-width: 481px)': {
      padding: '1rem 1.25rem',
      borderRadius: '0.875rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      marginBottom: '1.25rem',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
    },
    '@media (min-width: 769px)': {
      padding: '1rem 1.5rem',
      borderRadius: '1rem',
      marginBottom: '1.5rem',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
      borderTopLeftRadius: '0.75rem',
      borderTopRightRadius: '0.75rem',
      '@media (min-width: 481px)': {
        borderTopLeftRadius: '0.875rem',
        borderTopRightRadius: '0.875rem',
      },
      '@media (min-width: 769px)': {
        borderTopLeftRadius: '1rem',
        borderTopRightRadius: '1rem',
      },
    },
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 0.875rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    color: '#4b5563',
    fontWeight: '500',
    fontSize: '0.875rem',
    lineHeight: '1.25',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 1,
    '&:hover': {
      background: '#f1f5f9',
      borderColor: '#cbd5e1',
      transform: 'translateY(-1px)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 'none'
    },
    '@media (min-width: 481px)': {
      width: 'auto',
      padding: '0.5rem 1rem',
      justifyContent: 'flex-start',
    },
    '@media (min-width: 769px)': {
      padding: '0.5rem 1.125rem',
    },
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#6b21a8',
    margin: 0,
    padding: '0.25rem 0',
    flex: 1,
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '@media (min-width: 375px)': {
      fontSize: '1.375rem',
    },
    '@media (min-width: 481px)': {
      fontSize: '1.5rem',
      textAlign: 'left',
      padding: '0 1rem',
    },
    '@media (min-width: 768px)': {
      fontSize: '1.625rem',
    },
  },
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    lineHeight: '1.25',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 1,
    '&:hover': {
      opacity: 0.95,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px -2px rgba(139, 92, 246, 0.3)'
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 4px -1px rgba(139, 92, 246, 0.2)'
    },
    '@media (min-width: 481px)': {
      width: 'auto',
      padding: '0.5rem 1.125rem',
    },
    '@media (min-width: 769px)': {
      padding: '0.6rem 1.25rem',
    },
  },
  address: {
    color: '#6b7280',
    marginTop: '0.25rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    padding: '0 0.5rem',
    lineHeight: '1.5',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '@media (min-width: 481px)': {
      textAlign: 'left',
      marginLeft: '0.5rem',
      marginTop: '0.5rem',
      marginBottom: '1.5rem',
    },
  },
  // Search and Filter Styles
  searchFilterContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
    '@media (min-width: 640px)': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '0.6rem 1rem 0.6rem 2.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
    },
  },
  filterContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  statusFilter: {
    padding: '0.6rem 2.5rem 0.6rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '0.875rem',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.7em top 50%',
    backgroundSize: '0.65em auto',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
    },
  },
  
  // Pagination Styles
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
    padding: '1rem 0',
    borderTop: '1px solid #e5e7eb',
  },
  pageButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#4b5563',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover:not(:disabled)': {
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
    },
  },
  activePageButton: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    color: 'white',
    '&:hover': {
      backgroundColor: '#7c3aed',
      borderColor: '#7c3aed',
    },
  },
  pageInfo: {
    marginLeft: '1rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  resultCount: {
    textAlign: 'right',
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    padding: '0 0.5rem',
  },
  
  // Empty State
  emptyState: {
    padding: '3rem 1rem',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.9375rem',
    '@media (min-width: 481px)': {
      padding: '2rem',
      fontSize: '1rem',
    },
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
