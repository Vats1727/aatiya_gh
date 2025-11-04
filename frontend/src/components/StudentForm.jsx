import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResponsiveStyles } from '../utils/responsiveStyles';

// Icons from lucide-react
import { FileText, Download, User, Phone, MapPin, Calendar, Users, GraduationCap, Check } from 'lucide-react';
import Printer from 'lucide-react/dist/esm/icons/printer';
import { renderStudentPrintHtml } from '../utils/printTemplate';
import { downloadStudentPdf } from '../utils/pdfUtils';
import PlaceholderImage from '../assets/Image.jpg';

// API Base URL setup
let API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
try {
  // Extract the first http(s) URL if the value accidentally contains the URL twice
  const m = String(API_BASE).match(/https?:\/\/[^\s'"]+/i);
  if (m && m[0]) API_BASE = m[0];
  // Trim trailing slash for consistency
  API_BASE = API_BASE.replace(/\/$/, '');
} catch (e) {
  console.warn('Error processing API_BASE:', e);
}

const HostelAdmissionForm = () => {
  const [loading, setLoading] = useState(false);
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
  const [previewHtml, setPreviewHtml] = useState('');
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

  // Responsive styles with mobile-first approach
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '0.5rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      boxSizing: 'border-box',
      width: '100%',
      overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      '@media (min-width: 480px)': {
        padding: '0.75rem',
      },
      '@media (min-width: 768px)': {
        padding: '1rem',
      },
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      padding: '0 0.5rem',
      boxSizing: 'border-box',
      '@media (min-width: 480px)': {
        padding: '0 0.75rem',
      },
      '@media (min-width: 768px)': {
        padding: '0 1rem',
      },
    },
    card: {
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      padding: '1rem',
      marginBottom: '1rem',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'box-shadow 0.2s ease, transform 0.1s ease',
      ':hover': {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      '@media (min-width: 480px)': {
        padding: '1.25rem',
        borderRadius: '0.875rem',
      },
      '@media (min-width: 768px)': {
        padding: '1.5rem',
        marginBottom: '1.25rem',
        borderRadius: '1rem',
      },
    },
    header: {
      textAlign: 'center',
      padding: '0.5rem 0',
      marginBottom: '0.5rem',
      '@media (min-width: 480px)': {
        padding: '0.75rem 0',
        marginBottom: '0.75rem',
      },
      '@media (min-width: 768px)': {
        padding: '1rem 0',
        marginBottom: '1rem',
      },
    },
    h1: {
      fontSize: '1.375rem',
      fontWeight: '700',
      color: '#db2777',
      margin: '0 0 0.25rem',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      '@media (min-width: 480px)': {
        fontSize: '1.5rem',
        marginBottom: '0.375rem',
      },
      '@media (min-width: 768px)': {
        fontSize: '1.75rem',
        marginBottom: '0.5rem',
      },
      '@media (min-width: 1024px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#9333ea',
      margin: '0 0 0.75rem',
      lineHeight: '1.3',
      paddingBottom: '0.5rem',
      borderBottom: '2px solid #f3f4f6',
      '@media (min-width: 480px)': {
        fontSize: '1.375rem',
        marginBottom: '1rem',
      },
      '@media (min-width: 768px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width: 1024px)': {
        fontSize: '1.75rem',
      },
    },
    subtitle: {
      fontSize: '0.9375rem',
      color: '#4b5563',
      margin: '0 0 0.5rem',
      lineHeight: '1.5',
      maxWidth: '800px',
      marginLeft: 'auto',
      marginRight: 'auto',
      '@media (min-width: 480px)': {
        fontSize: '1rem',
      },
      '@media (min-width: 768px)': {
        fontSize: '1.0625rem',
      },
    },
    formTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#7c3aed',
      margin: '0 0 1rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #f3f4f6',
      '@media (min-width: 480px)': {
        fontSize: '1.25rem',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      const requiredFields = [
        'studentName', 'motherName', 'fatherName', 'mobile1', 'village',
        'post', 'policeStation', 'district', 'pinCode', 'studentSignature', 'parentSignature'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields before submitting. Missing: ${missingFields.join(', ')}`);
        return;
      }

      // Save the form data
      let response;
      if (editId) {
        // Update existing student
        response = await fetch(`${API_BASE}/api/students/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, updatedAt: new Date().toISOString() })
        });
      } else {
        // Create new student
        response = await fetch(`${API_BASE}/api/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to save student');
      }
      
      // Get the saved data
      const payload = await response.json();
      const savedData = payload.student || payload;
      
      // Update form data with any server-generated fields
      setFormData(prev => ({
        ...prev,
        ...savedData
      }));
      
      // Show success message
      alert('Form saved successfully! The PDF will now open for printing.');
      
      // Show preview and trigger print dialog
      setShowPreview(true);
      setTimeout(() => {
        window.print();
        // Close preview after a short delay
        setTimeout(() => setShowPreview(false), 1000);
      }, 500);
      
    } catch (err) {
      console.error('Submit error', err);
      alert(`An error occurred while saving: ${err.message || 'Please try again'}`);
    }
  };

  return (
    <div style={{...responsiveStyles.container, ...responsiveStyles.maxWidth}}>
      <div style={responsiveStyles.card}>
        <form onSubmit={handleSubmit}>
          {/* ... */}
          <div style={responsiveStyles.buttonCenter}>
            <button
              type="submit"
              style={responsiveStyles.button}
              disabled={loading}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FileText size={20} style={{ marginRight: '8px' }} />
              Save & Print Form / सहेजें और प्रिंट करें
            </button>
          </div>
        </form>
      </div>

      {/* Rules Section for Display (always shown in Hindi) */}
      <div style={{...responsiveStyles.card, marginTop: '1rem'}} className="no-print">
      <h3 style={{...responsiveStyles.rulesTitle, fontSize: '1.5rem', color: '#9333ea', marginBottom: '1rem'}}>हॉस्टल नियम एवं शर्तें</h3>
      <div style={{fontSize: '0.875rem', lineHeight: '1.8', textAlign: 'justify'}}>
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
        <p><strong>13.</strong> हॉस्टल खाली करने के लिए एक महीने का नोटिस देना अनिवार्य है; अन्यथा अगले माह की फीस लागू होगी।</p>
        <p><strong>14.</strong> हॉस्टल प्रशासन आवश्यकतानुसार नियमों में परिवर्तन करने का अधिकार रखता है।</p>
      </div>
      </div>
    </div>
  );
};

export default HostelAdmissionForm;