import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResponsiveStyles } from '../utils/responsiveStyles';

// Use Vite env or fallback to local backend. Normalize common paste mistakes
const _rawApiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
let API_BASE = _rawApiBase;
try {
  // Extract the first http(s) URL if the value accidentally contains the URL twice
  const m = String(_rawApiBase).match(/https?:\/\/[^\s'"]+/i);
  if (m && m[0]) API_BASE = m[0];
  // Trim trailing slash for consistency
  API_BASE = API_BASE.replace(/\/$/, '');
} catch (e) {
  API_BASE = _rawApiBase;
}

import { FileText, Download, User, Phone, MapPin, Calendar, Users, GraduationCap, Printer } from 'lucide-react';

const HostelAdmissionForm = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    motherName: '',
    fatherName: '',
    mobile1: '',
    mobile2: '',
    village: '',
    post: '',
    policeStation: '',
    district: '',
    pinCode: '',
    dob: '',
    allowedPerson1: '',
    allowedPerson2: '',
    allowedPerson3: '',
    allowedPerson4: '',
    coaching1Name: '',
    coaching1Address: '',
    coaching2Name: '',
    coaching2Address: '',
    coaching3Name: '',
    coaching3Address: '',
    coaching4Name: '',
    coaching4Address: '',
    studentPhoto: null,
    parentPhoto: null,
    studentSignature: '',
    parentSignature: '',
    admissionDate: new Date().toISOString().split('T')[0]
  });

  const [showPreview, setShowPreview] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const editId = params.get('editId');

  // If editId present, load student data to edit
  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/students/${editId}`);
        if (!res.ok) throw new Error('Failed to load student');
        const payload = await res.json();
        // payload contains id and fields
        const data = payload;
        // Map known fields into formData shape
        setFormData(prev => ({
          ...prev,
          studentName: data.studentName || prev.studentName,
          motherName: data.motherName || prev.motherName,
          fatherName: data.fatherName || prev.fatherName,
          mobile1: data.mobile1 || prev.mobile1,
          mobile2: data.mobile2 || prev.mobile2,
          village: data.village || prev.village,
          post: data.post || prev.post,
          policeStation: data.policeStation || prev.policeStation,
          district: data.district || prev.district,
          pinCode: data.pinCode || prev.pinCode,
          dob: data.dob || prev.dob,
          allowedPerson1: data.allowedPerson1 || prev.allowedPerson1,
          allowedPerson2: data.allowedPerson2 || prev.allowedPerson2,
          allowedPerson3: data.allowedPerson3 || prev.allowedPerson3,
          allowedPerson4: data.allowedPerson4 || prev.allowedPerson4,
          coaching1Name: data.coaching1Name || prev.coaching1Name,
          coaching1Address: data.coaching1Address || prev.coaching1Address,
          coaching2Name: data.coaching2Name || prev.coaching2Name,
          coaching2Address: data.coaching2Address || prev.coaching2Address,
          coaching3Name: data.coaching3Name || prev.coaching3Name,
          coaching3Address: data.coaching3Address || prev.coaching3Address,
          coaching4Name: data.coaching4Name || prev.coaching4Name,
          coaching4Address: data.coaching4Address || prev.coaching4Address,
          studentPhoto: data.studentPhoto || prev.studentPhoto,
          parentPhoto: data.parentPhoto || prev.parentPhoto,
          studentSignature: data.studentSignature || prev.studentSignature,
          parentSignature: data.parentSignature || prev.parentSignature,
          admissionDate: data.admissionDate || prev.admissionDate,
        }));
      } catch (err) {
        console.error('Failed to load student for edit', err);
        alert('Failed to load student for editing');
      }
    };
    load();
  }, [editId]);

  // Base styles with mobile-first approach
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1rem 0.5rem',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", sans-serif',
      boxSizing: 'border-box',
      width: '100%',
      overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      padding: '0 0.75rem',
      boxSizing: 'border-box',
      '@media (max-width: 480px)': {
        padding: '0 0.5rem',
      },
    },
    card: {
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '1.25rem',
      marginBottom: '1rem',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'box-shadow 0.2s ease, transform 0.1s ease',
      ':hover': {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      '@media (min-width: 480px)': {
        padding: '1.5rem',
        borderRadius: '1rem',
      },
      '@media (min-width: 768px)': {
        padding: '2rem',
        marginBottom: '1.5rem',
      },
    },
    header: {
      textAlign: 'center',
      padding: '0.5rem 0 1rem',
      '@media (min-width: 480px)': {
        padding: '0.75rem 0 1.5rem',
      },
    },
    h1: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#db2777',
      margin: '0 0 0.25rem',
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
      '@media (min-width: 480px)': {
        fontSize: '1.75rem',
        marginBottom: '0.375rem',
      },
      '@media (min-width: 768px)': {
        fontSize: '2rem',
        marginBottom: '0.5rem',
      },
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#ec4899',
      margin: '0 0 0.5rem',
      lineHeight: '1.3',
      '@media (min-width: 480px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width: 768px)': {
        fontSize: '1.75rem',
      },
    },
    subtitle: {
      fontSize: '0.9375rem',
      color: '#4b5563',
      margin: '0 0 0.5rem',
      lineHeight: '1.5',
      '@media (min-width: 768px)': {
        fontSize: '1.1rem',
      },
    },
    formTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#9333ea',
      margin: '0.75rem 0 1rem',
      lineHeight: '1.3',
      '@media (min-width: 480px)': {
        fontSize: '1.35rem',
        margin: '1rem 0 1.25rem',
      },
      '@media (min-width: 768px)': {
        fontSize: '1.5rem',
        margin: '1.25rem 0 1.5rem',
      },
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#7c3aed',
      margin: '1.25rem 0 0.75rem',
      paddingBottom: '0.5rem',
      borderBottom: '2px solid #ede9fe',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem',
      position: 'relative',
      '@media (min-width: 480px)': {
        fontSize: '1.2rem',
        margin: '1.5rem 0 1rem',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-2px',
        left: '0',
        width: '4rem',
        height: '3px',
        background: '#8b5cf6',
        borderRadius: '3px',
      },
    },
    // Responsive grid system
    gridTwo: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1rem',
      marginBottom: '1.5rem',
      width: '100%',
      '@media (min-width: 480px)': {
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.25rem',
      },
      '@media (min-width: 768px)': {
        gap: '1.5rem',
        marginBottom: '1.75rem',
      },
    },
    // Form elements
    formGroup: {
      marginBottom: '1rem',
      width: '100%',
      position: 'relative',
      '@media (min-width: 480px)': {
        marginBottom: '1.25rem',
      },
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#4b5563',
      marginBottom: '0.5rem',
      lineHeight: '1.4',
      transition: 'color 0.2s ease',
      '@media (min-width: 480px)': {
        fontSize: '0.9375rem',
        marginBottom: '0.5625rem',
      },
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      lineHeight: '1.5',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
      minHeight: '3rem',
      '&:focus': {
        borderColor: '#8b5cf6',
        boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.1)',
      },
      '&::placeholder': {
        color: '#9ca3af',
        opacity: 1,
      },
      '@media (min-width: 480px)': {
        padding: '0.875rem 1.125rem',
        fontSize: '1.0625rem',
      },
    },
    fileInput: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '2px dashed #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      lineHeight: '1.5',
      backgroundColor: '#f9fafb',
      color: '#4b5563',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover, &:focus': {
        backgroundColor: '#f3f4f6',
        borderColor: '#9ca3af',
      },
      '&:focus': {
        outline: 'none',
        boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.1)',
        borderColor: '#8b5cf6',
      },
      '@media (min-width: 480px)': {
        padding: '1rem 1.25rem',
      },
    },
    photoPreview: {
      width: '100%',
      maxWidth: '180px',
      height: 'auto',
      maxHeight: '180px',
      objectFit: 'cover',
      borderRadius: '0.5rem',
      marginTop: '0.75rem',
      border: '2px solid #f3f4f6',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      '@media (min-width: 480px)': {
        maxWidth: '200px',
        maxHeight: '200px',
      },
    },
    coachingCard: {
      marginBottom: '1.25rem',
      padding: '1.25rem',
      background: '#f8fafc',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#c7d2fe',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      '@media (min-width: 480px)': {
        padding: '1.5rem',
      },
    },
    coachingTitle: {
      fontWeight: '600',
      color: '#4b5563',
      marginBottom: '1rem',
      fontSize: '1.05rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      '& svg': {
        color: '#8b5cf6',
      },
    },
    // Buttons
    button: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      color: 'white',
      padding: '0.875rem 2rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      fontSize: '1.0625rem',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3), 0 2px 4px -1px rgba(139, 92, 246, 0.1)',
      transition: 'all 0.2s ease',
      minHeight: '3.25rem',
      minWidth: '12rem',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3), 0 4px 6px -2px rgba(139, 92, 246, 0.1)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '&:disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
      '@media (max-width: 480px)': {
        width: '100%',
        padding: '0.875rem 1.5rem',
        fontSize: '1rem',
        minWidth: 'auto',
      },
    },
    buttonCenter: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem',
      flexWrap: 'wrap',
      gap: '1rem',
      '@media (min-width: 768px)': {
        marginTop: '2.5rem',
      },
    },
    // Print Preview Styles
    printContainer: {
      maxWidth: '900px',
      margin: '0 auto',
      background: 'white',
      padding: '1.5rem',
      boxSizing: 'border-box',
      fontSize: '0.8rem',
      lineHeight: '1.6',
      '@media print': {
        padding: '1rem',
        maxWidth: '100%',
      },
      '@media (max-width: 768px)': {
        padding: '1rem',
      },
    },
    printHeader: {
      textAlign: 'center',
      borderBottom: '2px solid #9ca3af',
      paddingBottom: '0.75rem',
      marginBottom: '1.25rem',
      '@media print': {
        paddingBottom: '0.5rem',
        marginBottom: '1rem',
      },
    },
    printH1: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#111827',
      margin: '0 0 0.25rem 0',
      lineHeight: '1.2',
      '@media (max-width: 480px)': {
        fontSize: '1.25rem',
      },
    },
    printH2: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#374151',
      margin: '0 0 0.25rem 0',
      lineHeight: '1.3',
      '@media (max-width: 480px)': {
        fontSize: '0.95rem',
      },
    },
    printSubtitle: {
      fontSize: '0.9rem',
      color: '#4b5563',
      margin: '0.25rem 0 0',
      lineHeight: '1.4',
      '@media (max-width: 480px)': {
        fontSize: '0.8rem',
      },
    },
    printFormTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      color: '#111827',
      margin: '0.75rem 0 0.5rem',
      paddingTop: '0.5rem',
      borderTop: '1px solid #e5e7eb',
      '@media (max-width: 480px)': {
        fontSize: '1rem',
        margin: '0.5rem 0',
      },
    },
    printDate: {
      fontSize: '0.8rem',
      color: '#6b7280',
      marginTop: '0.25rem',
      fontStyle: 'italic',
    },
    photoSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
      margin: '1.5rem 0',
      '@media (max-width: 480px)': {
        gap: '1rem',
      },
    },
    photoBox: {
      textAlign: 'center',
      padding: '0.75rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      '@media print': {
        padding: '0.5rem',
      },
    },
    photoLabel: {
      fontWeight: '600',
      marginBottom: '0.5rem',
      display: 'block',
      fontSize: '0.8rem',
      color: '#4b5563',
    },
    photoFrame: {
      border: '1px solid #e5e7eb',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '0.25rem',
      overflow: 'hidden',
      '@media print': {
        height: '90px',
      },
    },
    photoImg: {
      maxHeight: '100%',
      maxWidth: '100%',
      objectFit: 'contain',
    },
    printSectionTitle: {
      fontSize: '0.9rem',
      fontWeight: '600',
      background: '#f3f4f6',
      padding: '0.5rem 0.75rem',
      margin: '1.25rem 0 0.75rem',
      borderRadius: '0.375rem',
      borderLeft: '3px solid #8b5cf6',
      '@media print': {
        background: 'transparent',
        borderLeft: 'none',
        borderBottom: '1px solid #e5e7eb',
        paddingLeft: '0',
      },
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '0.5rem',
      fontSize: '0.8rem',
      marginBottom: '0.75rem',
      '@media (min-width: 480px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem 1.5rem',
      },
      '@media print': {
        fontSize: '0.75rem',
      },
    },
    infoGridFull: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '0.5rem',
      fontSize: '0.8rem',
      marginBottom: '0.75rem',
      '@media print': {
        fontSize: '0.75rem',
      },
    },
    infoLabel: {
      fontWeight: '600',
      color: '#4b5563',
      whiteSpace: 'nowrap',
      '@media print': {
        fontWeight: '500',
      },
    },
    signatureSection: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
      margin: '2rem 0 1rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #e5e7eb',
      '@media (min-width: 480px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem',
      },
      '@media print': {
        margin: '1.5rem 0 0.5rem',
      },
    },
    signatureBox: {
      textAlign: 'center',
      padding: '0.5rem',
    },
    signatureLine: {
      borderTop: '1px solid #9ca3af',
      paddingTop: '0.75rem',
      marginTop: '2.5rem',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80px',
        height: '2px',
        backgroundColor: '#9ca3af',
      },
      '@media print': {
        marginTop: '2rem',
      },
    },
    signatureName: {
      fontWeight: '600',
      marginBottom: '0.25rem',
      fontSize: '0.85rem',
      color: '#111827',
    },
    signatureLabel: {
      fontSize: '0.75rem',
      color: '#6b7280',
    },
    rulesSection: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '1.5rem',
      marginTop: '1.5rem',
    },
    rulesTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      textAlign: 'center',
      margin: '0 0 1rem',
      color: '#4b5563',
      position: 'relative',
      '&::after': {
        content: '""',
        display: 'block',
        width: '60px',
        height: '3px',
        background: '#8b5cf6',
        margin: '0.5rem auto 0',
        borderRadius: '3px',
      },
    },
    backButton: {
      background: '#4b5563',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: '500',
      fontSize: '0.9375rem',
      border: 'none',
      cursor: 'pointer',
      marginTop: '1.5rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: '#374151',
        transform: 'translateY(-1px)',
      },
      '@media (max-width: 480px)': {
        width: '100%',
        justifyContent: 'center',
        padding: '0.875rem 1rem',
      },
    },
  };

  // Apply responsive styles
  const responsiveStyles = useResponsiveStyles(styles);

  // Helper to format date values to DD-MM-YYYY for display
  const formatDate = (val) => {
    if (!val) return '';
    try {
      // Handle 'YYYY-MM-DD' safely to avoid timezone shifts
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [yyyy, mm, dd] = val.split('-');
        return `${dd}-${mm}-${yyyy}`;
      }
      // Accept Date object or full ISO strings with time
      const date = val instanceof Date ? val : new Date(val);
      if (isNaN(date)) return val;
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch (err) {
      return val;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          [name]: event.target.result
        }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const generatePDF = () => {
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // Update existing student
        const res = await fetch(`${API_BASE}/api/students/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, updatedAt: new Date().toISOString() })
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error('Failed to update student', errText);
          alert('Failed to update student. See console for details.');
          return;
        }
        alert('Record updated successfully');
        // After editing, go back to admin dashboard
        navigate('/admin/dashboard');
        return;
      }

      // New submission: Add status as pending
      const formDataWithStatus = {
        ...formData,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      // POST form data to backend API
      const res = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataWithStatus)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed to save student', errText);
        alert('Failed to save student. See console for details.');
        return;
      }
      const payload = await res.json();
      // Show success message
      alert('Form submitted successfully! Waiting for admin approval.');
      setShowPreview(true);
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (err) {
      console.error('Submit error', err);
      alert('An error occurred while saving. See console for details.');
    }
  };

  if (showPreview) {
    return (
      <div className="print-content">
        <style>{`
          @media print {
            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body, html {
                margin: 0;
                padding: 0;
            }
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
                page-break-before: always;
            }
          }
        `}</style>

        {/* PAGE 1: ADMISSION FORM */}
        <div style={responsiveStyles.printContainer}>
          {/* Header */}
        </div>

        {/* Photos Section */}
        <div style={responsiveStyles.photoSection}>
          <div style={responsiveStyles.photoBox}>
            <span style={responsiveStyles.photoLabel}>पिता/माता का फोटो / Parent Photo</span>
            <div style={responsiveStyles.photoPreview}>
              {formData.parentPhoto ? (
                <img src={formData.parentPhoto} alt="Parent" style={responsiveStyles.photoImg} />
              ) : (
                <User size={35} color="#9ca3af" />
              )}
            </div>
          </div>
          <div style={responsiveStyles.photoBox}>
            <span style={responsiveStyles.photoLabel}>छात्रा का फोटो / Student Photo</span>
            <div style={responsiveStyles.photoPreview}>
              {formData.studentPhoto ? (
                <img src={formData.studentPhoto} alt="Student" style={responsiveStyles.photoImg} />
              ) : (
                <User size={35} color="#9ca3af" />
              )}
            </div>
          </div>
        </div>

        {/* ... */}

        <div style={{ ...responsiveStyles.signatureSection, marginTop: '2.5rem' }}>
          <div style={responsiveStyles.signatureBox}>
            <div style={{ borderTop: '2px solid #9ca3af', paddingTop: '0.5rem', minHeight: '50px' }}>
              <p style={{ ...responsiveStyles.signatureName, fontSize: '0.8rem' }}>{formData.parentSignature}</p>
              <p style={{ ...responsiveStyles.signatureLabel, fontSize: '0.65rem' }}>पिता / माता का हस्ताक्षर</p>
            </div>
          </div>
          <div style={responsiveStyles.signatureBox}>
            <div style={{ borderTop: '2px solid #9ca3af', paddingTop: '0.5rem', minHeight: '50px' }}>
              <p style={{ ...responsiveStyles.signatureName, fontSize: '0.8rem' }}>{formData.studentSignature}</p>
              <p style={{ ...responsiveStyles.signatureLabel, fontSize: '0.65rem' }}>छात्रा का हस्ताक्षर</p>
            </div>
          </div>
        </div>
      </div>
     );
    }
  }

