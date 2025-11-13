import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import StudentPayments from './StudentPayments';
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
  const [previewImage, setPreviewImage] = useState(null);
  const [previewFee, setPreviewFee] = useState('');

  useEffect(() => {
    const load = async () => {
      if (student) {
        // prefill docOptions from existing documents
        const opts = (student.documents || []).map(d => d.type).filter(Boolean);
        const base = ['NONE', 'AADHAR CARD'];
        setDocOptions(Array.from(new Set([...base, ...opts])));
        setPreviewFee(student.appliedFee || student.monthlyFee || '');
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
          setStudent(s);
          const opts = (s?.documents || []).map(d => d.type).filter(Boolean);
          const base = ['NONE', 'AADHAR CARD'];
          setDocOptions(Array.from(new Set([...base, ...opts])));
          setPreviewFee(s?.appliedFee || s?.monthlyFee || '');
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

  if (loading || !student) return <div style={styles.container}><div style={styles.loading}>Loading...</div></div>;

  const isActive = student.status === 'approved';

  return (
    <div style={styles.container}>
      {/* Header with back button */}
      <div style={styles.header}>
        <button onClick={close} style={styles.backButton}>
          <ArrowLeft size={18} />
          <span>Back to Students</span>
        </button>
        <h1 style={styles.title}>{student.studentName || student.name || 'Student Profile'}</h1>
        <button onClick={handleDownload} style={styles.downloadHeaderButton}>
          <Download size={18} />
          <span>PDF</span>
        </button>
      </div>

      {/* Student Details Card */}
      <div style={styles.card}>
        <div style={styles.detailsGrid}>
          <div>
            <div style={styles.label}>Student Name</div>
            <div style={styles.value}>{student.studentName || student.name || '-'}</div>
          </div>
          <div>
            <div style={styles.label}>Mobile Number</div>
            <div style={styles.value}>{student.mobile1 || '-'}</div>
          </div>
          <div>
            <div style={styles.label}>Father's Name</div>
            <div style={styles.value}>{student.fatherName || '-'}</div>
          </div>
          <div>
            <div style={styles.label}>Hostel Name</div>
            <div style={styles.value}>{student.hostelName || student.hostel || '-'}</div>
          </div>
          <div>
            <div style={styles.label}>Monthly Fee</div>
            <div style={styles.value}>{student.appliedFee || student.monthlyFee ? `${student.appliedFee || student.monthlyFee} ${student.appliedFeeCurrency || student.monthlyFeeCurrency || 'INR'}` : '-'}</div>
          </div>
          <div>
            <div style={styles.label}>Status</div>
            <div style={{ ...styles.statusBadge, ...(student.status === 'approved' ? styles.statusActive : student.status === 'rejected' ? styles.statusRejected : {}) }}>
              {student.status ? (student.status === 'approved' ? 'Active' : student.status === 'rejected' ? 'Rejected' : student.status) : 'Pending'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          {!isActive && (
            <button onClick={handleAccept} style={{ ...styles.button, ...styles.acceptButton }}>
              Accept & Save
            </button>
          )}
          <button onClick={handleSave} style={{ ...styles.button, ...styles.saveButton }}>
            {isActive ? 'Save' : 'Save'}
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
            <h3 style={styles.tabTitle}>Upload Documents</h3>
            <div style={styles.docControls}>
              <select value={docSelection} onChange={(e) => setDocSelection(e.target.value)} style={styles.docSelect}>
                {(docOptions || ['NONE','AADHAR CARD']).map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                <option value="__ADD_OTHER__">Others (add)</option>
              </select>
              {docSelection === '__ADD_OTHER__' && (
                <div style={styles.addOtherContainer}>
                  <input value={docOtherValue} onChange={(e) => setDocOtherValue(e.target.value)} placeholder="Enter document name" style={styles.docInput} />
                  <button onClick={() => addCustomDocOption(docOtherValue)} style={styles.button}>Add</button>
                </div>
              )}
              {(docSelection && docSelection !== 'NONE' && docSelection !== '__ADD_OTHER__') && (
                <label style={styles.fileUploadLabel}>
                  Upload
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) handleDocumentUpload(f); e.target.value = ''; }} style={{ display: 'none' }} />
                </label>
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

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
    padding: '1.5rem',
    boxSizing: 'border-box',
  },
  header: {
    background: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
      borderTopLeftRadius: '0.75rem',
      borderTopRightRadius: '0.75rem',
    },
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 0.875rem',
    borderRadius: '0.5rem',
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
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#6b21a8',
    margin: 0,
    flex: 1,
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
  card: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '1.5rem',
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
    display: 'inline-block',
    padding: '0.5rem 0.75rem',
    borderRadius: '9999px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontWeight: 600,
    fontSize: '0.75rem',
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
    borderTop: '1px solid #e5e7eb',
  },
  button: {
    padding: '0.625rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
  },
  acceptButton: {
    background: '#10b981',
    color: 'white',
    '&:hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    },
  },
  saveButton: {
    background: '#3b82f6',
    color: 'white',
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
