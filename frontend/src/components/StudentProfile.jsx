import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

  // If URL has mode=edit, open the edit form directly after student loads
  useEffect(() => {
    const mode = new URLSearchParams(location.search).get('mode');
    if (mode === 'edit' && student) {
      // small delay to ensure UI mounted
      setTimeout(() => goEdit(), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, location.search]);

  const close = () => navigate(`/hostel/${hostelId}/students`);

  const goEdit = () => {
    navigate(`/hostel/${hostelId}/add-student?editId=${studentId}&hostelDocId=${student?.ownerHostelDocId || hostelId}`);
  };

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

  if (loading || !student) return <div style={{ padding: 24 }}>Loading...</div>;

  const isActive = student.status === 'approved';

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{student.studentName || student.name || 'Student'}</div>
          <div style={{ color: '#6b7280' }}>{student.mobile1 || '-'}</div>
          <div style={{ color: '#6b7280' }}>Father: {student.fatherName || '-'}</div>
          <div style={{ color: '#374151', marginTop: 6 }}><strong>Hostel:</strong> {student.hostelName || student.hostel || '-'}</div>
          <div style={{ color: '#374151' }}><strong>Monthly Fee:</strong> {student.appliedFee || student.monthlyFee ? `${student.appliedFee || student.monthlyFee} ${student.appliedFeeCurrency || student.monthlyFeeCurrency || 'INR'}` : '-'}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={close} style={{ padding: '8px 12px', borderRadius: 6 }}>Close</button>
          {!isActive && <button onClick={handleAccept} style={{ padding: '8px 12px', borderRadius: 6, background: '#10b981', color: '#fff' }}>Accept & Save</button>}
          <button onClick={handleSave} style={{ padding: '8px 12px', borderRadius: 6 }}>{isActive ? 'Save' : 'Save'}</button>
          <button onClick={handleDownload} style={{ padding: '8px 12px', borderRadius: 6, background: '#eef2ff' }}>Download PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setActiveTab('profile')} style={{ padding: '8px 12px', borderRadius: 6, background: activeTab === 'profile' ? '#8b5cf6' : '#f3f4f6', color: activeTab === 'profile' ? '#fff' : '#111827' }}>Profile</button>
        <button onClick={() => setActiveTab('payments')} style={{ padding: '8px 12px', borderRadius: 6, background: activeTab === 'payments' ? '#8b5cf6' : '#f3f4f6', color: activeTab === 'payments' ? '#fff' : '#111827' }}>Payment</button>
        <button onClick={() => setActiveTab('documents')} style={{ padding: '8px 12px', borderRadius: 6, background: activeTab === 'documents' ? '#8b5cf6' : '#f3f4f6', color: activeTab === 'documents' ? '#fff' : '#111827' }}>Documents</button>
      </div>

      <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
        {activeTab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ color: '#6b7280' }}>Profile preview</div>
              <div>
                <button onClick={goEdit} style={{ padding: '6px 10px', borderRadius: 6 }}>Edit</button>
              </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <select value={docSelection} onChange={(e) => setDocSelection(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
                {(docOptions || ['NONE','AADHAR CARD']).map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                <option value="__ADD_OTHER__">Others (add)</option>
              </select>
              {docSelection === '__ADD_OTHER__' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={docOtherValue} onChange={(e) => setDocOtherValue(e.target.value)} placeholder="Enter other document name" style={{ padding: 8, borderRadius: 6 }} />
                  <button onClick={() => addCustomDocOption(docOtherValue)} style={{ padding: '6px 10px', borderRadius: 6 }}>Add</button>
                </div>
              )}
              {(docSelection && docSelection !== 'NONE' && docSelection !== '__ADD_OTHER__') && (
                <label style={{ padding: '6px 10px', borderRadius: 6, background: '#f3f4f6', cursor: 'pointer' }}>
                  Choose File
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) handleDocumentUpload(f); e.target.value = ''; }} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Array.isArray(student.documents) && student.documents.map(doc => (
                <div key={doc.id} style={{ position: 'relative' }}>
                  <img src={doc.dataUrl} alt={doc.type} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} onClick={() => setPreviewImage(doc.dataUrl)} />
                  <button onClick={() => handleDeleteDocument(doc.id)} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 22, height: 22, border: '2px solid #fff' }}>×</button>
                  <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>{doc.type}</div>
                </div>
              ))}
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