// Function to render form fields
const renderFormField = (name, label, type = 'text', required = false) => (
  <div style={responsiveStyles.formGroup}>
    <label style={responsiveStyles.label}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={formData[name] || ''}
      onChange={handleInputChange}
      style={responsiveStyles.input}
      required={required}
    />
  </div>
);

return (
  <div style={responsiveStyles.container}>
    <div style={responsiveStyles.maxWidth}>
      {/* Header */}
      <div style={responsiveStyles.card}>
        <div style={responsiveStyles.header}>
          <h1 style={responsiveStyles.h1}>आतिया गर्ल्स हॉस्टल</h1>
          <h2 style={responsiveStyles.h2}>ATIYA GIRLS HOSTEL</h2>
          <p style={responsiveStyles.subtitle}>रामपाड़ा कटिहार / Rampada Katihar</p>
          <p style={responsiveStyles.formTitle}>नामांकन फॉर्म / ADMISSION FORM</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={responsiveStyles.card}>
        {/* Photo Upload Section */}
        {/* ... */}
        <div style={responsiveStyles.gridTwo}>
          <div style={responsiveStyles.formGroup}>
            <label style={responsiveStyles.label}>
              <User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              पिता/माता का फोटो / Parent Photo
            </label>
            <input
              type="file"
              name="parentPhoto"
              accept="image/*"
              onChange={handleFileChange}
              style={responsiveStyles.fileInput}
            />
            {formData.parentPhoto && (
              <img src={formData.parentPhoto} alt="Parent" style={responsiveStyles.photoPreview} />
            )}
          </div>
          <div style={responsiveStyles.formGroup}>
            <label style={responsiveStyles.label}>
              <User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              छात्रा का फोटो / Student Photo
            </label>
            <input
              type="file"
              name="studentPhoto"
              accept="image/*"
              onChange={handleFileChange}
              style={responsiveStyles.fileInput}
            />
            {formData.studentPhoto && (
              <img src={formData.studentPhoto} alt="Student" style={responsiveStyles.photoPreview} />
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 style={responsiveStyles.sectionTitle}>
            व्यक्तिगत जानकारी / Personal Information
          </h3>
          <div style={responsiveStyles.gridTwo}>
            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                छात्रा का नाम / Student Name *
              </label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
                placeholder="Enter student name"
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                माता का नाम / Mother's Name *
              </label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
                placeholder="Enter mother's name"
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                पिता का नाम / Father's Name *
              </label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
                placeholder="Enter father's name"
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                जन्म तिथि / Date of Birth *
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 style={responsiveStyles.sectionTitle}>
            <Phone size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            संपर्क जानकारी / Contact Information
          </h3>
          <div style={responsiveStyles.gridTwo}>
            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                मोबाइल नं (1) / Mobile No. (1) *
              </label>
              <input
                type="tel"
                name="mobile1"
                value={formData.mobile1}
                onChange={handleInputChange}
                required
                pattern="[0-9]{10}"
                style={responsiveStyles.input}
                placeholder="10-digit mobile number"
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                मोबाइल नं (2) / Mobile No. (2)
              </label>
              <input
                type="tel"
                name="mobile2"
                value={formData.mobile2}
                onChange={handleInputChange}
                pattern="[0-9]{10}"
                style={responsiveStyles.input}
                placeholder="10-digit mobile number (optional)"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 style={responsiveStyles.sectionTitle}>
            <MapPin size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            स्थायी पता / Permanent Address
          </h3>
          <div style={responsiveStyles.gridTwo}>
            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                ग्राम / Village *
              </label>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                पोस्ट / Post *
              </label>
              <input
                type="text"
                name="post"
                value={formData.post}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                थाना / Police Station *
              </label>
              <input
                type="text"
                name="policeStation"
                value={formData.policeStation}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                जिला / District *
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
              />
            </div>

            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                पिन कोड / PIN Code *
              </label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleInputChange}
                required
                pattern="[0-9]{6}"
                style={responsiveStyles.input}
                placeholder="6-digit PIN code"
              />
            </div>
          </div>
        </div>

        {/* Allowed Visitors */}
        <div>
          <h3 style={responsiveStyles.sectionTitle}>
            <Users size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            छात्रा से मिलने वाले का नाम / Names of Persons Allowed to Meet
          </h3>
          <div style={responsiveStyles.gridTwo}>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} style={responsiveStyles.formGroup}>
                <label style={responsiveStyles.label}>
                  व्यक्ति {num} / Person {num}
                </label>
                <input
                  type="text"
                  name={`allowedPerson${num}`}
                  value={formData[`allowedPerson${num}`]}
                  onChange={handleInputChange}
                  style={responsiveStyles.input}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Coaching Details */}
        <div>
          <h3 style={responsiveStyles.sectionTitle}>
            <GraduationCap size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            कोचिंग विवरण / Coaching Details
          </h3>
          {[1, 2, 3, 4].map((num) => (
            <div key={num} style={responsiveStyles.coachingCard}>
              <p style={responsiveStyles.coachingTitle}>कोचिंग {num} / Coaching {num}</p>
              <div style={responsiveStyles.gridTwo}>
                <div style={responsiveStyles.formGroup}>
                  <label style={responsiveStyles.label}>
                    नाम एवं समय / Name & Time
                  </label>
                  <input
                    type="text"
                    name={`coaching${num}Name`}
                    value={formData[`coaching${num}Name`]}
                    onChange={handleInputChange}
                    style={responsiveStyles.input}
                  />
                </div>
                <div style={responsiveStyles.formGroup}>
                  <label style={responsiveStyles.label}>
                    पता / Address
                  </label>
                  <input
                    type="text"
                    name={`coaching${num}Address`}
                    value={formData[`coaching${num}Address`]}
                    onChange={handleInputChange}
                    style={responsiveStyles.input}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Signatures */}
        <div>
          <h3 style={responsiveStyles.sectionTitle}>
            हस्ताक्षर / Signatures
          </h3>
          <div style={responsiveStyles.gridTwo}>
            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                छात्रा का हस्ताक्षर / Student Signature *
              </label>
              <input
                type="text"
                name="studentSignature"
                value={formData.studentSignature}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
                placeholder="Type name as signature"
              />
            </div>
            <div style={responsiveStyles.formGroup}>
              <label style={responsiveStyles.label}>
                पिता/माता का हस्ताक्षर / Parent Signature *
              </label>
              <input
                type="text"
                name="parentSignature"
                value={formData.parentSignature}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
                placeholder="Type name as signature"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={responsiveStyles.buttonCenter}>
          <button
            type="submit"
            style={responsiveStyles.button}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Printer size={24} />
            Generate PDF / पीडीएफ बनाएं
          </button>
        </div>
      </form>

      {/* Rules Section for Display (always shown in Hindi) */}
      <div style={{ ...responsiveStyles.card, marginTop: '1rem' }} className="no-print">
        <h3 style={{ ...responsiveStyles.rulesTitle, fontSize: '1.5rem', color: '#9333ea', marginBottom: '1rem' }}>हॉस्टल नियम एवं शर्तें</h3>
        <div style={{ fontSize: '0.875rem', lineHeight: '1.8', textAlign: 'justify' }}>
          <p><strong>1.</strong> हॉस्टल से बाहर निकलने और वापस आने पर हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है।</p>
          <p><strong>2.</strong> कोचिंग के समय से 30 मिनट पूर्व कोचिंग के लिए निकलना और कोचिंग समाप्ति के 30 मिनट के भीतर वापस आना अनिवार्य है।</p>
          <p><strong>3.</strong> छात्रा अपनी जगह की साफ-सफाई की जिम्मेदार है।</p>
          <p><strong>4.</strong> कमरे से बाहर निकलते समय पंखे और लाइटें बंद करना अनिवार्य है; ऐसा न करने पर ₹50 का जुर्माना लगेगा।</p>
          <p><strong>5.</strong> यदि छात्रा परिसर से बाहर जाने के बाद भाग जाती है तो हॉस्टल जिम्मेदार नहीं होगा।</p>
          <p><strong>6.</strong> हॉस्टल की फीस प्रत्येक माह की 1 तारिख से 5 तारिख के बीच जमा करना अनिवार्य है।</p>
          <p><strong>7.</strong> अभिभावकों से अनुरोध है कि वे अपने बच्चे से केवल रविवार को मिलें; मिलने वालों में माता-पिता और भाई-बहन ही शामिल होंगे।</p>
          <p><strong>8.</strong> किसी भी विज़िट से पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है; विज़िटर्स को आवासीय क्षेत्रों में प्रवेश की अनुमति नहीं होगी।</p>
          <p><strong>9.</strong> खिड़कियों के पास खड़ा होना सख्त मना है।</p>
          <p><strong>10.</strong> खिड़की से कोई भी वस्तु बाहर न फेंके; उपलब्ध कचरा डिब्बे का प्रयोग करें।</p>
          <p><strong>11.</strong> छात्राओं को पढ़ाई पर ध्यान केंद्रित करना आवश्यक है।</p>
          <p><strong>12.</strong> किसी भी समस्या या शिकायत की सूचना सीधे हॉस्टल इंचार्ज को दें।</p>
          <p><strong>13.</strong> हॉस्टल खाली करने के लिए एक महीने का नोटिस देना अनिवार्य है; अन्यथा अगले माह का शुल्क लिया जाएगा।</p>
        </div>
      </div>
    </div>
  </div>
);

export default HostelAdmissionForm;