import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Plus, ArrowRight, Home, UserPlus, LogOut, Edit, Trash2, Search } from 'lucide-react';
import QRCode from 'qrcode';
import HindiKeyboard from './HindiKeyboard';
import Spinner from './Spinner';
import { itransToDevanagari } from '../libs/itransToDevanagari';
import '../Styles/AdminDashboard.responsive.css';

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
import '../styles.css';

// Common styles for consistent UI
const commonStyles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  card: {
    background: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#334155',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
    },
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    ':hover': {
      backgroundColor: '#2563eb',
    },
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    ':focus': {
      outline: 'none',
      borderColor: '#93c5fd',
      boxShadow: '0 0 0 3px rgba(147, 197, 253, 0.5)',
    },
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#475569',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9375rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: '600',
    color: '#475569',
    fontSize: '0.8125rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  },
  actionButton: {
    padding: '0.375rem 0.5rem',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    lineHeight: '1',
  },
  successBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  warningBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  dangerBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  infoBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '32rem',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  modalBody: {
    padding: '1.5rem',
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  formGroup: {
    marginBottom: '1.25rem',
  },
  formLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#475569',
  },
  formInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    ':focus': {
      outline: 'none',
      borderColor: '#93c5fd',
      boxShadow: '0 0 0 3px rgba(147, 197, 253, 0.5)',
    },
  },
  formTextarea: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    minHeight: '6rem',
    resize: 'vertical',
    ':focus': {
      outline: 'none',
      borderColor: '#93c5fd',
      boxShadow: '0 0 0 3px rgba(147, 197, 253, 0.5)',
    },
  },
  formHelpText: {
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  formError: {
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: '#dc2626',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  formSection: {
    marginBottom: '2rem',
  },
  formSectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  formCol: {
    flex: 1,
    minWidth: 0,
  },
};

// Responsive styles for mobile devices
const mobileStyles = {
  '@media (max-width: 640px)': {
    container: {
      padding: '1rem',
    },
    card: {
      padding: '1rem',
    },
    heading: {
      fontSize: '1.25rem',
    },
    formRow: {
      flexDirection: 'column',
      gap: '0',
    },
    formCol: {
      width: '100%',
      marginBottom: '1rem',
      ':last-child': {
        marginBottom: 0,
      },
    },
  },
};

// Use production URL if environment variable is not set
const API_BASE = import.meta.env.VITE_API_BASE || 'https://aatiya-gh-backend.onrender.com';

const AdminDashboard = () => {
  const [hostels, setHostels] = useState([]);
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', address: '', name_hi: '', address_hi: '', monthlyFee: 0, monthlyFeeCurrency: 'INR' });
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const HOSTELS_PER_PAGE = 10;
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

// Validators for hostel name and address. Use Unicode-aware regex where supported,
// fall back to ASCII-only regex for older browsers.
const isValidHostelName = (s) => {
  if (!s) return false;
  const v = String(s).trim();
  try {
    return /^[\p{L}0-9&.\-\s'(),\/]+$/u.test(v);
  } catch (e) {
    return /^[A-Za-z0-9&.\-\s'(),\/]+$/.test(v);
  }
};

const isValidAddress = (s) => {
  if (!s) return false;
  const v = String(s).trim();
  try {
    return /^[\p{L}0-9#.,\-\/\s'()]+$/u.test(v);
  } catch (e) {
    return /^[A-Za-z0-9#.,\-\/\s'()]+$/.test(v);
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

    // Validate characters allowed in hostel name and address
    if (!isValidHostelName(newHostel.name)) {
      setError("Hostel name may contain only letters, numbers, spaces and these symbols: & . - , ( ) / '");
      return;
    }

    if (!isValidAddress(newHostel.address)) {
      setError("Address contains invalid characters. Allowed: letters, numbers, spaces and , . - / # ( ) '");
      return;
    }

    // Validate duplicate hostel name for this user (case-insensitive, trimmed).
    try {
      const normalized = String(newHostel.name || '').trim().toLowerCase();
      if (normalized) {
        const duplicate = (hostels || []).some(h => {
          try {
            const hName = String(h.name || '').trim().toLowerCase();
            // If editing, allow keeping the same name for the same hostel id
            if (newHostel.id) return hName === normalized && String(h.id) !== String(newHostel.id);
            return hName === normalized;
          } catch (e) { return false; }
        });
        if (duplicate) {
          setError('You already have a hostel with this name. Please choose a different name.');
          return;
        }
      }
    } catch (e) {
      // non-fatal validation error; continue and let backend handle any conflict
      console.warn('Hostel name uniqueness check failed', e);
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
        // notify other tabs/pages that hostels list changed
        try { localStorage.setItem('hostels_updated', String(Date.now())); } catch (e) { /* ignore */ }
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
        // notify other tabs/pages that hostels list changed
        try { localStorage.setItem('hostels_updated', String(Date.now())); } catch (e) { /* ignore */ }
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
  // Deduplicate hostels by ID to avoid showing same hostel twice
  const uniqueHostels = (() => {
    const seen = new Set();
    return hostels.filter(h => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });
  })();
  
  const filteredHostels = uniqueHostels.filter(h => (h.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim()));
  const totalPages = Math.max(1, Math.ceil(filteredHostels.length / HOSTELS_PER_PAGE));
  const paginatedHostels = filteredHostels.slice((currentPage - 1) * HOSTELS_PER_PAGE, (currentPage - 1) * HOSTELS_PER_PAGE + HOSTELS_PER_PAGE);

  // Global search across all students and hostels
  const performGlobalSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      // clear and abort any ongoing request
      setGlobalSearchResults(null);
      setIsSearching(false);
      if (globalSearchTimerRef.current) { clearTimeout(globalSearchTimerRef.current); globalSearchTimerRef.current = null; }
      try { if (globalSearchAbortRef.current) { globalSearchAbortRef.current.abort(); } } catch (e) {}
      return;
    }

    // Begin search: cancel previous inflight requests, create a fresh AbortController
    try {
      if (globalSearchAbortRef.current) {
        try { globalSearchAbortRef.current.abort(); } catch (e) {}
      }
      const controller = new AbortController();
      globalSearchAbortRef.current = controller;
      setIsSearching(true);

      const token = localStorage.getItem('token');
      if (!token) {
        setIsSearching(false);
        return;
      }

      const query = searchQuery.toLowerCase().trim();

      // Match hostels locally first
      const matchedHostels = uniqueHostels.filter(h => (h.name || '').toLowerCase().includes(query));

      // Parallelize student fetches for speed, respect AbortController
      const fetchPromises = uniqueHostels.map(hostel =>
        fetch(`${API_BASE}/api/users/me/hostels/${hostel.id}/students`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          signal: controller.signal
        })
        .then(res => res.ok ? res.json().catch(() => null) : null)
        .then(data => ({ hostel, data }))
        .catch(err => ({ hostel, err }))
      );

      const results = await Promise.all(fetchPromises);

      const matchedStudents = [];
      for (const r of results) {
        if (!r || !r.data) continue;
        const students = r.data.data || r.data || [];
        const hostelMatches = students.filter(s => {
          const nameMatch = (s.studentName || '').toLowerCase().includes(query);

          // Normalize a bunch of possible mobile fields
          const mobileRaw = String(s.mobile1 || s.mobile || s.mobileNumber || s.primaryMobile || '').trim();
          const mobileDigits = mobileRaw.replace(/\D/g, '');

          // Normalize application-like fields (applicationNumber, combinedId, studentId, applicationNo)
          const appRaw = String(s.applicationNumber || s.applicationNo || s.combinedId || s.studentId || '').trim();
          const appDigits = appRaw.replace(/\D/g, '');

          // If the query contains digits, match against normalized digit forms to handle formatting (slashes, spaces, dashes)
          const queryDigits = query.replace(/\D/g, '');
          const digitSearch = queryDigits.length > 0 && (
            (mobileDigits && mobileDigits.includes(queryDigits)) ||
            (appDigits && appDigits.includes(queryDigits))
          );

          // Also fall back to text matching for non-digit queries
          const textMatch = (String(mobileRaw) || '').toLowerCase().includes(query) || (String(appRaw) || '').toLowerCase().includes(query);

          return nameMatch || digitSearch || textMatch;
        });
        matchedStudents.push(...hostelMatches.map(s => ({ ...s, hostelId: r.hostel.id, hostelName: r.hostel.name })));
      }

      setGlobalSearchResults({ hostels: matchedHostels, students: matchedStudents, query });
    } catch (err) {
      if (err && err.name === 'AbortError') {
        // request was aborted - ignore
      } else {
        console.error('Global search error:', err);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle global search input
  const globalSearchTimerRef = useRef(null);
  const globalSearchAbortRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleGlobalSearch = (query) => {
    setGlobalSearchTerm(query);
    // Do not show the searching indicator immediately on every keystroke.
    // The spinner will be enabled when the debounced search actually runs
    // (see performGlobalSearch which sets isSearching(true) at start).
    // debounce network-heavy global search
    if (globalSearchTimerRef.current) clearTimeout(globalSearchTimerRef.current);
    globalSearchTimerRef.current = setTimeout(() => {
      performGlobalSearch(query);
      globalSearchTimerRef.current = null;
    }, 500);
  };

  // Inject responsive CSS media queries at document level
  React.useEffect(() => {
    const styleId = 'admin-dashboard-responsive';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media (min-width: 768px) {
          .admin-desktop-table { display: table !important; }
          .admin-mobile-cards { display: none !important; }
        }
        @media (max-width: 767px) {
          .admin-desktop-table { display: none !important; }
          .admin-mobile-cards { display: flex !important; }
        }
        @media (max-width: 640px) {
          .admin-header-actions { flex-direction: column !important; width: 100% !important; }
          .admin-action-buttons { flex-direction: column !important; width: 100% !important; }
        }
        @media (max-width: 480px) {
          .admin-action-button { width: 100% !important; }
          .admin-pagination { flex-direction: column !important; align-items: center !important; }
          .admin-search-container { flex-direction: column !important; }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const elem = document.getElementById(styleId);
      if (elem) elem.remove();
    };
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1.5rem',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100%',
      margin: 0,
      position: 'relative',
    },
    content: {
      maxWidth: '100%',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      padding: 'clamp(0rem, 2vw, 1rem)',
    },
    header: {
      background: 'white',
      padding: 'clamp(0.75rem, 4vw, 1.25rem)',
      borderRadius: 'clamp(0.5rem, 2vw, 1rem)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: 'clamp(0.75rem, 4vw, 1.5rem)',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'clamp(0.5rem, 2vw, 1rem)',
      position: 'relative',
      zIndex: 10,
    },
    title: {
      color: '#db2777',
      fontSize: 'clamp(1.125rem, 5vw, 1.5rem)',
      fontWeight: '700',
      margin: 0,
      lineHeight: '1.3',
      textAlign: 'left',
      flexShrink: 1,
      minWidth: '120px',
    },
    headerActions: {
      display: 'flex',
      flexDirection: 'row',
      gap: 'clamp(0.5rem, 2vw, 0.75rem)',
      flexShrink: 0,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    searchContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(0.5rem, 2vw, 0.75rem)',
      marginBottom: 'clamp(0.75rem, 4vw, 1.5rem)',
      width: '100%',
      position: 'relative',
    },
    searchInput: {
      width: '100%',
      padding: 'clamp(0.5rem, 3vw, 0.875rem)',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: 'clamp(0.875rem, 3vw, 0.9375rem)',
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
    },
    card: {
      background: 'white',
      borderRadius: 'clamp(0.5rem, 2vw, 1rem)',
      padding: 'clamp(0.75rem, 4vw, 1.5rem)',
      marginBottom: 'clamp(0.75rem, 4vw, 1.5rem)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(0.75rem, 3vw, 1rem)',
      marginTop: 'clamp(0.75rem, 3vw, 1rem)',
    },
    submitButton: {
      color: 'white',
      border: 'none',
      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      marginTop: '0.5rem',
      '&:hover': {
        opacity: 0.95,
      },
    },
    
    cancelButton: {
      background: '#6b7280',
      color: 'white',
      border: 'none',
      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      marginTop: '0.5rem',
      '&:hover': {
        opacity: 0.95,
      },
    },
    hostelGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 'clamp(0.75rem, 3vw, 1.5rem)',
      marginTop: 'clamp(0.75rem, 3vw, 1.5rem)',
      '@media (min-width: 481px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      '@media (min-width: 769px)': {
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
      '@media (min-width: 1024px)': {
        gridTemplateColumns: 'repeat(4, 1fr)',
      },
    },
    hostelCard: {
      background: '#ffffff',
      padding: 'clamp(0.75rem, 3vw, 1.25rem)',
      borderRadius: 'clamp(0.5rem, 2vw, 0.75rem)',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginTop: 'clamp(0.75rem, 3vw, 1rem)',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'clamp(0.25rem, 2vw, 0.5rem)',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      '&:hover': {
        opacity: 0.9,
      },
    },
    logoutButton: {
      background: '#4b5563',
      color: 'white',
      border: 'none',
      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: 'clamp(0.8rem, 2vw, 0.9375rem)',
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
      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: 'clamp(0.8rem, 2vw, 0.9375rem)',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'clamp(0.25rem, 2vw, 0.5rem)',
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
      borderRadius: 'clamp(0.5rem, 2vw, 1rem)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      background: 'white',
      marginBottom: 'clamp(1rem, 4vw, 2rem)',
    },
    table: {
      width: '100%',
      minWidth: 'auto',
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
    th: {
      background: '#f3e8ff',
      padding: 'clamp(0.5rem, 2vw, 0.875rem)',
      textAlign: 'left',
      color: '#6b21a8',
      fontWeight: '600',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: 'clamp(0.5rem, 2vw, 0.875rem)',
      borderTop: '1px solid #e5e7eb',
      verticalAlign: 'middle',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      lineHeight: '1.5',
    },
    actionCell: {
      whiteSpace: 'nowrap',
    },
    actionButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 'clamp(28px, 5vw, 32px)',
      height: 'clamp(28px, 5vw, 32px)',
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
    pagination: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 'clamp(0.75rem, 3vw, 1.5rem)',
      gap: 'clamp(0.25rem, 2vw, 0.5rem)',
      flexWrap: 'wrap',
      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
    },
    pageInfo: {
      margin: '0 clamp(0.5rem, 2vw, 1rem)',
      color: '#4b5563',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
    },
    pageButton: {
      padding: 'clamp(0.35rem, 2vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
      minWidth: 'clamp(2rem, 5vw, 2.5rem)',
      textAlign: 'center',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
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
    error: {
      background: '#fee2e2',
      color: '#b91c1c',
      padding: 'clamp(0.75rem, 3vw, 1rem)',
      borderRadius: '0.5rem',
      marginBottom: 'clamp(0.75rem, 3vw, 1.5rem)',
      borderLeft: '4px solid #dc2626',
      fontSize: 'clamp(0.8rem, 2vw, 0.9375rem)',
      lineHeight: '1.5',
    },
    emptyState: {
      textAlign: 'center',
      padding: 'clamp(1.5rem, 5vw, 3rem)',
      color: '#6b7280',
      fontSize: 'clamp(0.9rem, 2vw, 1rem)',
      lineHeight: '1.5',
    },
  };

  return (
    <div style={styles.container}>
      <div className="content" style={styles.content}>
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
                  {`Hi, ${user?.name || user?.displayName || user?.fullName || (user?.email && user.email.split('@')[0]) || 'User'}`}
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
              <button onClick={() => navigate('/admin/dashboard')} className="btn btn-primary" style={{...styles.addButton, minWidth: '120px', background: '#06b6d4'}} title="Hostel List">
                <Users size={16} style={{ marginRight: '6px' }} /> Hostel List
              </button>
              <button onClick={handleLogout} className="btn btn-secondary" style={{...styles.logoutButton, minWidth: '100px'}} title="Logout">
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

        <div style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%'}}>
            <h1 style={styles.title}>Hostel Management</h1>
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
              <button
                onClick={() => { setNewHostel({ name: '', address: '', name_hi: '', address_hi: '', monthlyFee: 0, monthlyFeeCurrency: 'INR' }); setShowAddHostel(true); }}
                className="btn btn-primary"
                style={{
                  ...styles.addButton,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  minWidth: '120px',
                }}
                type="button"
              >
                <Home size={18} className="mr-2" />
                New Hostel
              </button>
            </div>
          </div>
        </div>

        {/* Global Search Section */}
        <div style={{
          background: 'white',
          padding: 'clamp(0.75rem, 4vw, 1.25rem)',
          borderRadius: 'clamp(0.5rem, 2vw, 1rem)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          marginBottom: 'clamp(0.75rem, 4vw, 1.5rem)',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              {/* left icon: search or spinner */}
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8b5cf6', pointerEvents: 'none' }}>
                {isSearching ? (
                  <svg width="18" height="18" viewBox="0 0 50 50">
                    <path fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" d="M25 5a20 20 0 1 0 0 40a20 20 0 1 0 0-40">
                      <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                    </path>
                  </svg>
                ) : (
                  <Search size={18} />
                )}
              </div>

              <input
                type="search"
                placeholder="Search any student or hostel across all hostels... (name, mobile, application number)"
                value={globalSearchTerm}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                style={{
                  ...styles.searchInput,
                  width: '100%',
                  paddingRight: '140px',
                  paddingLeft: '44px'
                }}
              />
            </div>
 
            <div style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#f3f4f6',
              padding: '6px 10px',
              borderRadius: 8,
              color: '#374151',
              fontSize: '0.9rem',
              fontWeight: 600,
              pointerEvents: 'none'
            }}>
              {isSearching ? 'Searching...' : `${uniqueHostels.length} hostels`}
            </div>
          </div>
          
          {/* Global Search Results Dropdown */}
          {globalSearchResults && globalSearchTerm.trim() && (
            <div style={{
              marginTop: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              maxHeight: '400px',
              overflowY: 'auto',
              background: '#f9fafb',
            }}>
              {/* Hostel Results */}
              {globalSearchResults.hostels.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f3e8ff',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    fontWeight: '600',
                    color: '#6b21a8',
                  }}>
                    Hostels ({globalSearchResults.hostels.length})
                  </div>
                  {globalSearchResults.hostels.map((hostel) => (
                    <div
                      key={hostel.id}
                      onClick={() => { setSearchTerm(hostel.name); handleViewStudents(hostel.id); setGlobalSearchTerm(''); setGlobalSearchResults(null); }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        ':hover': { background: '#ede9fe' },
                        fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#ede9fe'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{hostel.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>{hostel.address}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Student Results */}
              {globalSearchResults.students.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#fce7f3',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    fontWeight: '600',
                    color: '#be185d',
                  }}>
                    Students ({globalSearchResults.students.length})
                  </div>
                  {globalSearchResults.students.map((student, idx) => (
                    <div
                      key={`${student.hostelId}-${student.id || idx}`}
                      onClick={() => { navigate(`/hostel/${student.hostelId}/students/${encodeURIComponent(student.id)}/profile`, { state: { student } }); setGlobalSearchTerm(''); setGlobalSearchResults(null); }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fce7f3'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{student.studentName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {student.hostelName} • {student.mobile1 && `+91 ${student.mobile1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {globalSearchResults.hostels.length === 0 && globalSearchResults.students.length === 0 && (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                }}>
                  No results found for "{globalSearchResults.query}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inline Add Hostel form shown on this page */}
        {showAddHostel && (
          <div className="card" style={styles.card}>
              <h3 style={{ margin: 0, marginBottom: '0.75rem', color: '#6b21a8' }}>{newHostel.id ? 'Edit Hostel' : 'Add New Hostel'}</h3>
              {error && (
                <div style={error.startsWith('Successfully') ? styles.successBadge : styles.formError}>
                  {error}
                </div>
              )}
            <form onSubmit={handleAddHostel} className="form" style={styles.form}>
              <input
                name="name"
                className="input"
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
                style={styles.input}
                pattern="[A-Za-z0-9&.\-\s'(),\/]+"
                title="Hostel name may contain letters, numbers, spaces and & . - , ( ) / and apostrophes."
                required
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  name="name_hi"
                  className="input"
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
                  style={{ ...styles.input, color: '#000' }}
                />
                <button type="button" onClick={() => { setKeyboardTarget('name_hi'); setShowHindiKeyboard(true); }} style={{ padding: '0.5rem 0.75rem', borderRadius: 6 }}>हिंदी</button>
              </div>
              <input
                name="address"
                className="input"
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
                style={styles.input}
                pattern="[A-Za-z0-9#.,\-\s'()\/]+"
                title="Address may contain letters, numbers, spaces and , . - / # ( ) and apostrophes."
                required
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  name="address_hi"
                  className="input"
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
                  style={{ ...styles.input, color: '#000' }}
                />
                <button type="button" onClick={() => { setKeyboardTarget('address_hi'); setShowHindiKeyboard(true); }} style={{ padding: '0.5rem 0.75rem', borderRadius: 6 }}>हिंदी</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <input
                  name="monthlyFee"
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newHostel.monthlyFee}
                  onChange={(e) => setNewHostel(prev => ({ ...prev, monthlyFee: e.target.value }))}
                  placeholder="Monthly fee per student"
                  style={{ ...styles.input, maxWidth: 220 }}
                />
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600 }}>
                  INR
                </div>
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{...styles.addButton, minWidth: 140}}>{newHostel.id ? 'Save Hostel' : 'Add Hostel'}</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowAddHostel(false); setNewHostel({ name: '', address: '', name_hi: '', address_hi: '', monthlyFee: 0, monthlyFeeCurrency: 'INR' }); setError(''); }}
                  style={styles.cancelButton}
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

        {/* Removed duplicate header + global-search block (kept the first instance above). */}

        <div className="table-container" style={styles.tableContainer}>
          {/* Table header with pagination on the top-right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem' }}>
            <div style={{ color: '#4b5563', fontSize: '0.95rem' }}>
              {/* left side intentionally left for potential filters/labels */}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#4b5563', fontSize: '0.95rem' }}>
                Showing {filteredHostels.length === 0 ? 0 : Math.min((currentPage - 1) * HOSTELS_PER_PAGE + 1, filteredHostels.length)}-{Math.min(currentPage * HOSTELS_PER_PAGE, filteredHostels.length)} of {filteredHostels.length} hostels
              </div>
              {filteredHostels.length > HOSTELS_PER_PAGE && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 0.75rem' }}>Prev</button>
                  <div style={{ padding: '0.25rem 0.75rem' }}>{currentPage} / {totalPages}</div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '0.5rem 0.75rem' }}>Next</button>
                </div>
              )}
            </div>
          </div>
          {/* hostels count moved into global search bar */}

          {loading && (!hostels || hostels.length === 0) ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </div>
          ) : isMobile ? (
            <div style={styles.hostelGrid}>
              {paginatedHostels.map((hostel) => (
                <div key={hostel.id} style={styles.hostelCard}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>{hostel.name}</h4>
                  <div style={{ color: '#6b7280', marginTop: 6 }}>{hostel.address || ''}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                    <button onClick={() => handleViewStudents(hostel.id)} className="btn btn-primary" style={{ ...styles.viewButton, flex: 1 }}>
                      View Students
                    </button>
                    <button onClick={() => generateQrForHostel(hostel)} className="btn" style={{ padding: '0.5rem' }} title="QR"><UserPlus size={16} /></button>
                    <button onClick={() => { setNewHostel({ id: hostel.id, name: hostel.name || '', name_hi: hostel.name_hi || (hostel.name && hostel.name.hi) || '', address: hostel.address || '', address_hi: hostel.address_hi || (hostel.address && hostel.address.hi) || '', monthlyFee: (hostel.monthlyFee != null ? hostel.monthlyFee : 0), monthlyFeeCurrency: hostel.monthlyFeeCurrency || 'INR' }); setShowAddHostel(true); }} className="btn" style={{ padding: '0.5rem' }} title="Edit"><Edit size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{
              ...styles.table,
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
                            setNewHostel({ id: hostel.id, name: hostel.name || '', name_hi: hostel.name_hi || (hostel.name && hostel.name.hi) || '', address: hostel.address || '', address_hi: hostel.address_hi || (hostel.address && hostel.address.hi) || '', monthlyFee: (hostel.monthlyFee != null ? hostel.monthlyFee : 0), monthlyFeeCurrency: hostel.monthlyFeeCurrency || 'INR' });
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

          
        </div>

        {selectedHostel && (
          <div className="table-container" style={styles.tableContainer}>
            <table style={{
              ...styles.table,
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