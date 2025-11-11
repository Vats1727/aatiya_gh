import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronUp, Users, Building2, FileText, IndianRupee } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://aatiya-gh-backend.onrender.com';

const SuperAdminPage = () => {
  const [allData, setAllData] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedHostels, setExpandedHostels] = useState({});
  const [expandedStudents, setExpandedStudents] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if superadmin is authenticated
    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
    if (!isSuperAdmin) {
      navigate('/admin/dashboard');
      return;
    }
    fetchAllData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isSuperAdmin');
    localStorage.removeItem('user');
    navigate('/admin');
  };

  const fetchAllData = async () => {
    try {
      setDataLoading(true);
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
      setSampleData();
    } finally {
      setDataLoading(false);
    }
  };

  const setSampleData = () => {
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

  // UI state for improved dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  const computeStats = () => {
    const users = allData.users || [];
    let totalHostels = 0, totalStudents = 0, totalPayments = 0;
    for (const u of users) {
      const hostels = u.hostels || [];
      totalHostels += hostels.length;
      for (const h of hostels) {
        const students = h.students || [];
        totalStudents += students.length;
        for (const s of students) {
          totalPayments += (s.payments || []).length;
        }
      }
    }
    return { totalUsers: users.length, totalHostels, totalStudents, totalPayments };
  };

  // Helper: format amounts and dates robustly (handles ISO, timestamps, Firestore-like objects)
  const formatAmount = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return 'N/A';
    // show with rupee symbol and grouping
    return `₹ ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num)}`;
  };

  const formatDateValue = (v) => {
    if (!v && v !== 0) return 'N/A';
    try {
      let d = null;
      if (typeof v === 'string' || typeof v === 'number') {
        d = new Date(v);
      } else if (v instanceof Date) {
        d = v;
      } else if (v && typeof v === 'object') {
        // Firestore timestamp-like: { seconds, nanoseconds }
        if (typeof v.seconds === 'number') d = new Date(v.seconds * 1000);
        else if (typeof v._seconds === 'number') d = new Date(v._seconds * 1000);
        else if (typeof v.toDate === 'function') d = v.toDate();
      }
      if (!d || Number.isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'N/A';
    }
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
          (() => {
            const stats = computeStats();
            const users = allData.users || [];
            const filtered = users.filter(u => {
              const q = searchTerm.trim().toLowerCase();
              if (!q) return true;
              return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
            });
            const selectedUser = (allData.users || []).find(u => u.userId === selectedUserId) || filtered[0] || null;
            return (
              <div style={{ display: 'flex', gap: 16 }}>
                {/* Left column: summary + user list */}
                <div style={{ width: '32%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin: 0, color: '#6b21a8' }}>Overview</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 45%', background: '#fff7ed', padding: 10, borderRadius: 8, fontWeight: 700 }}>{stats.totalUsers} Users</div>
                      <div style={{ flex: '1 1 45%', background: '#eef2ff', padding: 10, borderRadius: 8, fontWeight: 700 }}>{stats.totalHostels} Hostels</div>
                      <div style={{ flex: '1 1 45%', background: '#ecfccb', padding: 10, borderRadius: 8, fontWeight: 700 }}>{stats.totalStudents} Students</div>
                      <div style={{ flex: '1 1 45%', background: '#fff7ed', padding: 10, borderRadius: 8, fontWeight: 700 }}>{stats.totalPayments} Payments</div>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: 12, padding: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', flex: 1, overflow: 'auto' }}>
                    <input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e6e6e6' }}
                    />
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filtered.map(u => (
                        <div key={u.userId} onClick={() => setSelectedUserId(u.userId)} style={{ cursor: 'pointer', padding: 10, borderRadius: 8, background: u.userId === selectedUserId ? 'linear-gradient(90deg,#fbf7ff,#f3e8ff)' : '#fff', border: u.userId === selectedUserId ? '1px solid #e9d5ff' : '1px solid #f3f3f3' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>{u.name || u.email}</div>
                              <div style={{ color: '#6b7280', fontSize: 12 }}>{u.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 12, color: '#374151' }}>{(u.hostels || []).length} hostels</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filtered.length === 0 && <div style={{ color: '#9ca3af' }}>No users match</div>}
                    </div>
                  </div>
                </div>

                {/* Right column: selected user details */}
                <div style={{ width: '68%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {!selectedUser ? (
                    <div style={{ ...styles.emptyState, padding: 24 }}>Select a user from the left to view hostels, students and payments</div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      <h2 style={{ margin: 0, color: '#111827' }}>{selectedUser.name || selectedUser.email}</h2>
                      <p style={{ marginTop: 6, color: '#6b7280' }}>{selectedUser.email}</p>

                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(selectedUser.hostels || []).map(hostel => {
                          const hostelKey = `${selectedUser.userId}-${hostel.hostelId}`;
                          const isOpen = !!expandedHostels[hostelKey];
                          return (
                            <div key={hostel.hostelId} style={{ border: '1px solid #f3f3f3', borderRadius: 10, padding: 12, background: '#ffffff' }}>
                              <div style={styles.hostelHeader} onClick={() => toggleHostelExpand(selectedUser.userId, hostel.hostelId)}>
                                <div>
                                  <h4 style={{ margin: 0 }}>{hostel.name}</h4>
                                  <div style={{ color: '#6b7280', fontSize: 13 }}>Address: {hostel.address || 'N/A'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ color: '#6b7280', fontSize: 13 }}>{(hostel.students || []).length} students</div>
                                  <button style={styles.expandBtn} onClick={(e) => { e.stopPropagation(); toggleHostelExpand(selectedUser.userId, hostel.hostelId); }} aria-label={isOpen ? 'Collapse hostel' : 'Expand hostel'}>
                                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </button>
                                </div>
                              </div>

                              {isOpen && (
                                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {(hostel.students || []).map(student => (
                                    <div key={student.studentId} style={{ padding: 10, borderRadius: 8, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <div style={{ fontWeight: 700 }}>{student.studentName}</div>
                                        <div style={{ color: '#6b7280', fontSize: 13 }}>{student.email || '-'}</div>
                                      </div>
                                      <div style={{ minWidth: 240 }}>
                                        {(student.payments || []).length === 0 ? (
                                          <div style={{ color: '#9ca3af' }}>No payments</div>
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {student.payments.map((payment, idx) => {
                                              const expected = Number(payment.expectedAmount ?? payment.dueAmount ?? hostel?.monthlyFee ?? payment.monthlyFee ?? 0);
                                              const paid = Number(payment.amount || 0);
                                              const diff = (!Number.isNaN(expected) && !Number.isNaN(paid)) ? (expected - paid) : null;
                                              const dateStr = formatDateValue(payment.date ?? payment.paidAt ?? payment.createdAt ?? payment.timestamp ?? payment.paid_on ?? payment.paymentDate);
                                              return (
                                                <div key={payment.paymentId || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                  <div style={{ fontWeight: 700 }}>{formatAmount(paid)}</div>
                                                  <div style={{ color: '#6b7280' }}>{dateStr}</div>
                                                  <div style={{ minWidth: 120, textAlign: 'right' }}>
                                                    {diff === null ? <span style={{ color: '#9ca3af' }}>N/A</span> : diff > 0 ? <span style={{ color: '#92400e' }}>{formatAmount(diff)} left</span> : diff < 0 ? <span style={{ color: '#166534' }}>{formatAmount(Math.abs(diff))} advance</span> : <span style={{ color: '#3730a3' }}>Settled</span>}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {((hostel.students || []).length === 0) && <div style={{ color: '#9ca3af', marginLeft: 6 }}>No students in this hostel</div>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
