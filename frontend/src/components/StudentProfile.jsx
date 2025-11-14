import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import StudentPayments from './StudentPayments';
import Spinner from './Spinner';
import { downloadStudentPdf } from '../utils/pdfUtils';
import { renderStudentPrintHtml } from '../utils/printTemplate';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StudentProfile = () => {
  const { hostelId, studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [student, setStudent] = useState(location.state?.student || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('tab') || 'profile');
  const [docOptions, setDocOptions] = useState([]);
  const [docSelection, setDocSelection] = useState('NONE');
  const [docOtherValue, setDocOtherValue] = useState('');
  const [pendingDoc, setPendingDoc] = useState(null); // holds selected file preview before user clicks Add
  const [previewImage, setPreviewImage] = useState(null);
  const [previewFee, setPreviewFee] = useState('');

  useEffect(() => {
    const load = async () => {
      let studentData = student;
      
      // If student was passed via location.state, ensure we enrich it with hostel data
      if (student) {
        studentData = { ...student };
        
        // Try to fetch hostel details from authenticated API first (Firestore)
        try {
          const token = localStorage.getItem('token');
          if (token && !(studentData?.hostelName || studentData?.hostel?.name)) {
            const hostelsRes = await fetch(`${API_BASE}/api/users/me/hostels`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (hostelsRes.ok) {
              const hostelsPayload = await hostelsRes.json();
              const hostels = hostelsPayload?.data || hostelsPayload || [];
              const found = hostels.find(h => String(h.id) === String(hostelId) || String(h._id) === String(hostelId) || String(h.hostelId) === String(hostelId));
              if (found) {
                studentData = { ...studentData, hostelName: found.name || found.hostelName || studentData.hostelName };
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch hostel from authenticated API', e);
        }
        
        // If hostelName still missing, try public endpoint
        if (!(studentData?.hostelName || studentData?.hostel?.name)) {
          try {
            const pub = await fetch(`${API_BASE}/api/public/hostels/${hostelId}`);
            if (pub.ok) {
              const pubJson = await pub.json();
              const pubData = pubJson?.data || pubJson || null;
              if (pubData) {
                studentData = { ...studentData, hostelName: pubData.name || studentData.hostelName || studentData.hostel };
              }
            }
          } catch (e) {
            console.warn('Failed to fetch hostel from public API', e);
          }
        }
        
        // If hostelName still missing, try alternate ids present on student
        if (!(studentData?.hostelName || studentData?.hostel?.name)) {
          const altId = studentData.ownerHostelDocId || studentData.hostelDocId || studentData.hostelId || null;
          if (altId) {
            try {
              const pub2 = await fetch(`${API_BASE}/api/public/hostels/${altId}`);
              if (pub2.ok) {
                const pj = await pub2.json();
                const pd = pj?.data || pj || null;
                if (pd) {
                  studentData = { ...studentData, hostelName: pd.name || studentData.hostelName };
                }
              }
            } catch (e) { /* ignore */ }
          }
        }
        
        setStudent(studentData);
        const opts = (studentData?.documents || []).map(d => d.type).filter(Boolean);
        const base = ['NONE', 'AADHAR CARD'];
        setDocOptions(Array.from(new Set([...base, ...opts])));
        setPreviewFee(studentData?.appliedFee ?? studentData?.monthlyFee ?? '');
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

  // When user selects a file, process it and create a pending preview only.
  // The file will be saved to the student's documents only when the user clicks the Add button.
  const handleDocumentUpload = async (file) => {
    if (!file || !student) return;
    try {
      // Resize/compress image client-side to avoid Firestore document size limits
      const dataUrlFromFile = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = (err) => reject(err);
        fr.readAsDataURL(file);
      });

      // Create image element to draw on canvas
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (e) => reject(new Error('Invalid image'));
        image.src = dataUrlFromFile;
      });

      // Determine target size (limit dimensions)
      const MAX_DIM = 1200; // px
      let { width, height } = img;
      let ratio = 1;
      if (width > MAX_DIM || height > MAX_DIM) {
        ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export compressed JPEG (fallback to PNG if quality not supported)
      let compressedDataUrl;
      try {
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
      } catch (e) {
        compressedDataUrl = canvas.toDataURL();
      }

      // Safety: ensure result size is reasonable (< 800KB) to avoid Firestore 1MB limit
      const approxBytes = Math.ceil((compressedDataUrl.length * 3) / 4);
      if (approxBytes > 800 * 1024) {
        return alert('Image is too large after compression. Please choose a smaller image or crop it before uploading.');
      }

      // create pending doc (do not persist yet)
      const pending = { id: `pending_${Date.now()}`, type: docSelection || 'NONE', dataUrl: compressedDataUrl, uploadedAt: new Date().toISOString(), fileName: file.name };
      setPendingDoc(pending);
      // show preview of pending doc
      setPreviewImage(pending.dataUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to process selected image');
    }
  };

  // Commit pendingDoc to student's documents (persist to backend)
  const addPendingDocument = async () => {
    if (!pendingDoc || !student) return alert('No file selected');
    try {
      const pendingType = String(pendingDoc.type || '').trim().toUpperCase();
      if (!pendingType || pendingType === 'NONE') return alert('Please select a valid document type before adding');

      const existingDocs = Array.isArray(student.documents) ? student.documents : [];
      const duplicate = existingDocs.some(d => String(d.type || '').trim().toUpperCase() === pendingType);
      if (duplicate) {
        return alert(`A document of type "${pendingDoc.type}" has already been uploaded`);
      }

      const newDoc = { id: `doc_${Date.now()}`, type: pendingDoc.type || 'NONE', dataUrl: pendingDoc.dataUrl, uploadedAt: pendingDoc.uploadedAt };
      const existing = [newDoc, ...existingDocs];
      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE}/api/users/me/hostels/${hostelId}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documents: existing })
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => null);
        console.error('Add pending document failed', resp.status, errText);
        throw new Error('Failed to add document');
      }
      setStudent(prev => ({ ...prev, documents: existing }));
      setPendingDoc(null);
      setPreviewImage(null);
      // reset selection
      setDocSelection('NONE');
    } catch (err) {
      console.error(err);
      alert('Failed to add document');
    }
  };

  const cancelPendingDocument = () => {
    setPendingDoc(null);
    setPreviewImage(null);
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

  if (loading || !student) return <div style={styles.container}><Spinner /></div>;

  const isActive = student.status === 'approved';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {/* Back button on the top-left */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginRight: 12 }}>
          <button onClick={close} style={styles.smallBackButton} title="Back to Students">
            <ArrowLeft size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
          <h1 style={styles.title}>{student.studentName || student.name || 'Student Profile'}</h1>
          {/* Application number in main header */}
          { (student.applicationNumber || student.combinedId || student.applicationNo) && (
            <div style={{ fontSize: '0.95rem', color: '#6b7280', fontWeight: 600 }}>
              Application No. {String(student.applicationNumber || student.combinedId || student.applicationNo).replace(/\//g, '')}
            </div>
          )}

          {/* Inline details moved to header (exclude duplicate student name) */}
          <div style={styles.headerDetails}>
            <div style={styles.headerDetailItem}><div style={styles.label}>Mobile</div><div style={styles.valueSmall}>{student.mobile1 || '-'}</div></div>
            <div style={styles.headerDetailItem}><div style={styles.label}>Father's Name</div><div style={styles.valueSmall}>{student.fatherName || '-'}</div></div>
            <div style={styles.headerDetailItem}><div style={styles.label}>Hostel</div><div style={styles.valueSmall}>{student.hostelName || student.hostel?.name || student.hostel || student.hostelNameEn || student.hostelNameHi || '-'}</div></div>
            <div style={styles.headerDetailItem}><div style={styles.label}>Monthly Fee</div><div style={styles.valueSmall}><input type="number" value={previewFee || ''} onChange={(e) => setPreviewFee(e.target.value)} style={{ width: 120, padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }} /></div></div>
            <div style={styles.headerDetailItem}><div style={styles.label}>Status</div><div style={{ ...styles.statusBadge, ...(student.status === 'approved' ? styles.statusActive : student.status === 'rejected' ? styles.statusRejected : {}) }}>{student.status ? (student.status === 'approved' ? 'Active' : student.status === 'rejected' ? 'Rejected' : student.status) : 'Pending'}</div></div>
          </div>
        </div>

        <div style={styles.headerActions}>
          {!isActive && (
            <button onClick={handleAccept} style={{ ...styles.button, ...styles.acceptButton }}>
              Accept
            </button>
          )}

          <button onClick={handleSave} style={{ ...styles.button, ...styles.saveButton }}>
            Save
          </button>

          <button onClick={handleDownload} style={{ ...styles.downloadHeaderButton, marginLeft: 8 }}>
            <Download size={18} />
            <span>PDF</span>
          </button>

          <button onClick={close} style={{ ...styles.button, ...styles.closeButton }}>
            Close
          </button>
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
            <div style={styles.docControls}>
              <select value={docSelection} onChange={(e) => setDocSelection(e.target.value)} style={styles.docSelect}>
                {(docOptions || ['NONE','AADHAR CARD']).map(opt => {
                  const label = opt || '';
                  const isNone = String(opt || '').toUpperCase() === 'NONE';
                  let disabled = false;
                  try {
                    if (!isNone) {
                      disabled = Array.isArray(student?.documents) && student.documents.some(d => String(d.type || '').toUpperCase() === String(opt || '').toUpperCase());
                    }
                  } catch (e) { disabled = false; }
                  return (
                    <option key={opt} value={opt} disabled={disabled}>{label}</option>
                  );
                })}
                <option value="__ADD_OTHER__">Others (add)</option>
              </select>

              {docSelection === '__ADD_OTHER__' && (
                <div style={styles.addOtherContainer}>
                  <input value={docOtherValue} onChange={(e) => setDocOtherValue(e.target.value)} placeholder="Enter document name" style={styles.docInput} />
                  <button onClick={() => addCustomDocOption(docOtherValue)} style={styles.button}>Add</button>
                </div>
              )}

              {(docSelection && docSelection !== 'NONE' && docSelection !== '__ADD_OTHER__') && (
                <>
                  <label style={styles.fileUploadLabel}>
                    Upload
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) handleDocumentUpload(f); e.target.value = ''; }} style={{ display: 'none' }} />
                  </label>

                  {/* If a file is selected and pending, show preview + Add/Cancel buttons */}
                  {pendingDoc ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={pendingDoc.dataUrl} alt="preview" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={addPendingDocument} style={{ ...styles.button, background: '#10b981', color: '#fff' }}>Add</button>
                        <button onClick={cancelPendingDocument} style={{ ...styles.button, background: '#f3f4f6', color: '#374151' }}>Cancel</button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div style={styles.docGrid}>
              {Array.isArray(student.documents) && student.documents.length > 0 ? (
                student.documents.map(doc => (
                  <div key={doc.id} style={styles.docItem}>
                    <img src={doc.dataUrl} alt={doc.type} style={styles.docImage} onClick={() => setPreviewImage(doc.dataUrl)} />
                    <button onClick={() => handleDeleteDocument(doc.id)} style={styles.docDeleteBtn}>×</button>
                    <div style={styles.docLabel}>{doc.type}</div>
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

// Common styles for consistent UI
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)',
    padding: '1.5rem',
    boxSizing: 'border-box',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    background: 'white',
    padding: '1.25rem 1.5rem',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1rem',
    position: 'relative',
    zIndex: 10,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
      borderTopLeftRadius: '0.9rem',
      borderTopRightRadius: '0.9rem',
    },
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 0.9rem',
    borderRadius: '0.6rem',
    cursor: 'pointer',
    color: '#4b5563',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#f1f5f9',
      borderColor: '#cbd5e1',
      transform: 'translateY(-1px)',
    },
  },
  smallBackButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    cursor: 'pointer',
    color: '#374151',
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  downloadHeaderButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      opacity: 0.95,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px -2px rgba(139, 92, 246, 0.3)',
    },
  },
  headerDetails: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: 6,
  },
  headerDetailItem: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 140,
    marginRight: 8,
  },
  valueSmall: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#64748b',
    marginBottom: '0.375rem',
    display: 'block',
  },
  value: {
    fontSize: '0.9375rem',
    color: '#1e293b',
    fontWeight: '500',
    lineHeight: '1.5',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.8125rem',
    fontWeight: '500',
    lineHeight: '1',
  },
  statusActive: {
    backgroundColor: '#ecfccb',
    color: '#365314',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
    color: '#7f1d1d',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    paddingTop: '1.5rem',
    marginTop: '1.5rem',
    borderTop: '1px solid #e2e8f0',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#334155',
    fontWeight: '500',
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
    },
  },
  acceptButton: {
    backgroundColor: '#10b981',
    color: 'white',
    borderColor: '#10b981',
    ':hover': {
      backgroundColor: '#0d9f74',
      borderColor: '#0d9f74',
      transform: 'translateY(-1px)',
    },
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
    ':hover': {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
      transform: 'translateY(-1px)',
    },
    '&:hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    },
  },
  closeButton: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    '&:hover': {
      background: '#e5e7eb',
    },
  },
  tabsContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #e5e7eb',
  },
  tabButton: {
    padding: '0.75rem 1rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    color: '#6b7280',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: '#374151',
    },
  },
  tabActive: {
    color: '#8b5cf6',
    borderBottomColor: '#8b5cf6',
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
  docSelect: {
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '0.875rem',
    cursor: 'pointer',
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
  },
  fileUploadLabel: {
    padding: '0.625rem 1rem',
    background: '#f3f4f6',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#e5e7eb',
    },
  },
  docGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '1rem',
  },
  docItem: {
    position: 'relative',
    textAlign: 'center',
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
