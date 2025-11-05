import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResponsiveStyles } from '../utils/responsiveStyles';

import { Printer, User, Phone, MapPin, Calendar, Users, GraduationCap } from 'lucide-react';
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
  const [hostels, setHostels] = useState([]);
  const [noHostels, setNoHostels] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const editId = params.get('editId');
  const preHostelId = params.get('hostelDocId');
  const preOwnerUserId = params.get('ownerUserId');
  const [fixedHostel, setFixedHostel] = useState(false);

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

  // If authenticated, load hostels for current user to allow admin additions
  useEffect(() => {
    // Load hostels when a token exists. Don't rely on localStorage.user being present.
    const token = localStorage.getItem('token');
    if (!token) return;
    const loadHostels = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me/hostels`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          // token expired or invalid - clear and optionally redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setHostels([]);
          setNoHostels(false);
          return;
        }
        if (!res.ok) {
          console.warn('Failed to load hostels, status:', res.status);
          setHostels([]);
          setNoHostels(true);
          return;
        }
        const data = await res.json();
        // API returns { success: true, data: [...] }
        const list = Array.isArray(data) ? data : (data && data.data) || [];
        setHostels(list || []);
        setNoHostels(!list || list.length === 0);
        // If a hostel was provided via query param, preselect it and lock the selection
        if (preHostelId) {
          setFormData(prev => ({ ...prev, hostelDocId: preHostelId }));
          setFixedHostel(true);
        }
        // If admin has exactly one hostel, preselect and lock it for convenience
        if (!preHostelId && Array.isArray(list) && list.length === 1) {
          const only = list[0];
          setFormData(prev => ({ ...prev, hostelDocId: only.id }));
          setFixedHostel(true);
        }
      } catch (err) {
        console.warn('Failed to load hostels', err);
        setHostels([]);
        setNoHostels(true);
      }
    };
    loadHostels();
  }, []);

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

  const generatePDF = async () => {
    try {
      // Ensure all required fields are filled
      const requiredFields = [
        'studentName', 'motherName', 'fatherName', 'mobile1', 'village',
        'post', 'policeStation', 'district', 'pinCode'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields before generating PDF. Missing: ${missingFields.join(', ')}`);
        return;
      }
      
      setLoading(true);
      // Add a small delay to ensure the loading state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await downloadStudentPdf(formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      'studentName', 'motherName', 'fatherName', 'mobile1', 'village',
      'post', 'policeStation', 'district', 'pinCode'
    ];

  // Signatures: accept either typed signature, uploaded photo, or fallback to name fields
  const signatureMissing = [];
  if (!(formData.studentSignature || formData.studentPhoto || formData.studentName)) signatureMissing.push('studentSignature/studentPhoto/studentName');
  if (!(formData.parentSignature || formData.parentPhoto || formData.fatherName || formData.motherName)) signatureMissing.push('parentSignature/parentPhoto/parentName');

    const missingFields = requiredFields.filter(field => !formData[field]).concat(signatureMissing);
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields before submitting. Missing: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      const submitButton = document.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = 'Saving...';
      
      // Prepare form data with status and timestamps
      const formDataWithStatus = {
        ...formData,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      // Submit form data
      let res;
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      // If user is authenticated (admin) we require selecting a hostel so we don't
      // accidentally submit to the top-level `students` collection.
      if (!editId && token && !formData.hostelDocId) {
        if (noHostels) {
          alert('You are signed in as an admin but no hostels were found. Please create a hostel first in the Admin Dashboard.');
        } else {
          alert('You are signed in as an admin — please select the hostel to add this student to (or create a hostel first).');
        }
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        setLoading(false);
        return;
      }

      if (!editId && token && formData.hostelDocId) {
        // Admin creating a student under a hostel - use protected endpoint to get combinedId
        res = await fetch(`${API_BASE}/api/users/me/hostels/${formData.hostelDocId}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formDataWithStatus)
        });
      } else {
        const endpoint = editId ? `${API_BASE}/api/students/${editId}` : `${API_BASE}/api/students`;
        const method = editId ? 'PUT' : 'POST';
        res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formDataWithStatus)
        });
      }
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed to update student', errText);
        alert('Failed to update student. See console for details.');
        return;
      }
      // If admin-created student, backend returns combinedId; show to user/admin
      if (!editId && token && formData.hostelDocId) {
        const payload = await res.json();
        // backend returns { success: true, data: { combinedId, studentPath } }
        const combined = payload && ((payload.data && payload.data.combinedId) || payload.combinedId);
        alert(`Student created with Application no: ${combined || 'N/A'}`);
      }
      alert('Record updated successfully');
      // If this was an admin editing an existing record, go back to admin dashboard
      if (editId) {
        navigate('/admin/dashboard');
        return;
      }

      // For student submissions (no editId) do NOT redirect to admin dashboard.
      // Instead trigger the PDF download so the student can download their copy.
      try {
        await downloadStudentPdf(formDataWithStatus);
      } catch (err) {
        console.error('Failed to download PDF after save', err);
      }
      return;
    } catch (err) {
      console.error('Submit error', err);
      alert('An error occurred while saving. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    // Use the helper which accepts student data and generates combined PDF (form + rules)
    downloadStudentPdf(formData);
  };

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

  return showPreview ? (
    <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
      <div style={{width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #eee'}}>
          <div style={{fontSize: '1rem', fontWeight: 700}}>Preview</div>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button onClick={async () => { try { await downloadStudentPdf(formData); } catch (err) { console.error(err); alert('Failed to generate PDF'); } }} style={{background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer'}}>Download PDF</button>
            <button onClick={() => { setShowPreview(false); }} style={{background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer'}}>Close</button>
          </div>
        </div>
        <div style={{padding: '1rem'}}>
          <div className="print-content">
            <div style={{
              padding: '20px',
              maxWidth: '210mm',
              margin: '0 auto',
              background: 'white',
              minHeight: '297mm',
              boxSizing: 'border-box',
              position: 'relative'
            }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #4f46e5', paddingBottom: '10px' }}>
                <h1 style={{ color: '#4f46e5', margin: '5px 0', fontSize: '28px' }}>आतिया गर्ल्स हॉस्टल</h1>
                <h2 style={{ color: '#4f46e5', margin: '5px 0', fontSize: '20px' }}>ATIYA GIRLS HOSTEL</h2>
                <p style={{ margin: '5px 0', fontSize: '16px', color: '#666' }}>रामपाड़ा कटिहार / Rampada Katihar</p>
                <p style={{ margin: '10px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>नामांकन फॉर्म / ADMISSION FORM</p>
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  Admission Date: {new Date(formData.admissionDate || new Date()).toLocaleDateString('en-IN')}
                </div>
              </div>

              {/* Student Information */}
              {hostels && hostels.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Select Hostel (for admin)</label>
                  <select
                    name="hostelDocId"
                    value={formData.hostelDocId || ''}
                    onChange={handleInputChange}
                    disabled={fixedHostel}
                    style={{ padding: '10px', borderRadius: 6, width: '100%', border: '1px solid #e5e7eb' }}
                  >
                    <option value="">-- Select hostel --</option>
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>{`${h.hostelId} - ${h.name}`}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#4f46e5',
                  fontSize: '18px'
                }}>छात्रा की जानकारी / Student Information</h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>छात्रा का नाम / Student Name</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.studentName || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>पिता का नाम / Father's Name</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.fatherName || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>माता का नाम / Mother's Name</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.motherName || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>मोबाइल नंबर / Mobile Number</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.mobile1 || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>गाँव / Village</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.village || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>डाकघर / Post Office</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.post || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>थाना / Police Station</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.policeStation || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>जिला / District</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.district || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>पिन कोड / PIN Code</p>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '5px'
                    }}>{formData.pinCode || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '20px 0',
                gap: '20px'
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    border: '1px dashed #9ca3af',
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '5px',
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <img 
                      src={formData.parentPhoto || PlaceholderImage} 
                      alt="Parent" 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100px',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                    पिता/माता का फोटो / Parent Photo
                  </p>
                </div>
                
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    border: '1px dashed #9ca3af',
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '5px',
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <img 
                      src={formData.studentPhoto || PlaceholderImage} 
                      alt="Student" 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100px',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                    छात्रा का फोटो / Student Photo
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '40px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb',
                position: 'absolute',
                bottom: '40px',
                left: '20px',
                right: '20px'
              }}>
                <div style={{ textAlign: 'center', flex: 1, padding: '0 20px' }}>
                  <div style={{
                    borderTop: '1px solid #000',
                    width: '200px',
                    margin: '0 auto',
                    paddingTop: '5px'
                  }}>
                    <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: '500' }}>
                      {formData.parentSignature || 'Parent/Guardian Name'}
                    </p>
                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                      पिता / माता का हस्ताक्षर / Parent's Signature
                    </p>
                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                      दिनांक / Date: {new Date().toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
                
                <div style={{ textAlign: 'center', flex: 1, padding: '0 20px' }}>
                  <div style={{
                    borderTop: '1px solid #000',
                    width: '200px',
                    margin: '0 auto',
                    paddingTop: '5px'
                  }}>
                    <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: '500' }}>
                      {formData.studentSignature || 'Student Name'}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                      छात्रा का हस्ताक्षर / Student's Signature
                    </p>
                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                      दिनांक / Date: {new Date().toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2: Rules and Regulations */}
            <div className="page-break"></div>
            
            <div style={{
              padding: '20px',
              maxWidth: '210mm',
              margin: '0 auto',
              background: 'white',
              minHeight: '297mm',
              boxSizing: 'border-box',
              position: 'relative'
            }}>
              <h2 style={{
                textAlign: 'center',
                color: '#4f46e5',
                marginBottom: '20px',
                fontSize: '22px',
                paddingBottom: '10px',
                borderBottom: '2px solid #4f46e5'
              }}>हॉस्टल नियम एवं शर्तें / HOSTEL RULES AND REGULATIONS</h2>
              
              <div style={{
                fontSize: '14px',
                lineHeight: '1.8',
                textAlign: 'justify',
                marginBottom: '30px'
              }}>
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
              
              {/* Hostel Incharge Signature */}
              <div style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                textAlign: 'right'
              }}>
                <div style={{
                  display: 'inline-block',
                  textAlign: 'center'
                }}>
                  <div style={{
                    borderTop: '1px solid #000',
                    width: '250px',
                    marginLeft: 'auto',
                    paddingTop: '5px'
                  }}>
                    <p style={{
                      margin: '5px 0',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>हॉस्टल इंचार्ज / Hostel Incharge</p>
                    <p style={{
                      margin: '5px 0 0',
                      fontSize: '12px',
                      color: '#666'
                    }}>दिनांक / Date: {new Date().toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
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
          {/* Photo Display Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '2rem',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              flex: '1 1 200px',
              minWidth: '200px',
              textAlign: 'center'
            }}>
              <div style={{
                ...responsiveStyles.photoPreview,
                margin: '0 auto',
                width: '150px',
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem'
              }}>
                <img 
                  src={PlaceholderImage} 
                  alt="Parent Photo" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} 
                />
              </div>
              <p style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: '#4b5563',
                fontWeight: '500'
              }}>
                पिता/माता का फोटो
              </p>
            </div>
            <div style={{
              flex: '1 1 200px',
              minWidth: '200px',
              textAlign: 'center'
            }}>
              <div style={{
                ...responsiveStyles.photoPreview,
                margin: '0 auto',
                width: '150px',
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem'
              }}>
                <img 
                  src={PlaceholderImage} 
                  alt="Student Photo" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} 
                />
              </div>
              <p style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: '#4b5563',
                fontWeight: '500'
              }}>
                छात्रा का फोटो
              </p>
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
                  <Calendar size={16} style={{display: 'inline', marginRight: '0.5rem'}} />
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
              <Phone size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
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
              <MapPin size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
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
              <Users size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
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
              <GraduationCap size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
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
                <div style={{
                  ...responsiveStyles.input,
                  padding: '0.5rem',
                  minHeight: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #9ca3af',
                  fontStyle: 'italic',
                  color: '#4b5563'
                }}>
                  {formData.studentName || 'Student Name'}
                </div>
              </div>
              <div style={responsiveStyles.formGroup}>
                <label style={responsiveStyles.label}>
                  पिता/माता का हस्ताक्षर / Parent Signature *
                </label>
                <div style={{
                  ...responsiveStyles.input,
                  padding: '0.5rem',
                  minHeight: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #9ca3af',
                  fontStyle: 'italic',
                  color: '#4b5563'
                }}>
                  {formData.fatherName || formData.motherName || 'Parent Name'}
                </div>
              </div>
            </div>
          </div>

          {/* Single Submit Button */}
          <div style={{...responsiveStyles.buttonCenter, marginTop: '2rem'}}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...responsiveStyles.button,
                padding: '12px 24px',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: loading ? '#9ca3af' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Printer size={20} />
              {loading ? 'Saving...' : 'Save & Generate PDF / सेव करें और पीडीएफ बनाएं'}
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