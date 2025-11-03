import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResponsiveStyles } from '../utils/responsiveStyles';
import { FileText, Download, User, Phone, MapPin, Calendar, Users, GraduationCap, Printer, ChevronLeft } from 'lucide-react';

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

  const baseStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
      width: '100%',
      '@media (min-width: 768px)': {
        padding: '1.5rem',
      },
      '@media (min-width: 1024px)': {
        padding: '2rem',
      },
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    },
    card: {
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '1rem',
      marginBottom: '1rem',
      '@media (min-width: 640px)': {
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
      },
    },
    header: {
      textAlign: 'center',
      marginBottom: '1rem',
      '@media (min-width: 768px)': {
        marginBottom: '1.5rem',
      },
    },
    h1: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#db2777',
      margin: '0 0 0.5rem 0',
      lineHeight: '1.2',
      '@media (min-width: 640px)': {
        fontSize: '2rem',
      },
      '@media (min-width: 1024px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#ec4899',
      margin: '0 0 0.5rem 0',
      lineHeight: '1.3',
      '@media (min-width: 640px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width: 1024px)': {
        fontSize: '2rem',
      },
    },
    subtitle: {
      fontSize: '0.875rem',
      color: '#4b5563',
      margin: '0 0 0.5rem 0',
      lineHeight: '1.5',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
      },
      '@media (min-width: 1024px)': {
        fontSize: '1.25rem',
      },
    },
    formTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#9333ea',
      margin: '1rem 0 0.75rem',
      '@media (min-width: 640px)': {
        fontSize: '1.375rem',
        margin: '1.25rem 0 1rem',
      },
      '@media (min-width: 1024px)': {
        fontSize: '1.5rem',
        margin: '1.5rem 0 1.25rem',
      },
    },
    sectionTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#9333ea',
      margin: '1.5rem 0 1rem',
      paddingBottom: '0.5rem',
      borderBottom: '2px solid #f3e8ff',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      '@media (min-width: 640px)': {
        fontSize: '1.25rem',
        margin: '1.75rem 0 1.25rem',
      },
    },
    gridTwo: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1rem',
      marginBottom: '1.5rem',
      '@media (min-width: 640px)': {
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
      },
      '@media (min-width: 1024px)': {
        gap: '1.5rem',
        marginBottom: '2rem',
      },
    },
    formGroup: {
      marginBottom: '0.75rem',
      '@media (min-width: 640px)': {
        marginBottom: '1rem',
      },
    },
    label: {
      display: 'block',
      fontSize: '0.8125rem',
      fontWeight: '500',
      color: '#4b5563',
      marginBottom: '0.375rem',
      '@media (min-width: 640px)': {
        fontSize: '0.875rem',
        marginBottom: '0.5rem',
      },
    },
    input: {
      width: '100%',
      padding: '0.625rem 0.875rem',
      border: '2px solid #f3e8ff',
      borderRadius: '0.5rem',
      fontSize: '0.9375rem',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
      backgroundColor: '#f9fafb',
      '::placeholder': {
        color: '#9ca3af',
      },
      ':focus': {
        borderColor: '#c084fc',
        boxShadow: '0 0 0 3px rgba(192, 132, 252, 0.2)',
        backgroundColor: 'white',
      },
      '@media (min-width: 640px)': {
        padding: '0.75rem 1rem',
        fontSize: '1rem',
      },
    },
    fileInput: {
      width: '100%',
      padding: '0.5rem',
      border: '2px dashed #e9d5ff',
      borderRadius: '0.5rem',
      fontSize: '0.8125rem',
      backgroundColor: '#f9fafb',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '::file-selector-button': {
        padding: '0.375rem 0.75rem',
        marginRight: '0.75rem',
        borderRadius: '0.375rem',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f3f4f6',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: '#e5e7eb',
        },
      },
      ':hover': {
        borderColor: '#c084fc',
        backgroundColor: 'white',
      },
      '@media (min-width: 640px)': {
        fontSize: '0.875rem',
      },
    },
    photoPreviewContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.5rem',
      marginTop: '0.5rem',
    },
    photoPreview: {
      width: '100px',
      height: '100px',
      objectFit: 'cover',
      borderRadius: '0.5rem',
      border: '2px solid #f3e8ff',
      '@media (min-width: 480px)': {
        width: '120px',
        height: '120px',
      },
      '@media (min-width: 640px)': {
        width: '140px',
        height: '140px',
      },
    },
    coachingCard: {
      marginBottom: '1rem',
      padding: '0.75rem',
      background: '#faf5ff',
      borderRadius: '0.5rem',
      border: '1px solid #f3e8ff',
      '@media (min-width: 640px)': {
        padding: '1rem',
        marginBottom: '1.25rem',
      },
    },
    coachingTitle: {
      fontWeight: '600',
      color: '#6b21a8',
      marginBottom: '0.5rem',
      fontSize: '0.9375rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
        marginBottom: '0.75rem',
      },
    },
    button: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      fontSize: '0.9375rem',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
      minWidth: '120px',
      minHeight: '44px',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
      ':disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
      '@media (min-width: 640px)': {
        padding: '0.875rem 2rem',
        fontSize: '1rem',
        minWidth: '140px',
      },
      '@media (min-width: 1024px)': {
        padding: '1rem 3rem',
        fontSize: '1.125rem',
      },
    },
    buttonSecondary: {
      background: 'white',
      color: '#6b21a8',
      border: '2px solid #e9d5ff',
      ':hover': {
        background: '#f9f5ff',
        borderColor: '#d8b4fe',
      },
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      marginTop: '1.5rem',
      '@media (min-width: 480px)': {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: '1rem',
      },
      '@media (min-width: 768px)': {
        marginTop: '2rem',
        gap: '1.5rem',
      },
    },
    buttonCenter: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '1.5rem',
      '@media (min-width: 768px)': {
        marginTop: '2rem',
      },
    },
    // Print Preview Styles
    printContainer: {
      maxWidth: '900px',
      margin: '0 auto',
      background: 'white',
      padding: '1rem',
      boxSizing: 'border-box',
      fontSize: '0.75rem',
      '@media print': {
        padding: '1.5rem',
        fontSize: '0.75rem',
      },
    },
    printHeader: {
      textAlign: 'center',
      borderBottom: '2px solid #9ca3af',
      paddingBottom: '0.5rem',
      marginBottom: '1rem',
      '@media print': {
        borderBottomWidth: '3px',
      },
    },
    printH1: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 0.25rem 0',
      '@media print': {
        fontSize: '1.5rem',
      },
    },
    printH2: {
      fontSize: '0.9375rem',
      fontWeight: 'bold',
      color: '#374151',
      margin: '0 0 0.25rem 0',
      '@media print': {
        fontSize: '1rem',
      },
    },
    printSubtitle: {
      fontSize: '0.75rem',
      color: '#374151',
      margin: '0',
      '@media print': {
        fontSize: '0.875rem',
      },
    },
    printFormTitle: {
      fontSize: '0.9375rem',
      fontWeight: '700',
      color: '#111827',
      margin: '0.5rem 0 0.25rem',
      '@media print': {
        fontSize: '1rem',
        marginTop: '0.75rem',
      },
    },
    printDate: {
      fontSize: '0.6875rem',
      color: '#6b7280',
      marginTop: '0.25rem',
      '@media print': {
        fontSize: '0.75rem',
      },
    },
    photoSection: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1rem',
      margin: '1rem 0',
      '@media (min-width: 480px)': {
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
      },
      '@media print': {
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        margin: '1rem 0',
      },
    },
    photoBox: {
      textAlign: 'center',
      margin: '0.5rem 0',
    },
    photoLabel: {
      fontWeight: '600',
      marginBottom: '0.25rem',
      display: 'block',
      fontSize: '0.75rem',
      '@media print': {
        fontSize: '0.75rem',
      },
    },
    photoFrame: {
      border: '1px solid #e5e7eb',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '0.375rem',
      '@media print': {
        height: '100px',
      },
    },
    photoImg: {
      maxHeight: '100%',
      maxWidth: '100%',
      objectFit: 'contain',
    },
    printSectionTitle: {
      fontSize: '0.8125rem',
      fontWeight: 'bold',
      background: '#f3e8ff',
      padding: '0.25rem 0.5rem',
      margin: '0.75rem 0 0.5rem',
      borderRadius: '0.25rem',
      '@media print': {
        fontSize: '0.85rem',
        margin: '0.5rem 0',
      },
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '0.25rem',
      fontSize: '0.6875rem',
      marginBottom: '0.5rem',
      '@media (min-width: 480px)': {
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem 1rem',
      },
      '@media print': {
        gridTemplateColumns: '1fr 1fr',
        fontSize: '0.7rem',
        gap: '0.25rem 1rem',
      },
    },
    infoGridFull: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '0.25rem',
      fontSize: '0.6875rem',
      marginBottom: '0.5rem',
      '@media print': {
        fontSize: '0.7rem',
      },
    },
    infoLabel: {
      fontWeight: '600',
      color: '#4b5563',
    },
    signatureSection: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
      margin: '1.5rem 0 0.5rem',
      '@media (min-width: 480px)': {
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
      },
      '@media print': {
        gridTemplateColumns: '1fr 1fr',
        margin: '1rem 0 0.5rem',
      },
    },
    signatureBox: {
      textAlign: 'center',
      marginTop: '1rem',
    },
    signatureLine: {
      borderTop: '1px solid #9ca3af',
      paddingTop: '0.5rem',
      marginTop: '2rem',
      '@media print': {
        marginTop: '1.5rem',
      },
    },
    signatureName: {
      fontWeight: '600',
      marginBottom: '0.25rem',
      fontSize: '0.75rem',
      '@media print': {
        fontSize: '0.8rem',
      },
    },
    signatureLabel: {
      fontSize: '0.6875rem',
      color: '#6b7280',
      '@media print': {
        fontSize: '0.7rem',
      },
    },
    rulesSection: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '1rem',
      marginTop: '1.5rem',
      '@media print': {
        borderTop: 'none',
        paddingTop: '0.5rem',
        marginTop: '1rem',
      },
    },
    rulesTitle: {
      fontSize: '1rem',
      fontWeight: 'bold',
      textAlign: 'center',
      margin: '1rem 0 0.75rem',
      color: '#6b21a8',
      '@media print': {
        fontSize: '1.25rem',
        margin: '0.5rem 0 0.75rem',
      },
    },
    backButton: {
      background: '#4b5563',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      margin: '1.5rem 0 0',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#374151',
      },
      '@media (min-width: 640px)': {
        padding: '0.75rem 2rem',
        marginTop: '2rem',
      },
    },
    // Responsive adjustments for form sections
    formSection: {
      marginBottom: '1.5rem',
      '@media (min-width: 640px)': {
        marginBottom: '2rem',
      },
    },
    // Helper classes
    textCenter: {
      textAlign: 'center',
    },
    mb2: {
      marginBottom: '0.5rem',
    },
    mb4: {
      marginBottom: '1rem',
    },
    mb6: {
      marginBottom: '1.5rem',
    },
    mt2: {
      marginTop: '0.5rem',
    },
    mt4: {
      marginTop: '1rem',
    },
    mt6: {
      marginTop: '1.5rem',
    },
    fullWidth: {
      width: '100%',
    },
    // Responsive utility classes
    '@media (max-width: 639px)': {
      hideOnMobile: {
        display: 'none',
      },
    },
    '@media (min-width: 1024px)': {
      container: {
        padding: '2rem',
      },
    },
  };

  // Apply responsive styles
  const styles = useResponsiveStyles(baseStyles);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Handle 'YYYY-MM-DD' safely to avoid timezone shifts
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [yyyy, mm, dd] = dateString.split('-');
        return `${dd}-${mm}-${yyyy}`;
      }
      // Accept Date object or full ISO strings with time
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date)) return dateString;
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
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
        <div style={styles.printContainer}>
          {/* Header */}
          <div style={styles.printHeader}>
            <h1 style={styles.printH1}>आतिया गर्ल्स हॉस्टल</h1>
            <h2 style={styles.printH2}>ATIYA GIRLS HOSTEL</h2>
            <p style={styles.printSubtitle}>रामपाड़ा कटिहार / Rampada Katihar</p>
            <p style={styles.printFormTitle}>नामांकन फॉर्म / ADMISSION FORM</p>
            <p style={styles.printDate}>दिनांक / Date: {formatDate(formData.admissionDate)}</p>
          </div>

          {/* Photos Section */}
          <div style={styles.photoSection}>
            <div style={styles.photoBox}>
              <span style={styles.photoLabel}>पिता/माता का फोटो / Parent Photo</span>
              <div style={styles.photoFrame}>
                {formData.parentPhoto ? (
                  <img src={formData.parentPhoto} alt="Parent" style={styles.photoImg} />
                ) : (
                  <User size={35} color="#9ca3af" />
                )}
              </div>
            </div>
            <div style={styles.photoBox}>
              <span style={styles.photoLabel}>छात्रा का फोटो / Student Photo</span>
              <div style={styles.photoFrame}>
                {formData.studentPhoto ? (
                  <img src={formData.studentPhoto} alt="Student" style={styles.photoImg} />
                ) : (
                  <User size={35} color="#9ca3af" />
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 style={styles.printSectionTitle}>व्यक्तिगत जानकारी / Personal Information</h3>
            <div style={styles.infoGrid}>
              <div><span style={styles.infoLabel}>छात्रा का नाम:</span> {formData.studentName}</div>
              <div><span style={styles.infoLabel}>माता का नाम:</span> {formData.motherName}</div>
              <div><span style={styles.infoLabel}>पिता का नाम:</span> {formData.fatherName}</div>
              <div><span style={styles.infoLabel}>जन्म तिथि:</span> {formData.dob}</div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 style={styles.printSectionTitle}>संपर्क जानकारी / Contact Information</h3>
            <div style={styles.infoGrid}>
              <div><span style={styles.infoLabel}>मोबाइल नं (1):</span> {formData.mobile1}</div>
              <div><span style={styles.infoLabel}>मोबाइल नं (2):</span> {formData.mobile2 || 'N/A'}</div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 style={styles.printSectionTitle}>स्थायी पता / Permanent Address</h3>
            <div style={styles.infoGrid}>
              <div><span style={styles.infoLabel}>ग्राम:</span> {formData.village}</div>
              <div><span style={styles.infoLabel}>पोस्ट:</span> {formData.post}</div>
              <div><span style={styles.infoLabel}>थाना:</span> {formData.policeStation}</div>
              <div><span style={styles.infoLabel}>जिला:</span> {formData.district}</div>
              <div><span style={styles.infoLabel}>पिन कोड:</span> {formData.pinCode}</div>
            </div>
          </div>

          {/* Allowed Visitors */}
          <div>
            <h3 style={styles.printSectionTitle}>छात्रा से मिलने वाले का नाम / Allowed Visitors</h3>
            <div style={styles.infoGrid}>
              {[1, 2, 3, 4].map((num) => (
                formData[`allowedPerson${num}`] && (
                  <div key={num}>
                    <span style={styles.infoLabel}>व्यक्ति {num}:</span> {formData[`allowedPerson${num}`]}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Coaching Details */}
          <div>
            <h3 style={styles.printSectionTitle}>कोचिंग विवरण / Coaching Details</h3>
            <div style={styles.infoGridFull}>
              {[1, 2, 3, 4].map((num) => (
                (formData[`coaching${num}Name`] || formData[`coaching${num}Address`]) && (
                  <div key={num} style={{marginBottom: '1rem'}}>
                    <div><strong>Coaching {num}:</strong> {formData[`coaching${num}Name`] || ''}</div>
                    <div>{formData[`coaching${num}Address`] || ''}</div>
                  </div>
                )
              ))}
            </div>

        {/* Photos Section */}
        <div style={styles.photoSection}>
          <div style={styles.photoBox}>
            <span style={styles.photoLabel}>पिता/माता का फोटो / Parent Photo</span>
            <div style={styles.photoFrame}>
              {formData.parentPhoto ? (
                <img src={formData.parentPhoto} alt="Parent" style={styles.photoImg} />
              ) : (
                <User size={35} color="#9ca3af" />
              )}
            </div>
          </div>
          <div style={styles.photoBox}>
            <span style={styles.photoLabel}>छात्रा का फोटो / Student Photo</span>
            <div style={styles.photoFrame}>
              {formData.studentPhoto ? (
                <img src={formData.studentPhoto} alt="Student" style={styles.photoImg} />
              ) : (
                <User size={35} color="#9ca3af" />
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 style={styles.printSectionTitle}>व्यक्तिगत जानकारी / Personal Information</h3>
          <div style={styles.infoGrid}>
            <div><span style={styles.infoLabel}>छात्रा का नाम:</span> {formData.studentName}</div>
            <div><span style={styles.infoLabel}>माता का नाम:</span> {formData.motherName}</div>
            <div><span style={styles.infoLabel}>पिता का नाम:</span> {formData.fatherName}</div>
            <div><span style={styles.infoLabel}>जन्म तिथि:</span> {formData.dob}</div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 style={styles.printSectionTitle}>संपर्क जानकारी / Contact Information</h3>
          <div style={styles.infoGrid}>
            <div><span style={styles.infoLabel}>मोबाइल नं (1):</span> {formData.mobile1}</div>
            <div><span style={styles.infoLabel}>मोबाइल नं (2):</span> {formData.mobile2 || 'N/A'}</div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 style={styles.printSectionTitle}>स्थायी पता / Permanent Address</h3>
          <div style={styles.infoGrid}>
            <div><span style={styles.infoLabel}>ग्राम:</span> {formData.village}</div>
            <div><span style={styles.infoLabel}>पोस्ट:</span> {formData.post}</div>
            <div><span style={styles.infoLabel}>थाना:</span> {formData.policeStation}</div>
            <div><span style={styles.infoLabel}>जिला:</span> {formData.district}</div>
            <div><span style={styles.infoLabel}>पिन कोड:</span> {formData.pinCode}</div>
          </div>
        </div>

        {/* Allowed Visitors */}
        <div>
          <h3 style={styles.printSectionTitle}>छात्रा से मिलने वाले का नाम / Allowed Visitors</h3>
          <div style={styles.infoGrid}>
            {[1, 2, 3, 4].map((num) => (
              formData[`allowedPerson${num}`] && (
                <div key={num}>
                  <span style={styles.infoLabel}>व्यक्ति {num}:</span> {formData[`allowedPerson${num}`]}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Coaching Details */}
        <div>
          <h3 style={styles.printSectionTitle}>कोचिंग विवरण / Coaching Details</h3>
          <div style={styles.infoGridFull}>
            {[1, 2, 3, 4].map((num) => (
              (formData[`coaching${num}Name`] || formData[`coaching${num}Address`]) && (
                <div key={num} style={{borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', marginBottom: '0.25rem'}}>
                  <span style={styles.infoLabel}>कोचिंग {num}:</span>
                  <div style={{marginLeft: '1rem', fontSize: '0.65rem'}}>
                    {formData[`coaching${num}Name`] && <div>नाम एवं समय: {formData[`coaching${num}Name`]}</div>}
                    {formData[`coaching${num}Address`] && <div>पता: {formData[`coaching${num}Address`]}</div>}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Signatures on Page 1 */}
        <div style={styles.signatureSection}>
          <div style={styles.signatureBox}>
            <div style={styles.signatureLine}>
              <p style={styles.signatureName}>{formData.studentSignature}</p>
              <p style={styles.signatureLabel}>छात्रा का हस्ताक्षर / Student Signature</p>
            </div>
          </div>
          <div style={styles.signatureBox}>
            <div style={styles.signatureLine}>
              <p style={styles.signatureName}>{formData.parentSignature}</p>
              <p style={styles.signatureLabel}>पिता/माता का हस्ताक्षर / Parent Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2: AFFIDAVIT (शपथ पत्र) */}
      <div className="page-break" style={{...styles.printContainer, paddingTop: '1.5rem'}}>
          <div style={styles.rulesSection}>
            <h3 style={styles.rulesTitle}>शपथ पत्र</h3>
            
            <div style={{fontSize: '0.75rem', lineHeight: '1.5', marginBottom: '1rem', textAlign: 'justify'}}>
              <p style={{marginBottom: '0.75rem'}}>
                मैं <u style={{display: 'inline-block', minWidth: '120px', textAlign: 'center', borderBottom: '1px solid black', padding: '0 3px'}}>{formData.parentSignature || ''}</u> अपनी पुत्री / बहन <u style={{display: 'inline-block', minWidth: '120px', textAlign: 'center', borderBottom: '1px solid black', padding: '0 3px'}}>{formData.studentName || ''}</u> ग्राम <u style={{display: 'inline-block', minWidth: '80px', textAlign: 'center', borderBottom: '1px solid black', padding: '0 3px'}}>{formData.village || ''}</u> पो॰<u style={{display: 'inline-block', minWidth: '60px', textAlign: 'center', borderBottom: '1px solid black', padding: '0 3px'}}>{formData.post || ''}</u>
              </p>
              <p style={{marginBottom: '0.75rem'}}>
                थाना <u style={{display: 'inline-block', minWidth: '80px', textAlign: 'center', borderBottom: '1px solid black', padding: '0 3px'}}>{formData.policeStation || ''}</u> जिला <u style={{display: 'inline-block', minWidth: '80px', textAlign: 'center', borderBottom: '1px solid black', padding: '0 3px'}}>{formData.district || ''}</u> को आपना मर्ज़ी से आतिया गर्ल्स हॉस्टल में रख रहा हूँ। मैं और मेरी 
                पुत्री / बहन यह <u style={{display: 'inline-block', minWidth: '60px', textAlign: 'center', borderBottom: '1px solid black', padding: '0 3px'}}>{formatDate(formData.admissionDate) || ''}</u> षपथ लेते हैं कि हॉस्टल के निम्नलिखित नियमों का पालन करेंगे।
              </p>
            </div>

            <div style={{fontSize: '0.7rem', lineHeight: '1.6'}}>
                <p style={{marginBottom: '0.3rem'}}><strong>1.</strong> हॉस्टल से बाहर निकलने के पूर्व का आने के समय हॉस्टल इंचार्ज से अनुमति लेने अनिवार्य होगा।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>2.</strong> कोचिंग का समय प्राप्त होने के 30 मिनट पूर्व हॉस्टल से निकलना एवं कोचिंग के समाप्त होने पर 30 मिनट के अंदर हॉस्टल वापस आना अनिवार्य होगा।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>3.</strong> हॉस्टल के अन्दर साफाई का विधि। स्वयं रखना।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>4.</strong> कमरे से बाहर निकलते समय पंखे और लाइटें बंद करना अनिवार्य है; ऐसा न करने पर 50 रुपया दंड लगेगा।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>5.</strong> यदि छात्रा परिसर से बाहर जाने के बाद भाग जाती है तो हॉस्टल जिम्मेदार नहीं होगा।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>6.</strong> हॉस्टल की फीस प्रत्येक माह की 1 तारिख से 5 तारिख तक जमा करना अनिवार्य है।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>7.</strong> अभिवावक से आग्रह है कि अपनी बच्ची से रविवार को ही मिले। मिलने वाले मे माता–पिता अपना भाई–बहन के अलावा कोई नहीं मिलना हैं।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>8.</strong> मिलने के पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है। गुरु जी से आग्रह है कि हॉस्टल रक्षा में प्रवेश न करें। एवं मिलने का समय 30 मिनट से कम हो।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>9.</strong> खिड़कीयों पर खड़ा होना सख़्ती से मनाही हैं।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>10.</strong> खिड़की से कोई भी वस्तु बाहर न फेकें। कचड़ा पेटी का प्रयोग करें।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>11.</strong> पढ़ाई पर बिश। ध्यान रखें।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>12.</strong> कोई भी समस्या होने पर इसे की शिकायत हॉस्टल इंचार्ज को फोन दें।</p>
                <p style={{marginBottom: '0.3rem'}}><strong>13.</strong> जब भी हॉस्टल छोड़ना (खाली) करना हो तो एक माह पूर्व बताना अनिवार्य है नहीं तो दुस्त माह का _____ टुक देना होगा।</p>
            </div>

            <div style={{marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', fontWeight: 'bold'}}>
              धन्यवाद
            </div>

            <div style={{...styles.signatureSection, marginTop: '2.5rem'}}>
              <div style={styles.signatureBox}>
                <div style={{borderTop: '2px solid #9ca3af', paddingTop: '0.5rem', minHeight: '50px'}}>
                  <p style={{...styles.signatureName, fontSize: '0.8rem'}}>{formData.parentSignature}</p>
                  <p style={{...styles.signatureLabel, fontSize: '0.65rem'}}>पिता / माता का हस्ताक्षर</p>
                </div>
              </div>
              <div style={styles.signatureBox}>
                <div style={{borderTop: '2px solid #9ca3af', paddingTop: '0.5rem', minHeight: '50px'}}>
                  <p style={{...styles.signatureName, fontSize: '0.8rem'}}>{formData.studentSignature}</p>
                  <p style={{...styles.signatureLabel, fontSize: '0.65rem'}}>छात्रा का हस्ताक्षर</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div style={{textAlign: 'center'}} className="no-print">
          <button
            onClick={() => setShowPreview(false)}
            style={styles.backButton}
          >
            ← Back to Form / फॉर्म पर वापस जाएं
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        {!showPreview ? (
          <div>
            <div style={styles.card}>
              <div style={styles.header}>
                <h1 style={styles.h1}>Hostel Admission Form</h1>
                <p style={styles.subtitle}>Please fill in all the required details</p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Student Details Section */}
                <div style={styles.formSection}>
                  <h2 style={styles.sectionTitle}>
                    <User size={18} style={{ marginRight: '0.5rem' }} />
                    Student Details
                  </h2>
                  
                  <div style={styles.gridTwo}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="studentName">
                        Student Name <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="text"
                        id="studentName"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                        placeholder="Enter full name"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="motherName">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        id="motherName"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Mother's full name"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="fatherName">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        id="fatherName"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Father's full name"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="mobile1">
                        Mobile Number 1 <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="tel"
                        id="mobile1"
                        name="mobile1"
                        value={formData.mobile1}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                        pattern="[0-9]{10}"
                        placeholder="10-digit mobile number"
                        title="Please enter a valid 10-digit mobile number"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="mobile2">
                        Mobile Number 2 (Optional)
                      </label>
                      <input
                        type="tel"
                        id="mobile2"
                        name="mobile2"
                        value={formData.mobile2}
                        onChange={handleInputChange}
                        style={styles.input}
                        pattern="[0-9]{10}"
                        placeholder="10-digit mobile number"
                        title="Please enter a valid 10-digit mobile number"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="dob">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dob"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        style={styles.input}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Details Section */}
                <div style={styles.formSection}>
                  <h2 style={styles.sectionTitle}>
                    <MapPin size={18} style={{ marginRight: '0.5rem' }} />
                    Address Details
                  </h2>
                  
                  <div style={styles.gridTwo}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="village">
                        Village/Town
                      </label>
                      <input
                        type="text"
                        id="village"
                        name="village"
                        value={formData.village}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Village/Town name"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="post">
                        Post Office
                      </label>
                      <input
                        type="text"
                        id="post"
                        name="post"
                        value={formData.post}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Post office name"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="policeStation">
                        Police Station
                      </label>
                      <input
                        type="text"
                        id="policeStation"
                        name="policeStation"
                        value={formData.policeStation}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Police station name"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="district">
                        District <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                        placeholder="District name"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="pinCode">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        id="pinCode"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleInputChange}
                        style={styles.input}
                        pattern="[0-9]{6}"
                        placeholder="6-digit PIN code"
                        title="Please enter a valid 6-digit PIN code"
                      />
                    </div>
                  </div>
                </div>

                {/* Allowed Persons Section */}
                <div style={styles.formSection}>
                  <h2 style={styles.sectionTitle}>
                    <Users size={18} style={{ marginRight: '0.5rem' }} />
                    Allowed Persons to Meet
                  </h2>
                  
                  <div style={styles.gridTwo}>
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} style={styles.formGroup}>
                        <label style={styles.label} htmlFor={`allowedPerson${num}`}>
                          Person {num} {num <= 2 && <span style={{color: '#ef4444'}}>*</span>}
                        </label>
                        <input
                          type="text"
                          id={`allowedPerson${num}`}
                          name={`allowedPerson${num}`}
                          value={formData[`allowedPerson${num}`] || ''}
                          onChange={handleInputChange}
                          style={styles.input}
                          placeholder={`Name & Relation`}
                          required={num <= 2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coaching Details Section */}
                <div style={styles.formSection}>
                  <h2 style={styles.sectionTitle}>
                    <GraduationCap size={18} style={{ marginRight: '0.5rem' }} />
                    Coaching Details
                  </h2>
                  
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} style={styles.coachingCard}>
                      <div style={styles.coachingTitle}>
                        <GraduationCap size={16} />
                        <span>Coaching {num} {num === 1 && <span style={{color: '#ef4444'}}>*</span>}</span>
                      </div>
                      <div style={styles.gridTwo}>
                        <div style={styles.formGroup}>
                          <label style={styles.label} htmlFor={`coaching${num}Name`}>
                            Name {num === 1 && <span style={{color: '#ef4444'}}>*</span>}
                          </label>
                          <input
                            type="text"
                            id={`coaching${num}Name`}
                            name={`coaching${num}Name`}
                            value={formData[`coaching${num}Name`] || ''}
                            onChange={handleInputChange}
                            style={styles.input}
                            placeholder={`Coaching ${num} name`}
                            required={num === 1}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label} htmlFor={`coaching${num}Address`}>
                            Address {num === 1 && <span style={{color: '#ef4444'}}>*</span>}
                          </label>
                          <input
                            type="text"
                            id={`coaching${num}Address`}
                            name={`coaching${num}Address`}
                            value={formData[`coaching${num}Address`] || ''}
                            onChange={handleInputChange}
                            style={styles.input}
                            placeholder={`Coaching ${num} address`}
                            required={num === 1}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Documents & Signatures Section */}
                <div style={styles.formSection}>
                  <h2 style={styles.sectionTitle}>
                    <FileText size={18} style={{ marginRight: '0.5rem' }} />
                    Documents & Signatures
                  </h2>
                  
                  <div style={styles.gridTwo}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="studentPhoto">
                        Student Photo <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="file"
                        id="studentPhoto"
                        name="studentPhoto"
                        onChange={handleFileChange}
                        accept="image/*"
                        style={styles.fileInput}
                        required={!formData.studentPhoto}
                      />
                      {formData.studentPhoto && (
                        <div style={styles.photoPreviewContainer}>
                          <img 
                            src={formData.studentPhoto} 
                            alt="Student Preview" 
                            style={styles.photoPreview}
                          />
                        </div>
                      )}
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="parentPhoto">
                        Parent/Guardian Photo <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="file"
                        id="parentPhoto"
                        name="parentPhoto"
                        onChange={handleFileChange}
                        accept="image/*"
                        style={styles.fileInput}
                        required={!formData.parentPhoto}
                      />
                      {formData.parentPhoto && (
                        <div style={styles.photoPreviewContainer}>
                          <img 
                            src={formData.parentPhoto} 
                            alt="Parent Preview" 
                            style={styles.photoPreview}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.gridTwo, marginTop: '1rem' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="studentSignature">
                        Student's Signature <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="file"
                        id="studentSignature"
                        name="studentSignature"
                        onChange={handleFileChange}
                        accept="image/*"
                        style={styles.fileInput}
                        required={!formData.studentSignature}
                      />
                      {formData.studentSignature && (
                        <div style={styles.photoPreviewContainer}>
                          <img 
                            src={formData.studentSignature} 
                            alt="Student Signature Preview" 
                            style={{ ...styles.photoPreview, maxHeight: '80px' }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="parentSignature">
                        Parent's/Guardian's Signature <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="file"
                        id="parentSignature"
                        name="parentSignature"
                        onChange={handleFileChange}
                        accept="image/*"
                        style={styles.fileInput}
                        required={!formData.parentSignature}
                      />
                      {formData.parentSignature && (
                        <div style={styles.photoPreviewContainer}>
                          <img 
                            src={formData.parentSignature} 
                            alt="Parent Signature Preview" 
                            style={{ ...styles.photoPreview, maxHeight: '80px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div style={styles.buttonCenter}>
                  <button 
                    type="button" 
                    onClick={() => setShowPreview(true)} 
                    style={styles.button}
                    disabled={!formData.studentName || !formData.mobile1 || !formData.district}
                  >
                    <Printer size={18} /> Preview & Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div style={styles.printContainer}>
            <div style={styles.printHeader}>
              <h1 style={styles.printH1}>HOSTEL ADMISSION FORM</h1>
              <p style={styles.printSubtitle}>(छात्रावास प्रवेश फॉर्म)</p>
            </div>

            <div style={styles.photoSection}>
              <div style={styles.photoBox}>
                <div style={styles.photoLabel}>Student Photo</div>
                <div style={styles.photoFrame}>
                  {formData.studentPhoto ? (
                    <img src={formData.studentPhoto} alt="Student" style={styles.photoImg} />
                  ) : (
                    <span style={{color: '#9ca3af'}}>No photo</span>
                  )}
                </div>
              </div>
              <div style={styles.photoBox}>
                <div style={styles.photoLabel}>Parent/Guardian Photo</div>
                <div style={styles.photoFrame}>
                  {formData.parentPhoto ? (
                    <img src={formData.parentPhoto} alt="Parent" style={styles.photoImg} />
                  ) : (
                    <span style={{color: '#9ca3af'}}>No photo</span>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.printSectionTitle}>
              <Calendar size={14} style={{marginRight: '0.5rem'}} />
              STUDENT DETAILS (छात्रा का विवरण)
            </div>

            <div style={styles.infoGrid}>
              <div><span style={styles.infoLabel}>Name/नाम:</span> {formData.studentName || '-'}</div>
              <div><span style={styles.infoLabel}>Father's Name/पिता का नाम:</span> {formData.fatherName || '-'}</div>
              <div><span style={styles.infoLabel}>Mother's Name/माता का नाम:</span> {formData.motherName || '-'}</div>
              <div><span style={styles.infoLabel}>Date of Birth/जन्मतिथि:</span> {formatDate(formData.dob) || '-'}</div>
              <div><span style={styles.infoLabel}>Mobile 1/मोबाइल 1:</span> {formData.mobile1 || '-'}</div>
              <div><span style={styles.infoLabel}>Mobile 2/मोबाइल 2:</span> {formData.mobile2 || '-'}</div>
            </div>

            <div style={styles.printSectionTitle}>
              <MapPin size={14} style={{marginRight: '0.5rem'}} />
              ADDRESS DETAILS (पता विवरण)
            </div>

            <div style={styles.infoGrid}>
              <div><span style={styles.infoLabel}>Village/Town/गाँव/शहर:</span> {formData.village || '-'}</div>
              <div><span style={styles.infoLabel}>Post Office/डाकघर:</span> {formData.post || '-'}</div>
              <div><span style={styles.infoLabel}>Police Station/थाना:</span> {formData.policeStation || '-'}</div>
              <div><span style={styles.infoLabel}>District/जिला:</span> {formData.district || '-'}</div>
              <div><span style={styles.infoLabel}>PIN Code/पिन कोड:</span> {formData.pinCode || '-'}</div>
            </div>

            <div style={styles.printSectionTitle}>
              <Users size={14} style={{marginRight: '0.5rem'}} />
              ALLOWED PERSONS TO MEET (मिलने की अनुमति प्राप्त व्यक्ति)
            </div>

            <div style={styles.infoGrid}>
              {[1, 2, 3, 4].map((num) => (
                formData[`allowedPerson${num}`] && (
                  <div key={num}>
                    <span style={styles.infoLabel}>Person {num}/व्यक्ति {num}:</span> {formData[`allowedPerson${num}`]}
                  </div>
                )
              ))}
            </div>

            <div style={styles.printSectionTitle}>
              <GraduationCap size={14} style={{marginRight: '0.5rem'}} />
              COACHING DETAILS (कोचिंग विवरण)
            </div>

            {[1, 2, 3, 4].map((num) => (
              (formData[`coaching${num}Name`] || formData[`coaching${num}Address`]) && (
                <div key={num} style={{...styles.coachingCard, marginBottom: '0.75rem'}}>
                  <div style={{fontWeight: '600', marginBottom: '0.5rem'}}>Coaching {num}/कोचिंग {num}</div>
                  <div style={styles.infoGrid}>
                    <div><span style={styles.infoLabel}>Name/नाम:</span> {formData[`coaching${num}Name`] || '-'}</div>
                    <div><span style={styles.infoLabel}>Address/पता:</span> {formData[`coaching${num}Address`] || '-'}</div>
                  </div>
                </div>
              )
            ))}

            <div style={{...styles.signatureSection, marginTop: '2rem'}}>
              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <p style={styles.signatureName}>Student's Signature</p>
                <p style={styles.signatureLabel}>(छात्रा के हस्ताक्षर)</p>
              </div>
              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <p style={styles.signatureName}>Parent's/Guardian's Signature</p>
                <p style={styles.signatureLabel}>(अभिभावक के हस्ताक्षर)</p>
              </div>
            </div>

            <div style={{...styles.rulesSection, marginTop: '2rem'}}>
              <h3 style={styles.rulesTitle}>HOSTEL RULES AND REGULATIONS (छात्रावास के नियम एवं शर्तें)</h3>
              <div style={{fontSize: '0.7rem', lineHeight: '1.6'}}>
                <p><strong>1.</strong> Permission must be obtained from the hostel in-charge before leaving the premises.</p>
                <p><strong>2.</strong> Students must leave the hostel 30 minutes before coaching starts and return within 30 minutes after coaching ends.</p>
                <p><strong>3.</strong> Maintain cleanliness in the hostel premises at all times.</p>
                <p><strong>4.</strong> Turn off fans and lights when leaving the room; failure will result in a ₹50 fine.</p>
                <p><strong>5.</strong> The hostel is not responsible if a student leaves the premises without permission.</p>
                <p><strong>6.</strong> Hostel fees must be paid by the 5th of every month.</p>
                <p><strong>7.</strong> Parents are requested to meet their wards only on Sundays; only parents and siblings are allowed.</p>
                <p><strong>8.</strong> Permission from the hostel in-charge is mandatory before any visits; visitors are not allowed in residential areas.</p>
                <p><strong>9.</strong> Standing near windows is strictly prohibited.</p>
                <p><strong>10.</strong> Do not throw anything out of windows; use the provided dustbins.</p>
                <p><strong>11.</strong> Students must focus on their studies.</p>
                <p><strong>12.</strong> Report any issues or complaints directly to the hostel in-charge.</p>
                <p><strong>13.</strong> One month's notice is required before vacating the hostel; otherwise, the next month's fee will be charged.</p>
              </div>
            </div>

            <div style={{marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem'}}>
              <p>Date/तारीख: {formatDate(new Date())}</p>
              <p>Signature of Warden/वार्डन के हस्ताक्षर: _________________</p>
            </div>

            <div style={styles.buttonGroup}>
              <button 
                type="button" 
                onClick={() => setShowPreview(false)} 
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                <ChevronLeft size={18} /> Back to Edit
              </button>
              <button 
                type="button" 
                onClick={handleSubmit} 
                style={styles.button}
              >
                <Download size={18} /> Submit & Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelAdmissionForm;