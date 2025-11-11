import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronUp, Users, Building2, FileText, IndianRupee } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://aatiya-gh-backend.onrender.com';

// Hardcoded superadmin credentials
const SUPERADMIN_CREDENTIALS = {
  username: 'superadmin@gmail.com',
  password: 'superadmin@123'
};

const SuperAdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allData, setAllData] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedHostels, setExpandedHostels] = useState({});
  const [expandedStudents, setExpandedStudents] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const superadminToken = localStorage.getItem('superadminToken');
    if (superadminToken) {
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate superadmin credentials
    if (
      credentials.username === SUPERADMIN_CREDENTIALS.username &&
      credentials.password === SUPERADMIN_CREDENTIALS.password
    ) {
      localStorage.setItem('superadminToken', 'verified');
      setIsAuthenticated(true);
      fetchAllData();
      setCredentials({ username: '', password: '' });
    } else {
      setError('Invalid superadmin credentials');
    }
    setIsLoading(false);
  };

  const fetchAllData = async () => {
    try {
      setDataLoading(true);
      // Fetch all users and their data from backend
      const response = await fetch(`${API_BASE}/api/superadmin/all-data`, {
        headers: {
          'Authorization': 'Bearer superadmin-token',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setAllData(data.data || {});
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please ensure backend supports superadmin endpoint.');
      // Show sample data structure for testing
      setSampleData();
    } finally {
      setDataLoading(false);
    }
  };

  const setSampleData = () => {
    // Sample data structure for UI testing
    setAllData({
      users: [
        {
          userId: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          hostels: [
            {
              hostelId: 'hostel1',
              name: 'Hostel A',
              address: 'Address A',
              students: [
                {
                  studentId: 'student1',
                  studentName: 'Student 1',
                  email: 'student1@example.com',
                  payments: [
                    { paymentId: 'pay1', amount: 5000, date: '2024-01-15', status: 'Paid' },
                    { paymentId: 'pay2', amount: 5000, date: '2024-02-15', status: 'Pending' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });
  };

  const toggleUserExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleHostelExpand = (userId, hostelId) => {
    const key = `${userId}-${hostelId}`;
    setExpandedHostels(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleStudentExpand = (userId, hostelId, studentId) => {
    const key = `${userId}-${hostelId}-${studentId}`;
    setExpandedStudents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('superadminToken');
    setIsAuthenticated(false);
    setAllData({});
    setCredentials({ username: '', password: '' });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1rem',
      boxSizing: 'border-box',
    },
    loginContainer: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
    },
    loginForm: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      border: '1px solid rgba(0, 0, 0, 0.05)',
    },
    title: {
      textAlign: 'center',
      color: '#db2777',
      fontSize: '1.75rem',
      marginBottom: '1.5rem',
      fontWeight: '700',
    },
    inputGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#374151',
      fontWeight: '600',
      fontSize: '0.9375rem',
    },
    input: {
      width: '100%',
      padding: '0.875rem 1rem',
      border: '2px solid #f0f0f0',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      boxSizing: 'border-box',
      minHeight: '52px',
      backgroundColor: '#f9fafb',
      outline: 'none',
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.75rem',
      fontSize: '1.05rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      minHeight: '52px',
      marginTop: '0.5rem',
    },
    error: {
      color: '#dc2626',
      marginBottom: '1.25rem',
      textAlign: 'center',
      fontSize: '0.9375rem',
      padding: '0.875rem',
      borderRadius: '0.5rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
    },
    contentContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      background: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#db2777',
      fontSize: '1.75rem',
      margin: 0,
      fontWeight: '700',
    },
    logoutBtn: {
      background: '#4b5563',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: '600',
    },
    userCard: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      border: '2px solid #f3e8ff',
    },
    userHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
    },
    userInfo: {
      flex: 1,
    },
    userTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937',
      margin: '0 0 0.25rem 0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    userEmail: {
      color: '#6b7280',
      fontSize: '0.9rem',
      margin: 0,
    },
    expandBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#8b5cf6',
      fontSize: '1.5rem',
    },
    hostelCard: {
      background: '#f9fafb',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginTop: '1rem',
      marginLeft: '1rem',
      borderLeft: '4px solid #8b5cf6',
    },
    hostelHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
    },
    hostelTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#374151',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    studentCard: {
      background: 'white',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      marginTop: '0.75rem',
      marginLeft: '1rem',
      borderLeft: '3px solid #ec4899',
    },
    studentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
    },
    studentTitle: {
      fontSize: '0.95rem',
      fontWeight: '500',
      color: '#1f2937',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    paymentList: {
      background: '#f3f4f6',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      marginTop: '0.75rem',
      fontSize: '0.875rem',
    },
    paymentItem: {
      padding: '0.5rem 0',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6b7280',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }
  };

  // Login UI
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <form style={styles.loginForm} onSubmit={handleLogin}>
          <h1 style={styles.title}>Super Admin Login</h1>
          
          {error && (
            <div style={styles.error}>{error}</div>
          )}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              style={styles.input}
              placeholder="superadmin@gmail.com"
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  // Main Dashboard UI
  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Super Admin Dashboard</h1>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {error && (
          <div style={{ ...styles.error, marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {dataLoading ? (
          <div style={styles.loadingContainer}>
            <p>Loading data...</p>
          </div>
        ) : Object.keys(allData).length === 0 || !allData.users || allData.users.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No users found</p>
          </div>
        ) : (
          allData.users?.map((user) => (
            <div key={user.userId} style={styles.userCard}>
              <div style={styles.userHeader} onClick={() => toggleUserExpand(user.userId)}>
                <div style={styles.userInfo}>
                  <h2 style={styles.userTitle}>
                    <Users size={18} />
                    {user.name || user.email || 'Unknown User'}
                  </h2>
                  <p style={styles.userEmail}>{user.email}</p>
                </div>
                <button style={styles.expandBtn}>
                  {expandedUsers[user.userId] ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>

              {expandedUsers[user.userId] && (
                <div style={{ marginTop: '1rem' }}>
                  {user.hostels?.map((hostel) => (
                    <div key={hostel.hostelId} style={styles.hostelCard}>
                      <div style={styles.hostelHeader} onClick={() => toggleHostelExpand(user.userId, hostel.hostelId)}>
                        <h3 style={styles.hostelTitle}>
                          <Building2 size={16} />
                          {hostel.name || 'Unnamed Hostel'}
                        </h3>
                        <button style={styles.expandBtn}>
                          {expandedHostels[`${user.userId}-${hostel.hostelId}`] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                        Address: {hostel.address || 'N/A'}
                      </p>

                      {expandedHostels[`${user.userId}-${hostel.hostelId}`] && (
                        <div style={{ marginTop: '0.75rem' }}>
                          {hostel.students?.map((student) => (
                            <div key={student.studentId} style={styles.studentCard}>
                              <div style={styles.studentHeader} onClick={() => toggleStudentExpand(user.userId, hostel.hostelId, student.studentId)}>
                                <h4 style={styles.studentTitle}>
                                  <Users size={14} />
                                  {student.studentName || 'Unnamed Student'}
                                </h4>
                                <button style={styles.expandBtn}>
                                  {expandedStudents[`${user.userId}-${hostel.hostelId}-${student.studentId}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>
                              <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                                Email: {student.email || 'N/A'}
                              </p>

                              {expandedStudents[`${user.userId}-${hostel.hostelId}-${student.studentId}`] && (
                                <div style={styles.paymentList}>
                                  <p style={{ margin: '0 0 0.75rem 0', fontWeight: '600', color: '#1f2937' }}>
                                    <FileText size={14} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                    Payments:
                                  </p>
                                  {student.payments && student.payments.length > 0 ? (
                                    student.payments.map((payment, idx) => (
                                      <div key={payment.paymentId || idx} style={styles.paymentItem}>
                                        <span>
                                          <IndianRupee size={12} style={{ marginRight: '0.25rem', display: 'inline' }} />
                                          {payment.amount || 0}
                                        </span>
                                        <span>{payment.date || 'N/A'}</span>
                                        <span style={{
                                          padding: '0.2rem 0.5rem',
                                          borderRadius: '0.25rem',
                                          fontSize: '0.75rem',
                                          fontWeight: '600',
                                          background: payment.status === 'Paid' ? '#dcfce7' : '#fef3c7',
                                          color: payment.status === 'Paid' ? '#166534' : '#92400e'
                                        }}>
                                          {payment.status || 'Pending'}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>No payments</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          {!hostel.students || hostel.students.length === 0 && (
                            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.75rem 0 0 1rem' }}>No students</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {!user.hostels || user.hostels.length === 0 && (
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.75rem 0 0 1rem' }}>No hostels</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
