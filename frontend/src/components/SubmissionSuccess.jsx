import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { downloadStudentPdf } from '../utils/pdfUtils';

const SubmissionSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const combinedId = state.combinedId || (state.data && state.data.combinedId) || null;
  const formData = state.formData || null;

  const handleDownload = async () => {
    if (!formData) {
      alert('Form data not available for PDF generation.');
      return;
    }
    try {
      await downloadStudentPdf(formData);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. See console for details.');
    }
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <div style={{ maxWidth: '720px', width: '100%', background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Submission received</h2>
        <p style={{ color: '#475569', marginBottom: '1rem' }}>Thank you — your application has been submitted successfully.</p>

        {combinedId ? (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Application number</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>{combinedId}</div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button onClick={handleDownload} style={{ background: '#0ea5a4', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Download PDF
          </button>
          <button onClick={() => navigate('/')} style={{ background: '#eef2ff', color: '#3730a3', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Back to home
          </button>
        </div>

        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>You can save this application number for reference. If you need a printed copy, use the Download PDF button.</p>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
