import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, ArrowRight, Home, UserPlus, LogOut, Edit, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import HindiKeyboard from './HindiKeyboard';
import { itransToDevanagari } from '../libs/itransToDevanagari';

// Dynamic loader for Sanscript transliteration library (loads from CDN at runtime)
const loadSanscript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.Sanscript) return resolve(window.Sanscript);
    const existing = document.querySelector('script[data-sanscript]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Sanscript));
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/sanscript@1.0.0/dist/sanscript.min.js';
    s.async = true;
    s.setAttribute('data-sanscript', '1');
    s.onload = () => resolve(window.Sanscript);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
};
// Helper that tries multiple ways to obtain Sanscript and transliterate text.
const transliterateText = async (text) => {
  if (!text) return '';
  try {
    // First try local lightweight ITRANS transliterator (fast, offline)
    try {
      const local = itransToDevanagari(String(text));
      if (local) return local;
    } catch (e) {
      // ignore and fall back to CDN/proxy
    }
    // Try window (CDN) next
    if (typeof window !== 'undefined' && window.Sanscript && window.Sanscript.t) {
      return window.Sanscript.t(String(text), 'itrans', 'devanagari');
    }
    // Then try the CDN loader
    const SanscriptCdn = await loadSanscript();
    if (SanscriptCdn && SanscriptCdn.t) return SanscriptCdn.t(String(text), 'itrans', 'devanagari');

    // As a last resort, try the (unofficial) Google Input Tools transliteration endpoint via
    // the backend proxy to avoid CORS issues.
    try {
      const proxyUrl = `${API_BASE.replace(/\/$/, '')}/api/transliterate`;
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: String(text) })
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.success && payload.text) return payload.text;
      }
    } catch (e) {
      // ignore network errors and fall through to returning original text
    }
  } catch (err) {
    // ignore and return original text
    // console.debug('transliterateText error', err);
  }
  return text;
};
import '../Styles/styles.css';
import '../Styles/AdminDashboard.css';

// Use production URL if environment variable is not set
const API_BASE = import.meta.env.VITE_API_BASE || 'https://aatiya-gh-backend.onrender.com';

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', address: '', name_hi: '', address_hi: '', monthlyFee: 0, monthlyFeeCurrency: 'INR' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const HOSTELS_PER_PAGE = 8;
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);
  const translitTimers = useRef({ name: null, address: null, name_hi: null, address_hi: null });
  const [showHindiKeyboard, setShowHindiKeyboard] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState(null); // 'name_hi' or 'address_hi'

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const [qrHostel, setQrHostel] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const navigate = useNavigate();

  // Helper to get Authorization header value. Accepts tokens stored as
  // either raw JWT or prefixed with "Bearer ".
  const getAuthHeader = () => {
    const raw = localStorage.getItem('token');
    if (!raw) return null;
    return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
  };

  // Helper to get raw JWT without Bearer prefix (for basic validation)
  const getRawToken = () => {
    const raw = localStorage.getItem('token');
    if (!raw) return null;
    return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  };

    // Decode a JWT payload (no validation) to extract common fields as a
    // quick fallback when the /me endpoint doesn't return a name.
    const decodeJwtPayload = (token) => {
      try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(payload);
        return JSON.parse(decoded);
      } catch (e) {
        return null;
      }
    };

