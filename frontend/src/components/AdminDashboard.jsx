import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, ArrowRight, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', address: '' });
  const [isAddingHostel, setIsAddingHostel] = useState(false);
  const [hostelError, setHostelError] = useState('');
  const navigate = useNavigate();

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const userData = await response.json();
      setUser(userData || {});
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user data');
    }
  };

  // Fetch hostels for the current user
  const fetchHostels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch hostels');
      
      const data = await response.json();
      setHostels(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for new hostel form
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
    if (!newHostel.name.trim() || !newHostel.address.trim()) {
      setHostelError('Please fill in all fields');
      return;
    }

    try {
      setIsAddingHostel(true);
      setHostelError('');
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

      // Refresh hostels list
      await fetchHostels();
      setNewHostel({ name: '', address: '' });
      setShowAddHostel(false);
    } catch (err) {
      setHostelError(err.message);
    } finally {
      setIsAddingHostel(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchUserProfile();
      await fetchHostels();
    };
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin');
      return;
    }
    
    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
        padding: '1rem',
      }}>
        <div style={{
          background: '#fef2f2',
          color: '#b91c1c',
          padding: '1rem',
          borderRadius: '0.5rem',
          maxWidth: '600px',
          width: '100%',
        }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1.5rem 1rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* User Profile Section */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.25rem',
              }}>
                {user?.name || 'User'}
              </h2>
              <p style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '0.9375rem'
              }}>
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Hostel List Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <h1 style={{
            color: '#1f2937',
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: 0,
          }}>Hostel Management</h1>
          <button 
            onClick={() => setShowAddHostel(true)}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.9375rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} />
            Add Hostel
          </button>
        </div>

        {/* Hostel Grid */}
        <div style={{ marginTop: '1rem' }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280',
            }}>Loading hostels...</div>
          ) : hostels.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              border: '1px dashed #e5e7eb',
            }}>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
              }}>No hostels found. Add your first hostel to get started.</p>
              <button 
                onClick={() => setShowAddHostel(true)}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={16} />
                Add First Hostel
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}>
              {hostels.map((hostel) => (
                <div 
                  key={hostel.id} 
                  style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  onClick={() => navigate(`/hostel/${hostel.id}/students`)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}>
                    <Building size={24} style={{ color: '#8b5cf6' }} />
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: 0,
                    }}>{hostel.name}</h3>
                  </div>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.9375rem',
                    lineHeight: '1.5',
                    margin: '0 0 1rem 0',
                  }}>{hostel.address || 'No address provided'}</p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '1rem',
                  }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#6366f1',
                      fontWeight: '500',
                      fontSize: '0.9375rem',
                      textDecoration: 'none',
                    }}>
                      View Students <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Hostel Modal */}
      {showAddHostel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
              }}>Add New Hostel</h3>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => {
                  setShowAddHostel(false);
                  setHostelError('');
                  setNewHostel({ name: '', address: '' });
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {hostelError && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                margin: '0 1.5rem 1.25rem',
                fontSize: '0.875rem',
                border: '1px solid #fecaca',
              }}>
                {hostelError}
              </div>
            )}
            
            <form onSubmit={handleAddHostel}>
              <div style={{
                marginBottom: '1.25rem',
                padding: '0 1.5rem',
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                }} htmlFor="name">Hostel Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newHostel.name}
                  onChange={handleHostelInputChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem',
                    color: '#111827',
                  }}
                  placeholder="Enter hostel name"
                  required
                />
              </div>
              
              <div style={{
                marginBottom: '1.25rem',
                padding: '0 1.5rem',
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                }} htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={newHostel.address}
                  onChange={handleHostelInputChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem',
                    color: '#111827',
                    resize: 'vertical',
                    minHeight: '100px',
                  }}
                  placeholder="Enter hostel address"
                  required
                />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
              }}>
                <button
                  type="button"
                  style={{
                    background: 'white',
                    color: '#4b5563',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.9375rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setShowAddHostel(false);
                    setHostelError('');
                    setNewHostel({ name: '', address: '' });
                  }}
                  disabled={isAddingHostel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.9375rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: isAddingHostel ? 0.7 : 1,
                    cursor: isAddingHostel ? 'not-allowed' : 'pointer',
                  }}
                  disabled={isAddingHostel}
                >
                  {isAddingHostel ? 'Adding...' : 'Add Hostel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
