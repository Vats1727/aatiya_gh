import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, PlusCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddHostelForm, setShowAddHostelForm] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return await response.json();
    } catch (err) {
      console.error('Error fetching user profile:', err);
      throw err;
    }
  };

  // Fetch hostels for the current user
  const fetchHostels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch hostels');
      const data = await response.json();
      setHostels(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load hostels');
      setLoading(false);
    }
  };

  // Handle new hostel input change
  const handleHostelInputChange = (e) => {
    const { name, value } = e.target;
    setNewHostel(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add new hostel
  const handleAddHostel = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHostel)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add hostel');
      }

      await fetchHostels();
      setNewHostel({ name: '', address: '' });
      setShowAddHostelForm(false);
    } catch (err) {
      setError(err.message || 'Failed to add hostel');
      console.error('Error adding hostel:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view students for a hostel
  const handleViewStudents = (hostelId) => {
    navigate(`/hostel/${hostelId}/students`);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchUserProfile();
        await fetchHostels();
      } catch (err) {
        navigate('/admin');
      }
    };

    loadData();
  }, [navigate]);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      boxSizing: 'border-box'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: 0
    },
    addButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: '#45a049'
      }
    },
    hostelForm: {
      backgroundColor: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1rem'
    },
    submitButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      ':disabled': {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed'
      }
    },
    cancelButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    error: {
      color: '#f44336',
      marginTop: '1rem',
      padding: '0.5rem',
      backgroundColor: '#ffebee',
      borderRadius: '4px'
    },
    hostelList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginTop: '1.5rem'
    },
    hostelCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    },
    hostelName: {
      fontSize: '1.2rem',
      fontWeight: '600',
      margin: '0 0 0.5rem 0',
      color: '#1a1a1a'
    },
    hostelAddress: {
      color: '#666',
      margin: '0 0 1rem 0',
      fontSize: '0.9rem'
    },
    viewButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      textDecoration: 'none',
      width: 'fit-content',
      ':hover': {
        backgroundColor: '#1976D2'
      }
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem 1rem',
      color: '#666',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginTop: '2rem'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px'
    },
    '@media (max-width: 768px)': {
      container: {
        padding: '1rem'
      },
      header: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '1rem'
      },
      title: {
        fontSize: '1.5rem'
      },
      hostelList: {
        gridTemplateColumns: '1fr'
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Hostel Management</h1>
        <button 
          onClick={() => setShowAddHostelForm(!showAddHostelForm)}
          style={styles.addButton}
        >
          <PlusCircle size={18} />
          {showAddHostelForm ? 'Cancel' : 'Add New Hostel'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showAddHostelForm && (
        <div style={styles.hostelForm}>
          <h3>Add New Hostel</h3>
          <form onSubmit={handleAddHostel}>
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>
                Hostel Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newHostel.name}
                onChange={handleHostelInputChange}
                required
                style={styles.input}
                placeholder="Enter hostel name"
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="address" style={styles.label}>
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={newHostel.address}
                onChange={handleHostelInputChange}
                required
                style={styles.input}
                placeholder="Enter hostel address"
              />
            </div>
            <div style={styles.buttonGroup}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={styles.submitButton}
              >
                {isSubmitting ? 'Adding...' : 'Add Hostel'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddHostelForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h2>Your Hostels</h2>
        {hostels.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No hostels found. Add your first hostel to get started.</p>
          </div>
        ) : (
          <div style={styles.hostelList}>
            {hostels.map(hostel => (
              <div key={hostel._id} style={styles.hostelCard}>
                <h3 style={styles.hostelName}>{hostel.name}</h3>
                <p style={styles.hostelAddress}>
                  {hostel.address || 'No address provided'}
                </p>
                <button 
                  onClick={() => handleViewStudents(hostel._id)}
                  style={styles.viewButton}
                >
                  <Users size={16} />
                  View Students
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