// Fetch user profile function. Try multiple backend endpoints and response shapes
// to be tolerant of environments that return { data: user } or { user }.
const fetchUserProfile = async () => {
  try {
    const authHeader = getAuthHeader();
    const rawToken = getRawToken();
    if (!authHeader || !rawToken) {
      navigate('/admin');
      return;
    }

    const endpoints = [`${API_BASE}/api/auth/me`, `${API_BASE}/api/users/me`, `${API_BASE}/api/me`];
    let lastErr = null;
    let userObj = null;

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          // If unauthorized, bail out immediately
          if (res.status === 401) {
            localStorage.removeItem('token');
            navigate('/admin');
            return;
          }
          lastErr = new Error(`Failed to fetch user profile from ${ep} (status ${res.status})`);
          continue;
        }

        const payload = await res.json();
        // Normalize various possible shapes
        userObj = payload?.data || payload?.user || payload || null;
        break;
      } catch (innerErr) {
        lastErr = innerErr;
        continue;
      }
    }

    if (!userObj) {
      // Try to fallback to any cached user in localStorage
      const cached = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
      })();
      if (cached) {
        setUser(cached);
        return;
      }

      // As a last resort, decode token payload for name/email
      const raw = getRawToken();
      const payload = decodeJwtPayload(raw);
      if (payload) {
        const fallback = { name: payload.name || payload.displayName || payload.email || payload.sub };
        setUser(fallback);
        try { localStorage.setItem('user', JSON.stringify(fallback)); } catch (e) { /* ignore */ }
        return;
      }

      console.error('fetchUserProfile: no user returned', lastErr);
      setError('Failed to load user profile');
      return;
    }

    // If the profile is nested under a `profile` or similar key, try to extract
    const resolved = userObj.profile || userObj;
    // Normalize name/email fields and cache
    const normalized = {
      ...resolved,
      name: resolved.name || resolved.displayName || resolved.fullName || resolved.email?.split?.('@')?.[0] || resolved.uid || resolved.id,
    };
    setUser(normalized);
    try { localStorage.setItem('user', JSON.stringify(normalized)); } catch (e) { /* ignore */ }
  } catch (err) {
    console.error('Error fetching user profile:', err);
    if (err.message && (err.message.includes('401') || err.message.includes('unauthorized'))) {
      localStorage.removeItem('token');
      navigate('/admin');
    }
    setError('Failed to load user profile');
  }
};

// Fetch hostels function
const fetchHostels = async () => {
  try {
    setLoading(true);
      const authHeader = getAuthHeader();
      const rawToken = getRawToken();
      if (!authHeader || !rawToken) {
        navigate('/admin');
        return;
      }

      const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
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
    setError('Failed to load hostels');
    if (err.message.includes('401')) {
      localStorage.removeItem('token');
      navigate('/admin');
    }
  } finally {
    setLoading(false);
  }
};

