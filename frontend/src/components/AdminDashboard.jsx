import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, ArrowRight, Home, UserPlus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Inline styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#6c757d',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  input: {
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    transition: 'border-color 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: '#0d6efd',
      boxShadow: '0 0 0 0.2rem rgba(13, 110, 253, 0.25)',
    },
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#0d6efd',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#0b5ed7',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  hostelList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  hostelCard: {
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      borderColor: '#dee2e6',
    },
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb',
  },
  success: {
    color: '#0f5132',
    backgroundColor: '#d1e7dd',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #badbcc',
  },
  loading: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#6c757d',
  },
};

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [form, setForm] = useState({ name: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const data = await response.json();
      setUser(data.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again.');
      if (err.message.includes('401')) {
        localStorage.removeItem('token');
        navigate('/admin');
      }
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/admin');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create hostel');
      }

      const data = await response.json();
      setHostels(prev => [...prev, data.data]);
      setSuccess(`Hostel "${data.data.name}" created successfully!`);
      setForm({ name: '', address: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating hostel:', err);
      setError(err.message || 'An error occurred while creating the hostel');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch hostels for the current user
  const fetchHostels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/admin');
          return;
        }
        throw new Error('Failed to fetch hostels');
      }
      
      const data = await response.json();
      setHostels(data.data || []);
    } catch (err) {
      console.error('Error fetching hostels:', err);
      setError('Failed to load hostels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle view students for a hostel
  const handleViewStudents = (hostelId) => {
    navigate(`/hostel/${hostelId}/students`);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchUserProfile();
      await fetchHostels();
    };
    
    loadData();
  }, []);

  if (loading && hostels.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p>Loading dashboard...</p>
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
          onClick={() => window.location.reload()}
          style={styles.button}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* User Profile Section */}
      <div style={styles.profile}>
        <div style={styles.avatar}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#212529' }}>{user?.name || 'User'}</h2>
          <p style={{ margin: '5px 0 0', color: '#6c757d' }}>{user?.email || ''}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      {/* Add Hostel Section */}
      <div style={styles.section}>
        <h3 style={{ marginTop: 0 }}>Add New Hostel</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Hostel Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter hostel name"
              style={styles.input}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div>
            <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter hostel address"
              style={styles.input}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
            disabled={isSubmitting || !form.name || !form.address}
          >
            <Plus size={18} />
            {isSubmitting ? 'Creating...' : 'Add Hostel'}
          </button>
        </form>
      </div>

      {/* Hostels List */}
      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Your Hostels</h3>
          <span style={{ color: '#6c757d' }}>{hostels.length} {hostels.length === 1 ? 'hostel' : 'hostels'}</span>
        </div>
        
        {loading ? (
          <div style={styles.loading}>Loading hostels...</div>
        ) : hostels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#6c757d' }}>
            <p>You haven't added any hostels yet.</p>
            <p>Add your first hostel using the form above.</p>
          </div>
        ) : (
          <div style={styles.hostelList}>
            {hostels.map(hostel => (
              <div 
                key={hostel.id} 
                style={styles.hostelCard}
                onClick={() => handleViewStudents(hostel.id)}
              >
                <h4 style={{ margin: '0 0 10px', color: '#212529' }}>{hostel.name}</h4>
                <p style={{ margin: '0 0 15px', color: '#6c757d', fontSize: '0.95em' }}>
                  {hostel.address}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <span style={{ fontSize: '0.9em', color: '#6c757d' }}>
                    {hostel.studentCount || 0} {hostel.studentCount === 1 ? 'student' : 'students'}
                  </span>
                  <span style={{ 
                    color: '#0d6efd', 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '0.9em',
                    fontWeight: '500'
                  }}>
                    View Students <ArrowRight size={16} style={{ marginLeft: '5px' }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;