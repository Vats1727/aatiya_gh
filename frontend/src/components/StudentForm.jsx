import React, { useState } from 'react';
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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '2rem 1rem',
      fontFamily: 'Arial, sans-serif'
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      padding: '2rem',
      marginBottom: '1.5rem'
    },
    header: {
      textAlign: 'center'
    },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#db2777',
      marginBottom: '0.5rem'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#ec4899',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '1.25rem',
      color: '#4b5563',
      marginBottom: '0.5rem'
    },
    formTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#9333ea',
      marginTop: '1rem'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#9333ea',
      marginBottom: '1rem',
      borderBottom: '2px solid #e9d5ff',
      paddingBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center'
    },
    gridTwo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    formGroup: {
      marginBottom: '0.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '2px solid #fbcfe8',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      outline: 'none',
      transition: 'border-color 0.3s',
      boxSizing: 'border-box'
    },
    fileInput: {
      width: '100%',
      padding: '0.5rem',
      border: '2px solid #fbcfe8',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      boxSizing: 'border-box'
    },
    photoPreview: {
      width: '128px',
      height: '128px',
      objectFit: 'cover',
      borderRadius: '0.5rem',
      marginTop: '0.5rem'
    },
    coachingCard: {
      marginBottom: '1.5rem',
      padding: '1rem',
      background: '#fce7f3',
      borderRadius: '0.5rem'
    },
    coachingTitle: {
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.75rem'
    },
    button: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
      padding: '1rem 3rem',
      borderRadius: '0.75rem',
      fontWeight: 'bold',
      fontSize: '1.125rem',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s'
    },
    buttonCenter: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem'
    },
    // Print Preview Styles
    printContainer: {
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        padding: '1.5rem',
        boxSizing: 'border-box',
        fontSize: '0.75rem'
    },
    printHeader: {
      textAlign: 'center',
      borderBottom: '3px solid #9ca3af',
      paddingBottom: '0.5rem',
      marginBottom: '1rem'
    },
    printH1: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 0.25rem 0'
    },
    printH2: {
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#374151',
        margin: '0 0 0.25rem 0'
    },
    printSubtitle: {
        fontSize: '0.875rem',
        color: '#374151',
        margin: '0'
    },
    printFormTitle: {
      fontSize: '1rem',
      fontWeight: '700',
      color: '#111827',
      marginTop: '0.5rem',
      marginBottom: '0.25rem'
    },
    printDate: {
      fontSize: '0.75rem',
      color: '#6b7280',
      marginTop: '0.25rem'
    },
    photoSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
      marginBottom: '1rem'
    },
    photoBox: {
      textAlign: 'center'
    },
    photoLabel: {
      fontWeight: '600',
      marginBottom: '0.25rem',
      display: 'block',
      fontSize: '0.75rem'
    },
    photoFrame: {
      border: 'none',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    photoImg: {
      maxHeight: '100%',
      maxWidth: '100%',
      objectFit: 'contain'
    },
    printSectionTitle: {
      fontSize: '0.85rem',
      fontWeight: 'bold',
      background: '#f3e8ff',
      padding: '0.25rem 0.5rem',
      marginBottom: '0.4rem',
      marginTop: '0.5rem',
      borderRadius: '3px'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.25rem 1rem',
      fontSize: '0.7rem',
      marginBottom: '0.5rem'
    },
    infoGridFull: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '0.25rem',
        fontSize: '0.7rem',
        marginBottom: '0.5rem'
    },
    infoLabel: {
      fontWeight: '600'
    },
    signatureSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
      marginTop: '1rem',
      marginBottom: '0.5rem'
    },
    signatureBox: {
      textAlign: 'center'
    },
    signatureLine: {
      borderTop: '2px solid #9ca3af',
      paddingTop: '0.5rem',
      marginTop: '1.5rem'
    },
    signatureName: {
      fontWeight: '600',
      marginBottom: '0.25rem',
      fontSize: '0.8rem'
    },
    signatureLabel: {
      fontSize: '0.7rem'
    },
    rulesSection: {
        borderTop: 'none',
        paddingTop: '1rem'
    },
    rulesTitle: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '0.75rem'
    },
    backButton: {
      background: '#4b5563',
      color: 'white',
      padding: '0.75rem 2rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      marginTop: '2rem'
    }
  };

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
      // Add status as pending for new submissions
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
                  <p style={{marginBottom: '0.3rem'}}><strong>4.</strong> हॉस्टल से निकलने के पूर्व पक्का एवं बर्त्ती को बंद करना अनिवार्य है नहीं करने पर 50 रुपया दंड लगेगा।</p>
                  <p style={{marginBottom: '0.3rem'}}><strong>5.</strong> हॉस्टल से निकलने के बाद मेरी पुत्री अगर भाग जाती हैं तो इसके लिये हॉस्टल जिम्मेदार नहीं होगा।</p>
                  <p style={{marginBottom: '0.3rem'}}><strong>6.</strong> हॉस्टल _____ प्रत्येक हर महीने के 01 तारिख से 05 तारिख तक जमा करना अनिवार्य हैं।</p>
                  <p style={{marginBottom: '0.3rem'}}><strong>7.</strong> अभिवावक से आग्रह है कि अपनी बच्ची से रविवार को ही मिले। मिलने वाले मे माता–पिता अपना भाई–बहन के अलावा कोई नहीं मिलना हैं।</p>
                  <p style={{marginBottom: '0.3rem'}}><strong>8.</strong> मिलने के पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है। गुरु जी से आग्रह है कि हॉस्टल रक्षा में प्रवेश न करें। एवं मिलने का समय 30 मिनट से कम हो।</p>
                  <p style={{marginBottom: '0.3rem'}}><strong>9.</strong> खिड़कीयों पर खड़ा होना सख़्ती से मनाही हैं।</p>
                  <p style={{marginBottom: '0.3rem'}}><strong>10.</strong> कोई भी वस्तू खिड़की से बाहर न फेकें। कचड़ा पेटी का प्रयोग करें।</p>
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
        {/* Header */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.h1}>आतिया गर्ल्स हॉस्टल</h1>
            <h2 style={styles.h2}>ATIYA GIRLS HOSTEL</h2>
            <p style={styles.subtitle}>रामपाड़ा कटिहार / Rampada Katihar</p>
            <p style={styles.formTitle}>नामांकन फॉर्म / ADMISSION FORM</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.card}>
          {/* Photo Upload Section */}
          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <User size={16} style={{display: 'inline', marginRight: '0.5rem'}} />
                पिता/माता का फोटो / Parent Photo
              </label>
              <input
                type="file"
                name="parentPhoto"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              {formData.parentPhoto && (
                <img src={formData.parentPhoto} alt="Parent" style={styles.photoPreview} />
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <User size={16} style={{display: 'inline', marginRight: '0.5rem'}} />
                छात्रा का फोटो / Student Photo
              </label>
              <input
                type="file"
                name="studentPhoto"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              {formData.studentPhoto && (
                <img src={formData.studentPhoto} alt="Student" style={styles.photoPreview} />
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 style={styles.sectionTitle}>
              व्यक्तिगत जानकारी / Personal Information
            </h3>
            <div style={styles.gridTwo}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  छात्रा का नाम / Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="Enter student name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  माता का नाम / Mother's Name *
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="Enter mother's name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  पिता का नाम / Father's Name *
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="Enter father's name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} style={{display: 'inline', marginRight: '0.5rem'}} />
                  जन्म तिथि / Date of Birth *
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 style={styles.sectionTitle}>
              <Phone size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
              संपर्क जानकारी / Contact Information
            </h3>
            <div style={styles.gridTwo}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  मोबाइल नं (1) / Mobile No. (1) *
                </label>
                <input
                  type="tel"
                  name="mobile1"
                  value={formData.mobile1}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{10}"
                  style={styles.input}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  मोबाइल नं (2) / Mobile No. (2)
                </label>
                <input
                  type="tel"
                  name="mobile2"
                  value={formData.mobile2}
                  onChange={handleInputChange}
                  pattern="[0-9]{10}"
                  style={styles.input}
                  placeholder="10-digit mobile number (optional)"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 style={styles.sectionTitle}>
              <MapPin size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
              स्थायी पता / Permanent Address
            </h3>
            <div style={styles.gridTwo}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  ग्राम / Village *
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  पोस्ट / Post *
                </label>
                <input
                  type="text"
                  name="post"
                  value={formData.post}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  थाना / Police Station *
                </label>
                <input
                  type="text"
                  name="policeStation"
                  value={formData.policeStation}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  जिला / District *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  पिन कोड / PIN Code *
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{6}"
                  style={styles.input}
                  placeholder="6-digit PIN code"
                />
              </div>
            </div>
          </div>

          {/* Allowed Visitors */}
          <div>
            <h3 style={styles.sectionTitle}>
              <Users size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
              छात्रा से मिलने वाले का नाम / Names of Persons Allowed to Meet
            </h3>
            <div style={styles.gridTwo}>
              {[1, 2, 3, 4].map((num) => (
                <div key={num} style={styles.formGroup}>
                  <label style={styles.label}>
                    व्यक्ति {num} / Person {num}
                  </label>
                  <input
                    type="text"
                    name={`allowedPerson${num}`}
                    value={formData[`allowedPerson${num}`]}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Coaching Details */}
          <div>
            <h3 style={styles.sectionTitle}>
              <GraduationCap size={20} style={{display: 'inline', marginRight: '0.5rem'}} />
              कोचिंग विवरण / Coaching Details
            </h3>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} style={styles.coachingCard}>
                <p style={styles.coachingTitle}>कोचिंग {num} / Coaching {num}</p>
                <div style={styles.gridTwo}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      नाम एवं समय / Name & Time
                    </label>
                    <input
                      type="text"
                      name={`coaching${num}Name`}
                      value={formData[`coaching${num}Name`]}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      पता / Address
                    </label>
                    <input
                      type="text"
                      name={`coaching${num}Address`}
                      value={formData[`coaching${num}Address`]}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div>
            <h3 style={styles.sectionTitle}>
              हस्ताक्षर / Signatures
            </h3>
            <div style={styles.gridTwo}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  छात्रा का हस्ताक्षर / Student Signature *
                </label>
                <input
                  type="text"
                  name="studentSignature"
                  value={formData.studentSignature}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="Type name as signature"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  पिता/माता का हस्ताक्षर / Parent Signature *
                </label>
                <input
                  type="text"
                  name="parentSignature"
                  value={formData.parentSignature}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="Type name as signature"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={styles.buttonCenter}>
            <button
              type="submit"
              style={styles.button}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Printer size={24} />
              Generate PDF / पीडीएफ बनाएं
            </button>
          </div>
        </form>

    {/* Rules Section for Display (always shown in Hindi) */}
    <div style={styles.card} className="no-print">
      <h3 style={{...styles.rulesTitle, fontSize: '1.5rem', color: '#9333ea', marginBottom: '1rem'}}>हॉस्टल नियम एवं शर्तें</h3>
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
          <p><strong>13.</strong> हॉस्टल खाली करने के लिए एक महीने का नोटिस देना अनिवार्य है; अन्यथा अगले माह का शुल्क लिया जाएगा।</p>
      </div>
    </div>

      </div>
    </div>
  );
};

export default HostelAdmissionForm;