// NOTE: initial auth+data fetching consolidated in the checkAuthAndFetchData effect below

  // Fetch students for a specific hostel
  const fetchStudents = async (hostelId) => {
    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      if (!authHeader) {
        localStorage.removeItem('token');
        navigate('/admin');
        return;
      }

      const response = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/admin');
          return;
        }
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle hostel selection
  const handleHostelSelect = (hostel) => {
    setSelectedHostel(hostel);
    fetchStudents(hostel.id);
  };

  // Handle view students for a hostel
  const handleViewStudents = (hostelId) => {
    navigate(`/hostel/${hostelId}/students`);
  };

  // Generate QR code for adding student to a specific hostel (local generation)
  const generateQrForHostel = async (hostel) => {
    if (!hostel || !hostel.id) return;
    try {
      const publicBase = window.location.origin || 'https://aatiya-gh.vercel.app';
  // Include owner user id in the QR URL as a query param so public submissions can be attributed correctly
  const ownerId = user?.uid || user?.id || (user && user.userId) || null;
  const ownerQuery = ownerId ? `?ownerUserId=${encodeURIComponent(ownerId)}` : '';
  const addUrl = `${publicBase}/hostel/${encodeURIComponent(hostel.id)}/add-student${ownerQuery}`;

      // Generate a data URL (PNG) for the QR locally using the `qrcode` lib
      const dataUrl = await QRCode.toDataURL(addUrl, { width: 360, margin: 1 });

      // Upload dataUrl to backend to persist and get hosted URL
      const authHeader = getAuthHeader();
      let hostedUrl = dataUrl;
      if (authHeader) {
        try {
          const resp = await fetch(`${API_BASE}/api/users/me/hostels/${hostel.id}/qr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
            body: JSON.stringify({ dataUrl })
          });
          if (resp.ok) {
            const payload = await resp.json();
            hostedUrl = payload?.data?.qrDataUrl || payload?.data?.qrUrl || dataUrl;
            // reflect stored URL on local state list for immediacy
            setHostels(prev => prev.map(h => h.id === hostel.id ? { ...h, qrUrl: hostedUrl } : h));
          } else {
            console.warn('Failed to upload QR to backend, using local dataUrl');
          }
        } catch (err) {
          console.warn('Error uploading QR to backend', err);
        }
      }

      setQrHostel(hostel);
      setQrImageUrl(hostedUrl);
    } catch (err) {
      console.error('Failed to generate QR code', err);
      setError('Failed to generate QR code');
    }
  };

  const closeQrModal = () => {
    setQrHostel(null);
    setQrImageUrl('');
  };

  // Handle add new hostel
  // Handle add or edit hostel. If newHostel.id exists we perform PUT, else POST
  const handleAddHostel = async (e) => {
    e.preventDefault();
    // require at least English name and English address for compatibility
    if (!newHostel.name || !newHostel.address) {
      setError('Please fill in all required fields (English name and address)');
      return;
    }

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        setError('Authentication required');
        navigate('/admin');
        return;
      }

      const payloadBody = {
        name: newHostel.name,
        address: newHostel.address,
        // include bilingual fields; backend may store or ignore them
        name_hi: newHostel.name_hi || '',
        address_hi: newHostel.address_hi || '',
        // monthly fee (per person) and currency
        monthlyFee: (newHostel.monthlyFee != null ? Number(newHostel.monthlyFee) : 0),
        monthlyFeeCurrency: newHostel.monthlyFeeCurrency || 'INR'
      };

      if (newHostel.id) {
        // Edit existing hostel
        const response = await fetch(`${API_BASE}/api/users/me/hostels/${newHostel.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(payloadBody)
        });
        if (!response.ok) throw new Error('Failed to update hostel');
        const payload = await response.json();
        const updated = payload?.data || payload;
        setHostels(prev => prev.map(h => h.id === updated.id || h.id === newHostel.id ? { ...h, ...updated } : h));
      } else {
        // Create new hostel
        const response = await fetch(`${API_BASE}/api/users/me/hostels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(payloadBody)
        });
        if (!response.ok) throw new Error('Failed to create hostel');
        const data = await response.json();
        const created = data?.hostel || data?.data || data;
        setHostels(prev => [...prev, created]);
      }

  setNewHostel({ name: '', address: '', name_hi: '', address_hi: '', monthlyFee: 0, monthlyFeeCurrency: 'INR' });
      setShowAddHostel(false);
      setError('');
      setCurrentPage(1);
    } catch (err) {
      console.error('Hostel save failed', err);
      setError('Failed to save hostel. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin');
  };

  // Fetch data on component mount
  // Removed redundant fetchHostels call to avoid double-loading and UI flicker.

  // Check authentication and fetch data on component mount
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const rawToken = getRawToken();
        const authHeader = getAuthHeader();
        if (!rawToken || !authHeader) {
          throw new Error('No token found');
        }

        // Basic token format validation (JWT should have 3 parts)
        const tokenParts = rawToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }

        try {
          // First verify the token by fetching the user profile
          await fetchUserProfile();
          // Then fetch the hostels data
          await fetchHostels();
        } catch (err) {
          if (err.response?.status === 401 || 
              err.message.includes('401') || 
              err.message.includes('unauthorized')) {
            throw new Error('Session expired. Please login again.');
          }
          throw err;
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        setError(err.message || 'Authentication failed');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  // Helpers for search + pagination UI
  const filteredHostels = hostels.filter(h => (h.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim()));
  const totalPages = Math.max(1, Math.ceil(filteredHostels.length / HOSTELS_PER_PAGE));
  const paginatedHostels = filteredHostels.slice((currentPage - 1) * HOSTELS_PER_PAGE, (currentPage - 1) * HOSTELS_PER_PAGE + HOSTELS_PER_PAGE);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '0.75rem',
      boxSizing: 'border-box',
      width: '100%',
      overflowX: 'hidden',
      position: 'relative',
      '@media (min-width: 481px)': {
        padding: '1rem',
      },
      '@media (min-width: 769px)': {
        padding: '1.25rem',
      },
      '@media (min-width: 1024px)': {
        padding: '1.5rem',
      },
    },
    content: {
      maxWidth: '100%',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      padding: '0 0.25rem',
      '@media (min-width: 375px)': {
        padding: '0 0.5rem',
      },
      '@media (min-width: 481px)': {
        maxWidth: '100%',
        padding: '0 1rem',
      },
      '@media (min-width: 769px)': {
        maxWidth: '1200px',
        padding: '0 0.5rem',
      },
      '@media (min-width: 1025px)': {
        padding: '0',
      },
    },
    header: {
      background: 'white',
      padding: '0.875rem 1rem',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      position: 'relative',
      zIndex: 10,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      '@media (min-width: 481px)': {
        padding: '1rem',
        borderRadius: '0.875rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.08)',
        marginBottom: '1.25rem',
      },
      '@media (min-width: 769px)': {
        padding: '0.75rem 1.25rem',
        borderRadius: '1rem',
        marginBottom: '1.5rem',
      },
    },
    title: {
      color: '#db2777',
      fontSize: '1.125rem',
      fontWeight: '700',
      margin: 0,
      lineHeight: '1.3',
      textAlign: 'left',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flexShrink: 1,
      minWidth: '100px',
      '@media (min-width: 375px)': {
        fontSize: '1.25rem',
      },
      '@media (min-width: 481px)': {
        fontSize: '1.375rem',
      },
      '@media (min-width: 769px)': {
        fontSize: '1.5rem',
        marginRight: '1rem',
      },
    },
    headerActions: {
      display: 'flex',
      flexDirection: 'row',
      gap: '0.5rem',
      flexShrink: 0,
      alignItems: 'center',
      '& > *': {
        whiteSpace: 'nowrap',
      },
      '@media (min-width: 640px)': {
        gap: '0.75rem',
      },
    },
    searchContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      marginBottom: '1rem',
      width: '100%',
      position: 'relative',
      '@media (min-width: 481px)': {
        flexDirection: 'row',
        gap: '0.5rem',
        marginBottom: '1.25rem',
      },
      '@media (min-width: 640px)': {
        gap: '0.75rem',
        marginBottom: '1.5rem',
      },
    },
    searchInput: {
      width: '100%',
      padding: '0.5rem 0.875rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      boxSizing: 'border-box',
      minHeight: '42px',
      WebkitAppearance: 'none',
      '&:focus': {
        outline: 'none',
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)',
      },
      '&::placeholder': {
        color: '#9ca3af',
        opacity: 1,
      },
      '@media (min-width: 375px)': {
        padding: '0.5rem 1rem',
      },
      '@media (min-width: 481px)': {
        minWidth: '200px',
        flex: 1,
      },
    },
    card: {
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginBottom: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      '@media (min-width: 481px)': {
        padding: '1.125rem',
        marginBottom: '1.25rem',
      },
      '@media (min-width: 769px)': {
        padding: '1.25rem',
        marginBottom: '1.5rem',
      },
      '@media (min-width: 1024px)': {
        padding: '1.5rem',
      },
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginTop: '1rem',
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      '&:focus': {
        outline: 'none',
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)',
      },
    },
    submitButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      border: 'none',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '1rem',
      marginTop: '0.5rem',
      '&:hover': {
        opacity: 0.95,
      },
    },
    cancelButton: {
      background: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '1rem',
      marginTop: '0.5rem',
      '&:hover': {
        opacity: 0.95,
      },
    },
    hostelGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '0.875rem',
      marginTop: '0.75rem',
      '@media (min-width: 420px)': {
        gap: '1rem',
        marginTop: '1rem',
      },
      '@media (min-width: 481px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginTop: '1.25rem',
      },
      '@media (min-width: 640px)': {
        gap: '1.25rem',
      },
      '@media (min-width: 1024px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem',
      },
    },
    hostelCard: {
      background: '#ffffff',
      padding: '1rem',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
      '@media (min-width: 481px)': {
        padding: '1.125rem',
      },
      '@media (min-width: 769px)': {
        padding: '1.25rem',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
        opacity: 0.9,
      },
    },
    viewButton: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginTop: '1rem',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      '&:hover': {
        opacity: 0.9,
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
      // allow table to shrink on smaller viewports; mobile will use card/grid layout
      minWidth: 'auto',
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

  const applyResponsiveStyles = (styleObj) => {
    const appliedStyles = { ...styleObj };

    // Handle media query styles
    if (window.innerWidth <= 1024 && styleObj['@media (max-width: 1024px)']) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 1024px)']);
    }
    if (window.innerWidth <= 768 && styleObj['@media (max-width: 768px)']) {
      Object.assign(appliedStyles, styleObj['@media (max-width: 768px)']);
    }
    if (window.innerWidth <= 480 && styleObj['@media (max-width: 480px)']) {
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

  return (
    <div className="admin-container">
      <div className="admin-content">
        {/* User Profile Section */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div
            className="profile-navbar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                width: '100%',
                justifyContent: 'flex-start',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                {(() => {
                  const display = user?.name || user?.displayName || user?.fullName || (user?.email && user.email.split('@')[0]) || 'U';
                  return String(display).charAt(0).toUpperCase();
                })()}
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {user?.name || user?.displayName || user?.fullName || (user?.email && user.email.split('@')[0]) || 'User'}
                </h2>
                <p style={{
                  margin: '0.25rem 0 0',
                  color: '#6b7280',
                  fontSize: '0.9375rem'
                }}>
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'nowrap',
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: '100%',
              }}
            >
              <button onClick={() => navigate('/admin/dashboard')} className="btn btn-primary admin-submitButton" style={{ minWidth: '120px', background: '#06b6d4' }} title="Hostel List">
                <Users size={16} style={{ marginRight: '6px' }} /> Hostel List
              </button>
              <button onClick={handleLogout} className="btn btn-secondary admin-cancelButton" style={{ minWidth: '100px' }} title="Logout">
                <LogOut size={16} style={{ marginRight: '6px' }} /> Logout
              </button>
            </div>
          </div>
          <style>{`
            @media (min-width: 481px) {
              .profile-navbar {
                flex-direction: row !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 1rem !important;
              }
              .profile-navbar > div:last-child {
                justify-content: flex-end !important;
                width: auto !important;
              }
            }
          `}</style>
        </div>

        {/* Inline Add Hostel form shown on this page */}
        {showAddHostel && (
          <div className="admin-card">
            <h3 style={{ margin: 0, marginBottom: '0.75rem', color: '#6b21a8' }}>{newHostel.id ? 'Edit Hostel' : 'Add New Hostel'}</h3>
            <form onSubmit={handleAddHostel} className="admin-form">
              <input
                name="name"
                className="admin-input"
                value={newHostel.name}
                  onChange={(e) => {
                  const val = e.target.value || '';
                  setNewHostel(prev => ({ ...prev, name: val }));
                  // debounce transliteration using transliterateText helper
                  if (translitTimers.current.name) clearTimeout(translitTimers.current.name);
                  translitTimers.current.name = setTimeout(() => {
                    transliterateText(val).then((hi) => {
                      if (hi) setNewHostel(prev => ({ ...prev, name_hi: hi }));
                    }).catch(() => {/* ignore */});
                  }, 300);
                }}
                placeholder="Hostel name (English)"
                required
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  name="name_hi"
                  className="admin-input admin-input--hindi"
                  value={newHostel.name_hi}
                  onChange={(e) => {
                    const val = e.target.value || '';
                    // Always set the immediate raw value so typing is visible.
                    setNewHostel(prev => ({ ...prev, name_hi: val }));

                    // Debounce transliteration only if the input contains Latin letters.
                    if (translitTimers.current.name_hi) clearTimeout(translitTimers.current.name_hi);
                    if (/[A-Za-z]/.test(val)) {
                      translitTimers.current.name_hi = setTimeout(() => {
                        transliterateText(val).then((hi) => {
                          if (hi && hi !== val) setNewHostel(prev => ({ ...prev, name_hi: hi }));
                        }).catch(() => {/* ignore */});
                      }, 300);
                    }
                  }}
                  placeholder="Hostel name (Hindi)"
                />
                <button type="button" onClick={() => { setKeyboardTarget('name_hi'); setShowHindiKeyboard(true); }} style={{ padding: '0.5rem 0.75rem', borderRadius: 6 }}>हिंदी</button>
              </div>
              <input
                name="address"
                className="admin-input"
                value={newHostel.address}
                onChange={(e) => {
                  const val = e.target.value || '';
                  setNewHostel(prev => ({ ...prev, address: val }));
                  if (translitTimers.current.address) clearTimeout(translitTimers.current.address);
                  translitTimers.current.address = setTimeout(() => {
                    transliterateText(val).then((hi) => {
                      if (hi) setNewHostel(prev => ({ ...prev, address_hi: hi }));
                    }).catch(() => {/* ignore */});
                  }, 300);
                }}
                placeholder="Address (English)"
                required
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  name="address_hi"
                  className="admin-input admin-input--hindi"
                  value={newHostel.address_hi}
                  onChange={(e) => {
                    const val = e.target.value || '';
                    // Immediately show typed value
                    setNewHostel(prev => ({ ...prev, address_hi: val }));

                    if (translitTimers.current.address_hi) clearTimeout(translitTimers.current.address_hi);
                    if (/[A-Za-z]/.test(val)) {
                      translitTimers.current.address_hi = setTimeout(() => {
                        transliterateText(val).then((hi) => {
                          if (hi && hi !== val) setNewHostel(prev => ({ ...prev, address_hi: hi }));
                        }).catch(() => {/* ignore */});
                      }, 300);
                    }
                  }}
                  placeholder="Address (Hindi)"
                />
                <button type="button" onClick={() => { setKeyboardTarget('address_hi'); setShowHindiKeyboard(true); }} style={{ padding: '0.5rem 0.75rem', borderRadius: 6 }}>हिंदी</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <input
                  name="monthlyFee"
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newHostel.monthlyFee}
                  onChange={(e) => setNewHostel(prev => ({ ...prev, monthlyFee: e.target.value }))}
                  placeholder="Monthly fee per student"
                  style={{ maxWidth: 220 }}
                />
                <select value={newHostel.monthlyFeeCurrency} onChange={(e) => setNewHostel(prev => ({ ...prev, monthlyFeeCurrency: e.target.value }))} style={{ padding: '0.75rem 1rem', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary admin-submitButton">{newHostel.id ? 'Save Hostel' : 'Add Hostel'}</button>
                <button
                  type="button"
                  className="btn btn-secondary admin-cancelButton"
                  onClick={() => { setShowAddHostel(false); setNewHostel({ name: '', address: '', name_hi: '', address_hi: '' }); setError(''); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <HindiKeyboard
          visible={showHindiKeyboard}
          onInsert={(char) => {
            if (!keyboardTarget) return;
            setNewHostel(prev => ({ ...prev, [keyboardTarget]: (prev[keyboardTarget] || '') + char }));
          }}
          onBackspace={() => {
            if (!keyboardTarget) return;
            setNewHostel(prev => ({ ...prev, [keyboardTarget]: (prev[keyboardTarget] || '').slice(0, -1) }));
          }}
          onSpace={() => {
            if (!keyboardTarget) return;
            setNewHostel(prev => ({ ...prev, [keyboardTarget]: (prev[keyboardTarget] || '') + ' ' }));
          }}
          onClear={() => {
            if (!keyboardTarget) return;
            setNewHostel(prev => ({ ...prev, [keyboardTarget]: '' }));
          }}
          onClose={() => { setShowHindiKeyboard(false); setKeyboardTarget(null); }}
        />

        <div className="admin-header">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%'}}>
            <h1 className="admin-title">Hostel Management</h1>
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
              <button
                onClick={() => { setNewHostel({ name: '', address: '', name_hi: '', address_hi: '' }); setShowAddHostel(true); }}
                className="btn btn-primary admin-submitButton"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', minWidth: '120px' }}
                type="button"
              >
                <Home size={18} className="mr-2" />
                New Hostel
              </button>
            </div>
          </div>
        </div>

        <div className="admin-tableContainer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem' }}>
            <input
              type="search"
              placeholder="Search hostels by name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="admin-searchInput"
              style={{ maxWidth: 420 }}
            />
            <div style={{ color: '#6b7280' }}>{filteredHostels.length} hostels</div>
          </div>

          {isMobile ? (
            <div className="admin-hostelGrid">
              {paginatedHostels.map((hostel) => (
                <div key={hostel.id} className="admin-hostelCard">
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>{hostel.name}</h4>
                  <div style={{ color: '#6b7280', marginTop: 6 }}>{hostel.address || ''}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                    <button onClick={() => handleViewStudents(hostel.id)} className="btn btn-primary" style={{ ...styles.viewButton, flex: 1 }}>
                      View Students
                    </button>
                    <button onClick={() => generateQrForHostel(hostel)} className="btn" style={{ padding: '0.5rem' }} title="QR"><UserPlus size={16} /></button>
                    <button onClick={() => { setNewHostel({ id: hostel.id, name: hostel.name || '', name_hi: hostel.name_hi || (hostel.name && hostel.name.hi) || '', address: hostel.address || '', address_hi: hostel.address_hi || (hostel.address && hostel.address.hi) || '' }); setShowAddHostel(true); }} className="btn" style={{ padding: '0.5rem' }} title="Edit"><Edit size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                  <tr>
                    <th style={styles.th}>Hostel Name</th>
                    <th style={styles.th}>Number of Students</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                  {paginatedHostels.map((hostel, idx) => (
                    <tr key={hostel.id}>
                      <td style={styles.td}>{hostel.name}</td>
                      <td style={styles.td}>{hostel.studentCount ?? hostel.studentsCount ?? 0}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleViewStudents(hostel.id)}
                          className="btn btn-icon btn-primary"
                          style={{ ...styles.actionButton, ...styles.editButton }}
                          title="View Students"
                        >
                          <ArrowRight size={16} />
                        </button>
                        <button
                          onClick={() => generateQrForHostel(hostel)}
                          className="btn btn-icon"
                          style={{ ...styles.actionButton }}
                          title="Generate QR for Add Student"
                        >
                          <UserPlus size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setNewHostel({ id: hostel.id, name: hostel.name || '', name_hi: hostel.name_hi || (hostel.name && hostel.name.hi) || '', address: hostel.address || '', address_hi: hostel.address_hi || (hostel.address && hostel.address.hi) || '' });
                            setShowAddHostel(true);
                          }}
                          className="btn btn-icon btn-secondary"
                          style={{ ...styles.actionButton }}
                          title="Edit Hostel"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm('Delete this hostel? This will remove the hostel and its students.')) return;
                            const token = getAuthHeader();
                            fetch(`${API_BASE}/api/users/me/hostels/${hostel.id}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': token }
                            }).then(res => {
                              if (!res.ok) throw new Error('Failed to delete hostel');
                              setHostels(prev => prev.filter(h => h.id !== hostel.id));
                            }).catch(err => { console.error(err); alert('Failed to delete hostel'); });
                          }}
                          className="btn btn-icon btn-danger"
                          style={{ ...styles.actionButton }}
                          title="Delete Hostel"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* Pagination controls */}
          {filteredHostels.length > HOSTELS_PER_PAGE && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', padding: '0.75rem' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 0.75rem' }}>Prev</button>
              <div style={{ padding: '0.25rem 0.75rem' }}>{currentPage} / {totalPages}</div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '0.5rem 0.75rem' }}>Next</button>
            </div>
          )}
        </div>

        {selectedHostel && (
          <div className="admin-tableContainer">
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Application No</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>District</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id}>
                    <td style={styles.td}>{student.studentName}</td>
                    <td style={styles.td}>{student.combinedId || '-'}</td>
                    <td style={styles.td}>{student.mobile1}</td>
                    <td style={styles.td}>{student.district}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* QR Modal */}
        {qrHostel && (
          <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}} onClick={closeQrModal}>
            <div onClick={(e) => e.stopPropagation()} style={{background: 'white', padding: '1rem', borderRadius: '0.75rem', maxWidth: '420px', width: '92%', textAlign: 'center'}}>
              <h3 style={{marginTop:0, marginBottom: '0.5rem'}}>QR for {qrHostel.name || 'Hostel'}</h3>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '0.5rem'}}>
                <img src={qrImageUrl} alt={`QR code for ${qrHostel.name}`} style={{width: '320px', height: '320px', maxWidth: '100%'}} />
              </div>
              <div style={{wordBreak: 'break-all', fontSize: '0.9rem', color: '#374151', marginBottom: '0.75rem'}}>
                <small>
                  {`${window.location.origin || 'https://aatiya-gh.vercel.app'}/hostel/${encodeURIComponent(qrHostel.id)}/add-student${user?.uid ? `?ownerUserId=${encodeURIComponent(user.uid)}` : ''}`}
                </small>
              </div>
              <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                <button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin || 'https://aatiya-gh.vercel.app'}/hostel/${encodeURIComponent(qrHostel.id)}/add-student`); }}>
                  Copy Link
                </button>
                <a className="btn btn-secondary" href={qrImageUrl} download={`hostel-${qrHostel.id}-qr.png`} style={{textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.75rem', borderRadius: '0.375rem'}}>
                  Download
                </a>
                <button className="btn" onClick={closeQrModal} style={{background: '#f3f4f6', padding: '0.5rem 0.75rem', borderRadius: '0.375rem'}}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;