import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, Edit, Trash2, Check, X, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { renderStudentPrintHtml, renderRulesHtml } from '../utils/printTemplate';
import { downloadStudentPdf } from '../utils/pdfUtils';
import '../styles.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ITEMS_PER_PAGE = 10;

const StudentsPage = () => {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [previewStudent, setPreviewStudent] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFee, setPreviewFee] = useState('');
  const [previewCurrency, setPreviewCurrency] = useState('INR');
  const [students, setStudents] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('name_asc');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);
  const [translitNameHi, setTranslitNameHi] = useState('');
  const [translitAddressHi, setTranslitAddressHi] = useState('');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // fetchStudents is used initially and by storage-event updates
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
      const rawStudents = data.data || [];

      // Enrich each student with computed currentBalance derived from payment history
      const enrichBalances = async (list) => {
          const token = localStorage.getItem('token');
          // Try to get a hostel-level monthlyFee fallback from the first student
          const hostelMonthlyFallback = (list && list[0] && (list[0].monthlyFee != null ? Number(list[0].monthlyFee) : null)) || null;

          const promises = (list || []).map(async (s) => {
            try {
              // determine usedFee: appliedFee if present (>0), otherwise student's monthlyFee, otherwise hostel fallback
              const applied = (s.appliedFee != null && s.appliedFee !== '') ? Number(s.appliedFee) : 0;
              const studentMonthly = (s.monthlyFee != null && s.monthlyFee !== '') ? Number(s.monthlyFee) : (hostelMonthlyFallback != null ? Number(hostelMonthlyFallback) : 0);
              const usedFee = (applied > 0) ? applied : studentMonthly;

              // fetch payments for this student
              let paymentsArr = [];
              if (token) {
                try {
                  const resp = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${s.id}/payments`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                  });
                  if (resp.ok) {
                    const payload = await resp.json();
                    paymentsArr = payload?.data || [];
                  }
                } catch (e) {
                  // ignore per-student payments fetch errors
                }
              }

              const totalCredit = (paymentsArr || []).filter(p => (p.type || 'credit') === 'credit').reduce((a, b) => a + (Number(b.amount) || 0), 0);
              const totalDebit = (paymentsArr || []).filter(p => (p.type || 'credit') === 'debit').reduce((a, b) => a + (Number(b.amount) || 0), 0);

              // compute currentBalance same as in StudentPayments
              const currentBalance = usedFee - (totalCredit - totalDebit);

              return { ...s, currentBalance };
            } catch (err) {
              // fallback: keep student unchanged
              return s;
            }
          });

          const results = await Promise.all(promises);
          return results;
        };

      const studentsWithBalances = await enrichBalances(rawStudents);
      setStudents(studentsWithBalances);

      // Always fetch hostel details from Firestore (authenticated API) to ensure fresh data
      try {
        const hostelsRes = await fetch(`${API_BASE}/api/users/me/hostels`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (hostelsRes.ok) {
          const hostelsPayload = await hostelsRes.json();
          const hostels = hostelsPayload?.data || hostelsPayload || [];
          const found = hostels.find(h => String(h.id) === String(hostelId) || String(h._id) === String(hostelId) || String(h.hostelId) === String(hostelId));
          if (found) {
            setHostel({
              id: hostelId,
              name: found.name || found.hostelName || 'Hostel',
              name_hi: found.name_hi || found.nameHi || '',
              address: found.address || '',
              address_hi: found.address_hi || found.addressHi || '',
              monthlyFee: found.monthlyFee != null ? Number(found.monthlyFee) : (found.monthlyfee != null ? Number(found.monthlyfee) : 0),
              monthlyFeeCurrency: found.monthlyFeeCurrency || found.monthlyfeeCurrency || 'INR'
            });
          }
        }
      } catch (e) {
        // If fetch fails, fallback to setting defaults
        console.warn('Failed to fetch hostel details from API:', e);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelId]);

  // If a highlight query param is present (from global search), scroll to and highlight that row
  const location = useLocation();
  useEffect(() => {
    if (!students || students.length === 0) return;
    try {
      const params = new URLSearchParams(location.search);
      const h = params.get('highlight');
      if (!h) return;
      setHighlightId(h);
      // Scroll into view if element exists after render
      setTimeout(() => {
        const el = document.getElementById(`student-row-${h}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      // Remove highlight after 8 seconds
      const t = setTimeout(() => setHighlightId(null), 8000);
      return () => clearTimeout(t);
    } catch (err) {
      // ignore
    }
  }, [students, location.search]);

  // Listen for cross-tab storage events so other pages (Add Hostel / Add Student) can trigger refreshes
  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (!e.key) return;
        // hostels_updated -> refresh hostel metadata and students
        if (e.key === 'hostels_updated') {
          fetchStudents();
          return;
        }
        // students_updated_<hostelId>
        if (e.key.startsWith('students_updated_')) {
          const parts = e.key.split('_');
          const updatedHostelId = parts.slice(2).join('_');
          if (!updatedHostelId || String(updatedHostelId) === String(hostelId)) {
            fetchStudents();
          }
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hostelId]);

  // Helper to fetch public hostel metadata when viewing as an unauthenticated user or via QR links
  const fetchPublicHostel = async (hostelDocId, optOwnerUserId) => {
    try {
      const ownerUserId = optOwnerUserId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ownerUserId') : null) || null;
      const url = `${API_BASE}/api/public/hostels/${encodeURIComponent(hostelDocId)}${ownerUserId ? `?ownerUserId=${encodeURIComponent(ownerUserId)}` : ''}`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        // not fatal: return null so caller can fallback
        return null;
      }
      const payload = await res.json();
      const data = payload?.data || payload || null;
      return data;
    } catch (err) {
      console.warn('Failed to fetch public hostel metadata', err);
      return null;
    }
  };

  // Normalize and open preview modal: ensure hostel bilingual fields and monthlyFee are present on previewStudent
  const openPreview = async (student) => {
    try {
      // If student already has hostelName/monthlyFee present, use it
      let merged = { ...student };
      const hostelDoc = student.hostelDocId || student.ownerHostelDocId || hostel?.id || hostelId;
      // Try to get additional hostel metadata if missing
      if ((!merged.hostelName && !merged.hostelNameHi) || merged.appliedFee == null || merged.appliedFee === '') {
        // Attempt authenticated fetch first if token exists
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const resp = await fetch(`${API_BASE}/api/users/me/hostels`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
            if (resp.ok) {
              const p = await resp.json();
              const list = p?.data || p || [];
              const found = list.find(h => String(h.id) === String(hostelDoc) || String(h.docId) === String(hostelDoc));
              if (found) {
                merged = { ...found, ...merged, hostelName: found.name || found.hostelName || merged.hostelName, hostelNameHi: found.name_hi || merged.hostelNameHi || found.nameHi, hostelAddress: found.address || merged.hostelAddress, monthlyFee: (found.monthlyFee != null ? found.monthlyFee : merged.monthlyFee), monthlyFeeCurrency: found.monthlyFeeCurrency || merged.monthlyFeeCurrency || 'INR' };
              }
            }
          } catch (err) {
            // continue to public fetch fallback
          }
        }

        // If still missing or unauthenticated, try public endpoint
        if ((!merged.hostelName && !merged.hostelNameHi) || merged.monthlyFee == null || merged.monthlyFee === undefined) {
          const pub = await fetchPublicHostel(hostelDoc, student.ownerUserId || student.owner || student.ownerId || null);
          if (pub) {
            merged = { ...merged, hostelName: pub.name || merged.hostelName, hostelNameHi: pub.name_hi || merged.hostelNameHi, hostelAddress: pub.address || merged.hostelAddress, monthlyFee: (pub.monthlyFee != null ? pub.monthlyFee : merged.monthlyFee), monthlyFeeCurrency: pub.monthlyFeeCurrency || merged.monthlyFeeCurrency || 'INR' };
          }
        }
      }

      // Prefill preview fee: student's appliedFee if present, otherwise hostel.monthlyFee
      const feePrefill = (merged.appliedFee != null && merged.appliedFee !== '') ? merged.appliedFee : (merged.monthlyFee != null ? merged.monthlyFee : (hostel && hostel.monthlyFee != null ? hostel.monthlyFee : ''));
      const currencyPrefill = merged.appliedFeeCurrency || merged.monthlyFeeCurrency || (hostel && hostel.monthlyFeeCurrency) || 'INR';

      setPreviewStudent(merged);
      setPreviewFee(feePrefill);
      setPreviewCurrency(currencyPrefill);
      setPreviewVisible(true);
    } catch (err) {
      console.error('openPreview failed', err);
      // fallback to simple preview
      setPreviewStudent(student);
      setPreviewFee(student.appliedFee || (hostel && hostel.monthlyFee) || '');
      setPreviewCurrency(student.appliedFeeCurrency || (hostel && hostel.monthlyFeeCurrency) || 'INR');
      setPreviewVisible(true);
    }
  };

  // Dynamic loader for Sanscript (transliteration) to show Hindi fallback when hostel record doesn't have name_hi
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

  // When hostel name exists but there's no Hindi stored, generate a phonetic Hindi fallback for display
  useEffect(() => {
    if (!hostel || !hostel.name) return;
    if (hostel.name_hi) return; // already present
    let mounted = true;
    loadSanscript().then((Sanscript) => {
      try {
        if (!mounted) return;
        if (Sanscript && Sanscript.t) {
          const hi = Sanscript.t(String(hostel.name), 'itrans', 'devanagari');
          setTranslitNameHi(hi);
        }
      } catch (e) {
        // ignore
      }
    }).catch(() => { });
    return () => { mounted = false; };
  }, [hostel && hostel.name, hostel && hostel.name_hi]);



  const handleAddStudent = (e) => {
    e.preventDefault();
    window.open(`/hostel/${hostelId}/add-student`, '_blank');
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

  // Open preview modal before accepting so admin can review and adjust fee
  const handleAccept = async (student) => {
    // open enriched preview modal so admin can review/adjust fee
    await openPreview(student);
  };

  const confirmAccept = async () => {
    if (!previewStudent) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');
      const payload = { status: 'approved', appliedFee: Number(previewFee) || 0, appliedFeeCurrency: previewCurrency || 'INR' };
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${previewStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update student');
      }
      const updated = await res.json();
      
      // Update the student in the local state
      setStudents(prevStudents => 
        prevStudents.map(s => 
          s.id === previewStudent.id 
            ? { 
                ...s, 
                status: 'approved', 
                appliedFee: Number(payload.appliedFee),
                appliedFeeCurrency: payload.appliedFeeCurrency,
                updatedAt: new Date().toISOString()
              } 
            : s
        )
      );
      
      setPreviewVisible(false);
      setPreviewStudent(null);
      
      // Optional: Show a success message
      // alert('Student accepted successfully!');
    } catch (err) {
      console.error('Failed to accept with fee:', err);
      alert('Failed to accept student');
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
      // Ensure hostel bilingual fields and address are present on student before PDF generation
      let merged = { ...student };
      const hostelDoc = student.hostelDocId || student.ownerHostelDocId || hostel?.id || hostelId;
      // Attempt authenticated fetch of hostels to enrich data
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const resp = await fetch(`${API_BASE}/api/users/me/hostels`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
          if (resp.ok) {
            const p = await resp.json();
            const list = p?.data || p || [];
            const found = list.find(h => String(h.id) === String(hostelDoc) || String(h.docId) === String(hostelDoc));
            if (found) {
              merged = { ...found, ...merged, hostelName: found.name || merged.hostelName, hostelNameHi: found.name_hi || merged.hostelNameHi, hostelAddress: found.address || merged.hostelAddress, hostelAddressHi: found.address_hi || merged.hostelAddressHi };
            }
          }
        } catch (e) {
          // ignore and fall back to public
        }
      }

      // If still missing, try public endpoint
      if ((!merged.hostelName && !merged.hostelNameHi) || (!merged.hostelAddress && !merged.hostelAddressHi)) {
        try {
          const pub = await fetch(`${API_BASE}/api/public/hostels/${encodeURIComponent(hostelDoc)}${(student.ownerUserId || student.owner || student.ownerId) ? `?ownerUserId=${encodeURIComponent(student.ownerUserId || student.owner || student.ownerId)}` : ''}`);
          if (pub.ok) {
            const payload = await pub.json();
            const data = payload?.data || payload || null;
            if (data) {
              merged = { ...merged, hostelName: data.name || merged.hostelName, hostelNameHi: data.name_hi || merged.hostelNameHi, hostelAddress: data.address || merged.hostelAddress, hostelAddressHi: data.address_hi || merged.hostelAddressHi };
            }
          }
        } catch (e) {
          // ignore
        }
      }

      await downloadStudentPdf(merged);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download PDF');
    }
  };

  // Move hooks to the top level
  const filteredStudents = useMemo(() => {
    if (loading) return [];
    if (error) return [];

    const results = students.filter(student => {
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

    // Sorting
    const getCreated = (s) => {
      const cand = s.createdAt || s.createdOn || s.timestamp || s.submittedAt || s._createdAt || null;
      const t = cand ? (typeof cand === 'number' ? cand : Date.parse(cand)) : NaN;
      return Number.isFinite(t) ? t : 0;
    };

    if (sortOption === 'name_asc') {
      results.sort((a, b) => (a.studentName || '').toString().localeCompare((b.studentName || '').toString(), undefined, { sensitivity: 'base' }));
    } else if (sortOption === 'name_desc') {
      results.sort((a, b) => (b.studentName || '').toString().localeCompare((a.studentName || '').toString(), undefined, { sensitivity: 'base' }));
    } else if (sortOption === 'newest') {
      results.sort((a, b) => getCreated(b) - getCreated(a));
    } else if (sortOption === 'oldest') {
      results.sort((a, b) => getCreated(a) - getCreated(b));
    } else if (sortOption === 'acc_asc' || sortOption === 'acc_desc') {
      const getAcct = (s) => {
        // Prefer numeric applicationNumber
        if (s.applicationNumber != null && s.applicationNumber !== '') {
          const n = Number(String(s.applicationNumber).replace(/[^0-9]/g, ''));
          if (!Number.isNaN(n)) return n;
        }
        // Fallback to combinedId (remove slashes)
        if (s.combinedId) {
          const n = Number(String(s.combinedId).replace(/\//g, '').replace(/[^0-9]/g, ''));
          if (!Number.isNaN(n)) return n;
        }
        // Fallback to studentId
        if (s.studentId) {
          const n = Number(String(s.studentId).replace(/[^0-9]/g, ''));
          if (!Number.isNaN(n)) return n;
        }
        return 0;
      };

      results.sort((a, b) => {
        const aa = getAcct(a);
        const bb = getAcct(b);
        return sortOption === 'acc_asc' ? aa - bb : bb - aa;
      });
    }

    return results;
  }, [students, searchTerm, statusFilter, loading, error, sortOption]);

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
        {/* Back navigation moved to the profile navbar (sticky) */}
      </div>
    );
  }


  return (
    <div className="container" style={styles.container}>
      {/* Static profile navbar (sticky) - show current admin info if available */}
      {(() => {
        let stored = null;
        try { stored = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { stored = null; }
        const display = stored?.name || stored?.displayName || (stored?.email && stored.email.split('@')[0]) || null;
        if (!display) return null;
        return (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 8, zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {String(display).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{display}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{stored?.email || ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => navigate('/admin/dashboard')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#06b6d4', color: 'white', cursor: 'pointer' }}>Hostel list</button>
                <button onClick={() => { localStorage.removeItem('token'); navigate('/admin'); }} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>Logout</button>
              </div>
            </div>
          </div>
        );
      })()}
      <div className="header" style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(() => {
              const rawHi = (hostel && (hostel.name_hi || translitNameHi)) || '';
              const rawEn = hostel?.name || '';
              const hi = String(rawHi || '').trim();
              const en = String(rawEn || '').trim();
              const hasDevanagari = /[\u0900-\u097F]/.test(hi);
              const different = hi && en && (hi !== en);

              if (hasDevanagari && en) {
                return (
                  <>
                    <div style={{ fontSize: '0.9rem', color: '#6b21a8' }}>{en} - Student list</div>
                    {(hostel && (hostel.monthlyFee != null && hostel.monthlyFee !== '')) && (
                      <div style={{ fontSize: '0.9rem', color: '#374151', marginTop: 6 }}>
                        Monthly fee: {hostel.monthlyFeeCurrency === 'INR' ? `₹${hostel.monthlyFee}` : `${hostel.monthlyFee} ${hostel.monthlyFeeCurrency}`} per student
                      </div>
                    )}
                  </>
                );
              }

              if (different) {
                return (
                  <>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#6b21a8' }}>{en}</div>
                    <div style={{ fontSize: '0.9rem', color: '#6b21a8' }}>{hi} - Student list</div>
                    {(hostel && (hostel.monthlyFee != null && hostel.monthlyFee !== '')) && (
                      <div style={{ fontSize: '0.9rem', color: '#374151', marginTop: 6 }}>
                        Monthly fee: {hostel.monthlyFeeCurrency === 'INR' ? `₹${hostel.monthlyFee}` : `${hostel.monthlyFee} ${hostel.monthlyFeeCurrency}`} per student
                      </div>
                    )}
                  </>
                );
              }

              const main = hi || en || 'Hostel Students';
              return (
                <>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#6b21a8' }}>{main}</div>
                  {(hostel && (hostel.monthlyFee != null && hostel.monthlyFee !== '')) && (
                    <div style={{ fontSize: '0.9rem', color: '#374151', marginTop: 6 }}>
                      Monthly fee: {hostel.monthlyFeeCurrency === 'INR' ? `₹${hostel.monthlyFee}` : `${hostel.monthlyFee} ${hostel.monthlyFeeCurrency}`} per student
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={handleAddStudent}
              style={styles.addButton}
              aria-label="Add New Student"
            >
              <UserPlus size={18} style={{ marginLeft: '6px', flexShrink: 0 }} />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

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
            <option value="approved">Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div style={styles.filterContainer}>
          <select
            value={sortOption}
            onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
            style={styles.statusFilter}
            aria-label="Sort students"
          >
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="acc_asc">Account No ↑</option>
            <option value="acc_desc">Account No ↓</option>
          </select>
        </div>
      </div>

      <div className="card" style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3>Students</h3>
          <div style={styles.resultCountTop}>
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredStudents.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No students found matching your criteria.</p>
          </div>
        ) : isMobile ? (
          <div style={styles.studentsGrid}>
            {currentStudents.map((student, index) => {
              const computedAppNo = (() => {
                if (student.applicationNumber) return student.applicationNumber;
                if (student.combinedId) return String(student.combinedId).replace(/\//g, '');
                const hostelCode = student.hostelId || (hostel && hostel.hostelId) || null;
                if (student.studentId && hostelCode) return `${String(hostelCode)}${String(student.studentId)}`;
                return 'N/A';
              })();

              return (
                <div key={student.id} style={styles.studentCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={styles.avatar}>{String((student.studentName || 'U').charAt(0)).toUpperCase()}</div>
                      <div>
                        <div style={styles.nameText}>{student.studentName || student.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{student.mobile1 || 'N/A'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ ...styles.statusBadge, ...(student.status === 'approved' ? styles.statusAccepted : student.status === 'rejected' ? styles.statusRejected : {}) }}>
                          {student.status ? (student.status === 'approved' ? 'Active' : student.status === 'rejected' ? 'Rejected' : student.status) : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{computedAppNo}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleAccept(student)} style={{ ...styles.iconButton, ...styles.acceptButton, visibility: student.status === 'approved' ? 'hidden' : 'visible' }} title="Accept"><Check size={16} /></button>
                    <button onClick={() => handleReject(student)} style={{ ...styles.iconButton, ...styles.rejectButton, visibility: student.status === 'approved' ? 'hidden' : 'visible' }} title="Reject"><X size={16} /></button>
                    <button onClick={() => navigate(`/hostel/${hostelId}/add-student?editId=${student.id}&hostelDocId=${student.ownerHostelDocId || hostel?.id || hostelId}`)} style={{ ...styles.iconButton, ...styles.editButton }} title="Edit"><Edit size={16} /></button>
                    <button onClick={() => handleDownload(student)} style={{ ...styles.iconButton, ...styles.downloadButton }} title="Download"><Download size={16} /></button>
                    <button onClick={() => openPreview(student)} style={{ ...styles.iconButton, ...styles.viewButton }} title="Preview"><Eye size={16} /></button>
                    {student.status === 'approved' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
                          <div style={{ fontSize: 12, color: '#6b7280', marginRight: 6 }}>Balance</div>
                          <div style={{ 
                            fontWeight: 600, 
                            color: (student.currentBalance || 0) > 0 ? '#dc2626' : '#059669' 
                          }}>
                            {(student.currentBalance || 0) > 0 ? 
                              `Due: ₹${Math.abs(student.currentBalance)} Dr` : 
                              `Advance: ₹${Math.abs(student.currentBalance || 0)} Cr`}
                          </div>
                        </div>
                        <button onClick={() => navigate(`/hostel/${hostelId}/students/${student.id}/payments`)} style={{ ...styles.iconButton, ...styles.paymentButton }} title="Payments">💳</button>
                      </>
                    )}
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
                    }} style={{ ...styles.iconButton, ...styles.deleteButton }} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Application No.</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Mobile Number</th>
                <th style={styles.th}>Current Balance</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student, index) => {
                const computedAppNo = (() => {
                  if (student.applicationNumber) return student.applicationNumber;
                  if (student.combinedId) return String(student.combinedId).replace(/\//g, '');
                  const hostelCode = student.hostelId || (hostel && hostel.hostelId) || null;
                  if (student.studentId && hostelCode) return `${String(hostelCode)}${String(student.studentId)}`;
                  return 'N/A';
                })();

                return (
                  <tr key={student.id} id={`student-row-${student.id}`} style={student.id === highlightId ? { ...(index % 2 === 0 ? styles.trEven : styles.trOdd), ...styles.highlightRow } : (index % 2 === 0 ? styles.trEven : styles.trOdd)}>
                    <td style={styles.td}>{computedAppNo}</td>
                    <td style={styles.td}>
                      <span style={styles.nameText}>{student.studentName || student.name || 'N/A'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, ...(student.status === 'approved' ? styles.statusAccepted : student.status === 'rejected' ? styles.statusRejected : {}) }}>
                        {student.status ? (student.status === 'approved' ? 'Active' : student.status === 'rejected' ? 'Rejected' : student.status) : 'Pending'}
                      </span>
                    </td>
                    <td style={styles.td}>{student.mobile1 || 'N/A'}</td>
                    <td style={styles.td}>
                      <div style={{
                        ...styles.balanceContainer,
                        color: (student.currentBalance || 0) > 0 ? '#dc2626' : '#059669'
                      }}>
                        {(student.currentBalance || 0) > 0 ? 
                          `Due: ₹${Math.abs(student.currentBalance)} Dr` : 
                          `Advance: ₹${Math.abs(student.currentBalance || 0)} Cr`}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAccept(student)}
                          style={{
                            ...styles.iconButton,
                            ...styles.acceptButton,
                            visibility: student.status === 'approved' ? 'hidden' : 'visible'
                          }}
                          title="Accept"
                          aria-hidden={student.status === 'approved'}
                          disabled={student.status === 'approved'}
                        >
                          <Check size={16} />
                        </button>

                        <button
                          onClick={() => handleReject(student)}
                          style={{
                            ...styles.iconButton,
                            ...styles.rejectButton,
                            visibility: student.status === 'approved' ? 'hidden' : 'visible'
                          }}
                          title="Reject"
                          aria-hidden={student.status === 'approved'}
                          disabled={student.status === 'approved'}
                        >
                          <X size={16} />
                        </button>
                        <button onClick={() => navigate(`/hostel/${hostelId}/add-student?editId=${student.id}&hostelDocId=${student.ownerHostelDocId || hostel?.id || hostelId}`)} style={{ ...styles.iconButton, ...styles.editButton }} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDownload(student)} style={{ ...styles.iconButton, ...styles.downloadButton }} title="Download">
                          <Download size={16} />
                        </button>
                        <button onClick={() => openPreview(student)} style={{ ...styles.iconButton, ...styles.viewButton }} title="Preview">
                          <Eye size={16} />
                        </button>
                        {student.status === 'approved' && (
                          <button 
                            onClick={() => navigate(`/hostel/${hostelId}/students/${student.id}/payments`)}
                            style={{ ...styles.iconButton, ...styles.paymentButton }}
                            title="Manage Payments"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                          </button>
                        )}
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

        {/* result count moved to table header (top-right) */}
        {previewVisible && previewStudent && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 'min(920px, 96%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Preview student — {previewStudent.studentName || previewStudent.name}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setPreviewVisible(false); setPreviewStudent(null); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>Close</button>
                  <button onClick={confirmAccept} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff' }}>Accept & Save</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Student Name</div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{previewStudent.studentName || '-'}</div>

                  <div style={{ fontSize: 12, color: '#6b7280' }}>Father's Name</div>
                  <div style={{ marginBottom: 8 }}>{previewStudent.fatherName || '-'}</div>

                  <div style={{ fontSize: 12, color: '#6b7280' }}>Mother's Name</div>
                  <div style={{ marginBottom: 8 }}>{previewStudent.motherName || '-'}</div>

                  <div style={{ fontSize: 12, color: '#6b7280' }}>Mobile</div>
                  <div style={{ marginBottom: 8 }}>{previewStudent.mobile1 || '-'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Hostel</div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{(hostel && (hostel.name_hi || hostel.name)) || previewStudent.hostelName || '-'}</div>

                  <div style={{ fontSize: 12, color: '#6b7280' }}>Address</div>
                  <div style={{ marginBottom: 8 }}>{(hostel && (hostel.address_hi || hostel.address)) || previewStudent.hostelAddress || '-'}</div>

                  <div style={{ fontSize: 12, color: '#6b7280' }}>Monthly Fee</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="number" value={previewFee} onChange={(e) => setPreviewFee(e.target.value)} style={{ padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', width: '140px' }} />
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '8px',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                      }}
                    >
                      {previewCurrency || 'INR'}
                    </span>

                  </div>
                </div>
              </div>

              {/* PDF preview iframe for reading inside modal (form + rules) */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>PDF preview</div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                  <iframe
                    title="Student PDF Preview"
                    style={{ width: '100%', height: 560, border: 'none' }}
                    srcDoc={`${renderStudentPrintHtml(previewStudent) || ''}${'<div style="page-break-before: always;"></div>'}${(renderRulesHtml && renderRulesHtml(previewStudent)) || ''}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
    // allow table to shrink on small screens; mobile will use card layout instead
    minWidth: 'auto',
    borderCollapse: 'collapse',
    tableLayout: 'auto',
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
  highlightRow: {
    backgroundColor: '#fff4cc',
    transition: 'background-color 0.3s ease',
    boxShadow: 'inset 4px 0 0 0 rgba(250, 204, 21, 0.25)'
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
  paymentButton: {
    backgroundColor: '#fff7ed',
    color: '#c2410c',
  },
  balanceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#374151',
    fontWeight: '500',
  },
  header: {
    background: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    position: 'relative',
    zIndex: 10,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    '@media (min-width: 481px)': {
      padding: '0.75rem 1.25rem',
      borderRadius: '0.875rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      marginBottom: '1.25rem',
    },
    '@media (min-width: 769px)': {
      padding: '0.75rem 1.5rem',
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
    whiteSpace: 'nowrap',
    flexShrink: 0,
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
      padding: '0.5rem 1rem',
    },
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#6b21a8',
    margin: 0,
    padding: '0 0.5rem',
    flex: '1 1 auto',
    minWidth: '100px',
    textAlign: 'left',
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
    whiteSpace: 'nowrap',
    flexShrink: 0,
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
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    paddingBottom: '0.25rem',
  },
  searchContainer: {
    position: 'relative',
    flex: '1 0 auto',
    minWidth: '200px',
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
    flexShrink: 0,
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
  resultCountTop: {
    marginLeft: 'auto',
    color: '#6b7280',
    fontSize: '0.875rem',
    textAlign: 'right'
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
