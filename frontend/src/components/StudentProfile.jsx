import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import StudentPayments from './StudentPayments';
import { downloadStudentPdf } from '../utils/pdfUtils';
import { renderStudentPrintHtml } from '../utils/printTemplate';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StudentProfile = () => {
  const { hostelId, studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [student, setStudent] = useState(location.state?.student || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('tab') || 'profile');
  const [docOptions, setDocOptions] = useState([]);
  const [docSelection, setDocSelection] = useState('NONE');
  const [docOtherValue, setDocOtherValue] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [previewFee, setPreviewFee] = useState('');
  const [hostels, setHostels] = useState([]);
  const [error, setError] = useState(null);

  // Fetch hostels from Firestore
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const hostelsRef = collection(db, 'hostels');
        const snapshot = await getDocs(hostelsRef);
        const hostelsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHostels(hostelsData);
      } catch (err) {
        console.error('Error fetching hostels:', err);
        setError('Failed to load hostels. Please try again.');
      }
    };

    fetchHostels();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (student) {
        // prefill docOptions from existing documents
        const opts = (student.documents || []).map(d => d.type).filter(Boolean);
        const base = ['NONE', 'AADHAR CARD'];
        setDocOptions(Array.from(new Set([...base, ...opts])));
        setPreviewFee(student.appliedFee || student.monthlyFee || '');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });

        if (res.ok) {
          const payload = await res.json();
          const s = payload?.data || payload || null;
          if (s) {
            let merged = { ...s };
            
            // Try to fetch hostel details from authenticated API first (Firestore)
            try {
              if (token) {
                const hostelsRes = await fetch(`${API_BASE}/api/users/me/hostels`, {
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (hostelsRes.ok) {
                  const hostelsPayload = await hostelsRes.json();
                  const hostels = hostelsPayload?.data || hostelsPayload || [];
                  const found = hostels.find(h => String(h.id) === String(hostelId) || String(h._id) === String(hostelId) || String(h.hostelId) === String(hostelId));
                  if (found) {
                    merged = { ...merged, hostelName: found.name || found.hostelName || merged.hostelName, hostelAddress: found.address || merged.hostelAddress, monthlyFee: (found.monthlyFee != null ? found.monthlyFee : merged.monthlyFee), monthlyFeeCurrency: found.monthlyFeeCurrency || merged.monthlyFeeCurrency || 'INR' };
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to fetch hostel from authenticated API', e);
            }
            
            // If hostelName still missing, try public endpoint
            if (!(merged?.hostelName || merged?.hostel)) {
              try {
                const pub = await fetch(`${API_BASE}/api/public/hostels/${hostelId}`);
                if (pub.ok) {
                  const pubJson = await pub.json();
                  const pubData = pubJson?.data || pubJson || null;
                  if (pubData) {
                    merged = { ...merged, hostelName: pubData.name || merged.hostelName || merged.hostel, hostelAddress: pubData.address || merged.hostelAddress, monthlyFee: (pubData.monthlyFee != null ? pubData.monthlyFee : merged.monthlyFee), monthlyFeeCurrency: pubData.monthlyFeeCurrency || merged.monthlyFeeCurrency || 'INR' };
                  }
                }
              } catch (e) {
                console.warn('Failed to fetch hostel from public API', e);
              }
            }
            
            // If hostelName still missing, try alternate ids present on student
            if (!(merged?.hostelName || merged?.hostel)) {
              const altId = merged.ownerHostelDocId || merged.hostelDocId || merged.hostelId || null;
              if (altId) {
                try {
                  const pub2 = await fetch(`${API_BASE}/api/public/hostels/${altId}`);
                  if (pub2.ok) {
                    const pj = await pub2.json();
                    const pd = pj?.data || pj || null;
                    if (pd) {
                      merged = { ...merged, hostelName: pd.name || merged.hostelName, hostelAddress: pd.address || merged.hostelAddress, monthlyFee: (pd.monthlyFee != null ? pd.monthlyFee : merged.monthlyFee), monthlyFeeCurrency: pd.monthlyFeeCurrency || merged.monthlyFeeCurrency || 'INR' };
                    }
                  }
                } catch (e) { /* ignore */ }
              }
            }

            setStudent(merged);
            const opts = (merged?.documents || []).map(d => d.type).filter(Boolean);
            const base = ['NONE', 'AADHAR CARD'];
            setDocOptions(Array.from(new Set([...base, ...opts])));
            setPreviewFee(merged?.appliedFee ?? merged?.monthlyFee ?? '');
          } else {
            console.warn('Student not found');
          }
        } else {
          // fallback: navigate back
          console.warn('Student not found');
        }
      } catch (err) {
        console.error('Failed to load student', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelId, studentId]);

  const close = () => navigate(`/hostel/${hostelId}/students`);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');
      const payload = { appliedFee: Number(previewFee) || 0, appliedFeeCurrency: student?.appliedFeeCurrency || student?.monthlyFeeCurrency || 'INR' };
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      setStudent(prev => ({ ...prev, ...updated }));
      alert('Saved successfully');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  };

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Not authenticated');
      const payload = { status: 'approved', appliedFee: Number(previewFee) || 0, appliedFeeCurrency: student?.appliedFeeCurrency || 'INR' };
      const res = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Accept failed');
      const updated = await res.json();
      setStudent(prev => ({ ...prev, ...updated, status: 'approved' }));
      alert('Student accepted');
    } catch (err) {
      console.error(err);
      alert('Accept failed');
    }
  };

  const handleDownload = async () => {
    try {
      await downloadStudentPdf(student);
    } catch (err) {
      console.error(err);
      alert('Download failed');
    }
  };

  const addCustomDocOption = (value) => {
    if (!value || !value.trim()) return;
    const u = String(value).trim().toUpperCase();
    // Check if option already exists (case-insensitive)
    if (docOptions && docOptions.some(opt => opt.toUpperCase() === u)) {
      alert('This document type already exists');
      return;
    }
    setDocOptions(prev => Array.from(new Set([...(prev || ['NONE','AADHAR CARD']), u])));
    setDocSelection(u);
    setDocOtherValue('');
  };

  const handleDocumentUpload = async (file) => {
    if (!file || !student) return;
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        const newDoc = { id: `doc_${Date.now()}`, type: docSelection || 'NONE', dataUrl, uploadedAt: new Date().toISOString() };
        const existing = Array.isArray(student.documents) ? [newDoc, ...student.documents] : [newDoc];
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ documents: existing })
        });
        if (!resp.ok) throw new Error('Failed to upload');
        setStudent(prev => ({ ...prev, documents: existing }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!student) return;
    if (!confirm('Delete this document?')) return;
    try {
      const existing = Array.isArray(student.documents) ? student.documents.filter(d => d.id !== docId) : [];
      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documents: existing })
      });
      if (!resp.ok) throw new Error('Delete failed');
      setStudent(prev => ({ ...prev, documents: existing }));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={32} className="animate-spin" />
        <p>Loading student data...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <h2>Student Not Found</h2>
        <p>The requested student record could not be found.</p>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={18} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const isActive = student.status === 'approved';

  return (
    <div style={styles.container}>
      {/* Header with back button */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={close} style={styles.backButton}>
            <ArrowLeft size={18} />
            <span>Back to Students</span>
          </button>

          <div style={styles.headerMain}>
            <div style={styles.headerInfo}>
              <h1 style={styles.title}>
                {student.studentName || student.name || 'Student Profile'}
              </h1>
              <div style={styles.headerMeta}>
                <span style={styles.statusBadge}>
                  {student.status === 'approved' ? 'Active' : 
                   student.status === 'rejected' ? 'Rejected' : 
                   student.status || 'Pending'}
                </span>
                <span style={styles.idBadge}>ID: {student.studentId || studentId}</span>
              </div>
            </div>

            <div style={styles.headerActions}>
              <div style={styles.actionGroup}>
                <label style={styles.feeInputContainer}>
                  <span style={styles.feeLabel}>Monthly Fee ({student.appliedFeeCurrency || 'INR'})</span>
                  <input 
                    type="number" 
                    value={previewFee} 
                    onChange={(e) => setPreviewFee(e.target.value)}
                    style={styles.feeInput}
                    min="0"
                    step="100"
                  />
                </label>
              </div>
              
              <div style={styles.actionButtons}>
                {!isActive && (
                  <button 
                    onClick={handleAccept} 
                    disabled={saving}
                    style={{ ...styles.button, ...styles.acceptButton }}
                  >
                    {saving ? 'Processing...' : 'Approve'}
                  </button>
                )}
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  style={{ ...styles.button, ...styles.saveButton }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : 'Save'}
                </button>
                <button 
                  onClick={handleDownload} 
                  style={styles.iconButton}
                  title="Download PDF"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div style={styles.quickInfo}>
            <div style={styles.quickInfoItem}>
              <span style={styles.quickInfoLabel}>Mobile</span>
              <span style={styles.quickInfoValue}>{student.mobile1 || '-'}</span>
            </div>
            <div style={styles.quickInfoDivider} />
            <div style={styles.quickInfoItem}>
              <span style={styles.quickInfoLabel}>Father</span>
              <span style={styles.quickInfoValue}>{student.fatherName || '-'}</span>
            </div>
            <div style={styles.quickInfoDivider} />
            <div style={styles.quickInfoItem}>
              <span style={styles.quickInfoLabel}>Hostel</span>
              <select 
                value={student.hostelId || ''}
                onChange={(e) => {
                  const selectedHostel = hostels.find(h => h.id === e.target.value);
                  if (selectedHostel) {
                    setStudent(prev => ({
                      ...prev,
                      hostelId: selectedHostel.id,
                      hostelName: selectedHostel.name,
                      monthlyFee: selectedHostel.monthlyFee || prev.monthlyFee
                    }));
                    setPreviewFee(selectedHostel.monthlyFee || previewFee);
                  }
                }}
                style={styles.hostelSelect}
                disabled={saving}
              >
                {hostels.map(hostel => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('profile')} 
          style={{ ...styles.tabButton, ...(activeTab === 'profile' ? styles.tabActive : {}) }}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('payments')} 
          style={{ ...styles.tabButton, ...(activeTab === 'payments' ? styles.tabActive : {}) }}
        >
          Payment
        </button>
        <button 
          onClick={() => setActiveTab('documents')} 
          style={{ ...styles.tabButton, ...(activeTab === 'documents' ? styles.tabActive : {}) }}
        >
          Documents
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.card}>
        {activeTab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={styles.tabTitle}>Profile Preview</h3>
              <button 
                onClick={() => window.open(`/hostel/${hostelId}/add-student?editId=${studentId}&hostelDocId=${student?.ownerHostelDocId || hostelId}`, '_blank')}
                style={styles.editTabButton}
              >
                Edit Form
              </button>
            </div>
            <div style={styles.previewFrame}>
              <iframe title="Student PDF Preview" style={{ width: '100%', height: 560, border: 'none' }} srcDoc={renderStudentPrintHtml(student)} />
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <StudentPayments />
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h3 style={styles.tabTitle}>Upload Documents ({Array.isArray(student.documents) ? `${student.documents.length} document${student.documents.length !== 1 ? 's' : ''}` : '0 documents'})</h3>
            
            {/* Upload Control Row: Dropdown | Upload | Preview */}
            <div style={styles.docControlsRow}>
              <select value={docSelection} onChange={(e) => setDocSelection(e.target.value)} style={styles.docSelect}>
                {(docOptions || ['NONE','AADHAR CARD']).map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                <option value="__ADD_OTHER__">Others (add)</option>
              </select>

              {(docSelection && docSelection !== 'NONE' && docSelection !== '__ADD_OTHER__') && (
                <label style={styles.fileUploadLabel}>
                  <Upload size={16} style={{ marginRight: '0.5rem' }} />
                  Upload File
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) handleDocumentUpload(f); e.target.value = ''; }} style={{ display: 'none' }} />
                </label>
              )}

              {(docSelection && docSelection !== 'NONE' && docSelection !== '__ADD_OTHER__') && (
                <button 
                  style={styles.previewButton}
                  onClick={() => {
                    const docs = (student.documents || []).filter(d => d.type === docSelection);
                    if (docs.length > 0) setPreviewImage(docs[docs.length - 1].dataUrl);
                  }}
                >
                  Preview
                </button>
              )}
            </div>

            {/* "Others" Input Row */}
            {docSelection === '__ADD_OTHER__' && (
              <div style={styles.addOtherRow}>
                <input value={docOtherValue} onChange={(e) => setDocOtherValue(e.target.value)} placeholder="Enter document name" style={styles.docInput} />
                <button onClick={() => addCustomDocOption(docOtherValue)} style={{ ...styles.button, padding: '0.625rem 1rem' }}>Add Type</button>
              </div>
            )}

            {/* Add New Document Button */}
            <div style={styles.addNewDocRow}>
              <button 
                onClick={() => setDocSelection('NONE')} 
                style={styles.addNewDocButton}
              >
                + Add New Document
              </button>
            </div>

            {/* Documents Grid */}
            <div style={styles.docGrid}>
              {Array.isArray(student.documents) && student.documents.length > 0 ? (
                student.documents.map(doc => (
                  <div key={doc.id} style={styles.docItem}>
                    <div style={styles.docLabel}>{doc.type}</div>
                    <img src={doc.dataUrl} alt={doc.type} style={styles.docImage} onClick={() => setPreviewImage(doc.dataUrl)} />
                    <button onClick={() => handleDeleteDocument(doc.id)} style={styles.docDeleteBtn}>×</button>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>No documents uploaded yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setPreviewImage(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '92%', maxHeight: '92%', background: '#fff', padding: 12, borderRadius: 8 }}>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }} />
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button onClick={() => setPreviewImage(null)} style={{ padding: '6px 10px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '1rem',
    color: '#64748b',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '1rem',
    textAlign: 'center',
    padding: '2rem',
    '& h2': {
      color: '#1e293b',
      margin: '0.5rem 0',
    },
    '& p': {
      color: '#64748b',
      marginBottom: '1.5rem',
    },
  },
  header: {
    background: 'white',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
    marginBottom: '1.5rem',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid #e2e8f0',
  },
  headerContent: {
    padding: '1.5rem 2rem 0',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerInfo: {
    flex: 1,
    minWidth: '300px',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  idBadge: {
    fontSize: '0.75rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'white',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    color: '#475569',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    marginBottom: '1rem',
    '&:hover': {
      background: '#f8fafc',
      borderColor: '#cbd5e1',
      transform: 'translateY(-1px)',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.2',
  },
  quickInfo: {
    display: 'flex',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    marginTop: '1.5rem',
    padding: '1rem 2rem',
    gap: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  quickInfoItem: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '120px',
  },
  quickInfoLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
    fontWeight: '600',
  },
  quickInfoValue: {
    fontSize: '0.95rem',
    color: '#1e293b',
    fontWeight: '500',
  },
  quickInfoDivider: {
    width: '1px',
    height: '2rem',
    backgroundColor: '#e2e8f0',
    margin: '0 0.25rem',
  },
  headerActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'flex-end',
    minWidth: '280px',
  },
  actionGroup: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  feeInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: '0.5rem',
  },
  feeLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '0.25rem',
    fontWeight: '500',
  },
  feeInput: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.375rem',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
    },
  },
  hostelSelect: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.375rem',
    fontSize: '0.95rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '200px',
    '&:focus': {
      outline: 'none',
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
    },
    '&:disabled': {
      backgroundColor: '#f8fafc',
      cursor: 'not-allowed',
    },
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
    },
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    padding: '1.75rem 2rem',
    marginBottom: '1.5rem',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.5rem',
  },
  value: {
    fontSize: '1rem',
    color: '#111827',
    fontWeight: '500',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontWeight: 500,
    fontSize: '0.75rem',
    '&::before': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#94a3b8',
    },
  },
  statusActive: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    '&::before': {
      backgroundColor: '#22c55e',
    },
  },
  statusRejected: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    '&::before': {
      backgroundColor: '#ef4444',
    },
  },
  actionButtons: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    '&:disabled': {
      opacity: '0.7',
      cursor: 'not-allowed',
      transform: 'none !important',
    },
  },
  acceptButton: {
    background: '#10b981',
    color: 'white',
    '&:hover:not(:disabled)': {
      background: '#0d9f6e',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px -1px rgba(16, 185, 129, 0.3)',
    },
  },
  saveButton: {
    background: '#3b82f6',
    color: 'white',
    '&:hover:not(:disabled)': {
      background: '#2563eb',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px -1px rgba(59, 130, 246, 0.3)',
    },
  },
  closeButton: {
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    '&:hover:not(:disabled)': {
      background: '#f1f5f9',
      borderColor: '#cbd5e1',
    },
  },
  tabsContainer: {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '1.5rem',
    padding: '0 2rem',
    borderBottom: '1px solid #e2e8f0',
  },
  tabButton: {
    padding: '0.75rem 1.25rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    fontWeight: '500',
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    marginBottom: '-1px',
    '&:hover': {
      color: '#4f46e5',
    },
  },
  tabActive: {
    color: '#4f46e5',
    borderBottomColor: '#4f46e5',
    fontWeight: '600',
  },
  tabTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 1rem 0',
  },
  editTabButton: {
    padding: '0.5rem 1rem',
    background: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #86efac',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#dcfce7',
    },
  },
  previewFrame: {
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    background: '#f9fafb',
  },
  docControls: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  docControlsRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  },
  addOtherRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    borderRadius: '0.5rem',
    border: '1px solid #fcd34d',
  },
  addNewDocRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  addNewDocButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(124, 58, 237, 0.3)',
    },
  },
  docSelect: {
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '0.875rem',
    cursor: 'pointer',
    flex: '0 0 auto',
    minWidth: '150px',
  },
  addOtherContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  docInput: {
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    flex: '1',
    minWidth: '200px',
  },
  fileUploadLabel: {
    padding: '0.625rem 1rem',
    background: '#3b82f6',
    color: 'white',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: '1px solid #2563eb',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    '&:hover': {
      background: '#2563eb',
    },
  },
  previewButton: {
    padding: '0.625rem 1rem',
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    '&:hover': {
      background: '#7c3aed',
    },
  },
  docGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  },
  docItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    position: 'relative',
  },
  docLabel: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    width: '100%',
    wordBreak: 'break-word',
    minHeight: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImage: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  docDeleteBtn: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    background: '#ef4444',
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#dc2626',
      transform: 'scale(1.1)',
    },
  },
  docLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.5rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
    fontSize: '1rem',
  },
};
