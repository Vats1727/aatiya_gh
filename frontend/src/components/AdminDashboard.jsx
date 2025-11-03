import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Edit, Check, X, Trash, Menu } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useResponsiveStyles } from '../utils/responsiveStyles';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const baseStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)',
      padding: '1rem',
      boxSizing: 'border-box',
      width: '100%',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    },
    header: {
      background: 'white',
      padding: '1rem',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
    },
    title: {
      color: '#db2777',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      margin: 0,
      flex: 1,
      minWidth: 'max-content',
    },
    headerActions: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      width: '100%',
      '@media (min-width: 640px)': {
        width: 'auto',
      },
    },
    button: {
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.25rem',
      fontSize: '0.9375rem',
      minHeight: '48px',
      minWidth: '48px',
      ':hover': {
        transform: 'translateY(-2px)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
      ':disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none',
      },
    },
    addButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
      color: 'white',
    },
    logoutButton: {
      background: '#4b5563',
      color: 'white',
    },
    menuButton: {
      background: 'transparent',
      color: '#6b21a8',
      padding: '0.5rem',
      '@media (min-width: 768px)': {
        display: 'none',
      },
    },
    tableWrapper: {
      width: '100%',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
    table: {
      width: '100%',
      minWidth: '600px',
      borderCollapse: 'collapse',
    },
    th: {
      background: '#f3e8ff',
      padding: '1rem',
      textAlign: 'left',
      color: '#6b21a8',
      fontWeight: '600',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '1rem',
      borderTop: '1px solid #f3f4f6',
      verticalAlign: 'middle',
    },
    actionButton: {
      padding: '0.5rem',
      border: 'none',
      borderRadius: '0.375rem',
      margin: '0.125rem',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '36px',
      minHeight: '36px',
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'scale(1.1)',
      },
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6b21a8',
      fontSize: '1.125rem',
    },
    error: {
      background: '#fee2e2',
      color: '#b91c1c',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      borderLeft: '4px solid #dc2626',
    },
    statusBadge: {
      padding: '0.375rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500',
      display: 'inline-block',
      textAlign: 'center',
      minWidth: '80px',
    },
    pendingBadge: {
      background: '#fffbeb',
      color: '#b45309',
      border: '1px solid #fcd34d',
    },
    approvedBadge: {
      background: '#ecfdf5',
      color: '#065f46',
      border: '1px solid #6ee7b7',
    },
    rejectedBadge: {
      background: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fca5a5',
    },
    mobileCard: {
      display: 'none',
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      padding: '1rem',
      marginBottom: '1rem',
      border: '1px solid #e5e7eb',
    },
    mobileCardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #f3f4f6',
      '&:last-child': {
        borderBottom: 'none',
        marginBottom: 0,
        paddingBottom: 0,
      },
    },
    mobileLabel: {
      fontWeight: '600',
      color: '#4b5563',
      minWidth: '100px',
    },
    mobileValue: {
      flex: 1,
      textAlign: 'right',
    },
    mobileActions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap',
      marginTop: '0.75rem',
      paddingTop: '0.75rem',
      borderTop: '1px solid #f3f4f6',
    },
    '@media (max-width: 1024px)': {
      container: {
        padding: '0.75rem',
      },
      header: {
        padding: '0.875rem',
        marginBottom: '1.25rem',
      },
      title: {
        fontSize: '1.375rem',
      },
      th: {
        padding: '0.875rem 0.75rem',
        fontSize: '0.875rem',
      },
      td: {
        padding: '0.875rem 0.75rem',
      },
      button: {
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
      },
    },
    '@media (max-width: 768px)': {
      container: {
        padding: '0.5rem',
      },
      header: {
        padding: '0.75rem',
        marginBottom: '1rem',
        flexDirection: 'column',
        alignItems: 'stretch',
      },
      title: {
        fontSize: '1.25rem',
        textAlign: 'center',
        marginBottom: '0.5rem',
      },
      headerActions: {
        justifyContent: 'center',
        gap: '0.5rem',
      },
      button: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
      },
      tableWrapper: {
        display: 'none',
      },
      mobileCard: {
        display: 'block',
      },
    },
    '@media (max-width: 480px)': {
      container: {
        padding: '0.25rem',
      },
      header: {
        padding: '0.75rem 0.5rem',
        marginBottom: '0.75rem',
      },
      title: {
        fontSize: '1.125rem',
      },
      headerActions: {
        flexDirection: 'column',
        gap: '0.5rem',
      },
      button: {
        width: '100%',
        padding: '0.625rem',
      },
      mobileCard: {
        padding: '0.75rem',
        marginBottom: '0.75rem',
      },
      mobileCardRow: {
        flexDirection: 'column',
        gap: '0.25rem',
        paddingBottom: '0.5rem',
        marginBottom: '0.5rem',
      },
      mobileLabel: {
        minWidth: 'auto',
        fontSize: '0.875rem',
      },
      mobileValue: {
        textAlign: 'left',
        fontSize: '0.9375rem',
      },
      mobileActions: {
        gap: '0.25rem',
      },
      actionButton: {
        minWidth: '32px',
        minHeight: '32px',
        padding: '0.375rem',
      },
    },
  };

  // Apply responsive styles
  const styles = useResponsiveStyles(baseStyles);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('adminAuthenticated');
      if (!isAuthenticated) {
        navigate('/admin');
      }
    };

    checkAuth();
    fetchStudents();
  }, [navigate]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin');
  };

  const handleStatusChange = async (id, status) => {
    try {
      // Use existing PUT /api/students/:id to update status (merge)
      const response = await fetch(`${API_BASE}/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state by matching `id` field
      setStudents(prev => prev.map(student => (
        (student.id === id) ? { ...student, status } : student
      )));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (id) => {
    // Redirect to form with editId query so StudentForm can load the data
    navigate(`/?editId=${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const ok = window.confirm('Are you sure you want to delete this record? This action cannot be undone.');
      if (!ok) return;
      const response = await fetch(`${API_BASE}/api/students/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete record');
      // Remove from local state
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = async (id) => {
    try {
      // Fetch student record and generate client-side PDF (same logic as Print)
      const res = await fetch(`${API_BASE}/api/students/${id}`);
      if (!res.ok) throw new Error('Failed to fetch student data');
      const student = await res.json();
      // Use the same client-side generator as handlePrint to download
      await handlePrint(student);
    } catch (err) {
      setError(err.message);
    }
  };

  // Client-side PDF generation using html2canvas + jsPDF
  const handlePrint = async (student) => {
    try {
      // Build printable HTML similar to StudentForm print layout
      const container = document.createElement('div');
      container.style.width = '900px';
      container.style.padding = '24px';
      container.style.background = '#fff';
      container.style.color = '#111827';
      container.style.fontFamily = 'Arial, Helvetica, sans-serif';
      container.style.boxSizing = 'border-box';

      const header = `
        <div style="text-align:center;border-bottom:2px solid #9ca3af;padding-bottom:12px;margin-bottom:16px;">
          <h1 style="margin:0;font-size:20px;">आतिया गर्ल्स हॉस्टल</h1>
          <h2 style="margin:0;font-size:14px;color:#374151;">ATIYA GIRLS HOSTEL</h2>
          <div style="font-size:12px;margin-top:6px;">रामपाड़ा कटिहार / Rampada Katihar</div>
          <div style="font-weight:700;margin-top:8px;font-size:13px;">नामांकन फॉर्म / ADMISSION FORM</div>
          <div style="font-size:11px;color:#6b7280;margin-top:6px;">Admission Date: ${student.admissionDate || ''}</div>
        </div>
      `;

      const photos = `
        <div style="display:flex;gap:16px;margin:12px 0;">
          <div style="flex:1;text-align:center;border:1px solid #e5e7eb;padding:8px;">
            <div style="font-weight:600;font-size:12px;margin-bottom:8px;">पिता/माता का फोटो / Parent Photo</div>
            ${student.parentPhoto ? `<img src="${student.parentPhoto}" style="max-width:160px;max-height:160px;object-fit:cover" />` : '<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;color:#9ca3af">No Photo</div>'}
          </div>
          <div style="flex:1;text-align:center;border:1px solid #e5e7eb;padding:8px;">
            <div style="font-weight:600;font-size:12px;margin-bottom:8px;">छात्रा का फोटो / Student Photo</div>
            ${student.studentPhoto ? `<img src="${student.studentPhoto}" style="max-width:160px;max-height:160px;object-fit:cover" />` : '<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;color:#9ca3af">No Photo</div>'}
          </div>
        </div>
      `;

      const infoRows = (label, value) => `
        <div style="display:flex;gap:8px;margin:6px 0;">
          <div style="width:200px;font-weight:700;color:#4b5563">${label}</div>
          <div style="flex:1">${value || ''}</div>
        </div>
      `;

      const info = `
        <div style="margin-top:12px;">
          ${infoRows("छात्रा का नाम / Student Name", student.studentName)}
          ${infoRows("माता का नाम / Mother's Name", student.motherName)}
          ${infoRows("पिता का नाम / Father's Name", student.fatherName)}
          ${infoRows("जन्म तिथि / Date of Birth", student.dob)}
          ${infoRows("मोबाइल नं (1)", student.mobile1)}
          ${infoRows("मोबाइल नं (2)", student.mobile2)}
          ${infoRows("ग्राम / Village", student.village)}
          ${infoRows("पोस्ट / Post", student.post)}
          ${infoRows("थाना / Police Station", student.policeStation)}
          ${infoRows("जिला / District", student.district)}
          ${infoRows("पिन कोड / PIN Code", student.pinCode)}
        </div>
      `;

      const allowed = `
        <div style="margin-top:12px;">
          <div style="font-weight:700;margin-bottom:6px;">छात्रा से मिलने वाले का नाम / Names of Persons Allowed to Meet</div>
          ${[1,2,3,4].map(i => `<div>${i}. ${student[`allowedPerson${i}`] || ''}</div>`).join('')}
        </div>
      `;

      const coaching = `
        <div style="margin-top:12px;">
          <div style="font-weight:700;margin-bottom:6px;">कोचिंग विवरण / Coaching Details</div>
          ${[1,2,3,4].map(i => `<div style="margin-bottom:6px;"><strong>कोचिंग ${i}:</strong> ${(student[`coaching${i}Name`]||'')} ${(student[`coaching${i}Address`] ? '- ' + student[`coaching${i}Address`] : '')}</div>`).join('')}
        </div>
      `;

      const signatures = `
        <div style="display:flex;gap:16px;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;">
          <div style="flex:1;text-align:center;padding-top:8px;">
            <div style="border-top:2px solid #9ca3af;padding-top:8px">${student.parentSignature || ''}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">पिता / माता का हस्ताक्षर</div>
          </div>
          <div style="flex:1;text-align:center;padding-top:8px;">
            <div style="border-top:2px solid #9ca3af;padding-top:8px">${student.studentSignature || ''}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">छात्रा का हस्ताक्षर</div>
          </div>
        </div>
      `;

      const rules = `
        <div style="margin-top:18px;font-size:12px;line-height:1.5">
          <div style="font-weight:700;margin-bottom:8px;text-align:center">हॉस्टल नियम एवं शर्तें</div>
          <ol>
            <li>हॉस्टल से बाहर निकलने और वापस आने पर हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है।</li>
            <li>कोचिंग के समय से 30 मिनट पूर्व कोचिंग के लिए निकलना और कोचिंग समाप्ति के 30 मिनट के भीतर वापस आना अनिवार्य है।</li>
            <li>छात्रा अपनी जगह की साफ-सफाई की जिम्मेदार है।</li>
            <li>कमरे से बाहर निकलते समय पंखे और लाइटें बंद करना अनिवार्य है; ऐसा न करने पर ₹50 का जुर्माना लगेगा।</li>
            <li>यदि छात्रा परिसर से बाहर जाने के बाद भाग जाती है तो हॉस्टल जिम्मेदार नहीं होगा।</li>
            <li>हॉस्टल की फीस प्रत्येक माह की 1 तारिख से 5 तारिख के बीच जमा करना अनिवार्य है।</li>
            <li>अभिभावकों से अनुरोध है कि वे अपने बच्चे से केवल रविवार को मिलें; मिलने वालों में माता-पिता और भाई-बहन ही शामिल होंगे।</li>
            <li>किसी भी विज़िट से पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है; विज़िटर्स को आवासीय क्षेत्रों में प्रवेश की अनुमति नहीं होगी।</li>
            <li>खिड़कियों के पास खड़ा होना सख्त मना है।</li>
            <li>खिड़की से कोई भी वस्तु बाहर न फेंके; उपलब्ध कचरा डिब्बे का प्रयोग करें।</li>
          </ol>
        </div>
      `;

      container.innerHTML = header + photos + info + allowed + coaching + signatures + rules;
      // Make sure it's visible (off-screen) so html2canvas can render styles
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render to canvas
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidthMm = pageWidth;
      const imgHeightMm = (imgProps.height * imgWidthMm) / imgProps.width;

      if (imgHeightMm <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
      } else {
        // If content is longer than one page, split into multiple pages
        let remainingHeight = imgHeightMm;
        let position = 0;
        const pxPerMm = (canvas.height / imgHeightMm);
        while (remainingHeight > 0) {
          const canvasPage = document.createElement('canvas');
          const pageCanvasHeightPx = Math.floor(pageHeight * pxPerMm);
          canvasPage.width = canvas.width;
          canvasPage.height = Math.min(pageCanvasHeightPx, canvas.height - position);
          const ctx = canvasPage.getContext('2d');
          ctx.drawImage(canvas, 0, position, canvas.width, canvasPage.height, 0, 0, canvas.width, canvasPage.height);
          const pageData = canvasPage.toDataURL('image/png');
          const pageImgProps = pdf.getImageProperties(pageData);
          const pageImgHeightMm = (pageImgProps.height * imgWidthMm) / pageImgProps.width;
          pdf.addImage(pageData, 'PNG', 0, 0, imgWidthMm, pageImgHeightMm);
          remainingHeight -= (pageImgHeightMm);
          position += canvasPage.height;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      pdf.save(`student-${student.id || 'export'}.pdf`);
      document.body.removeChild(container);
    } catch (err) {
      console.error('Print error', err);
      setError(err.message || 'Failed to generate PDF');
    }
  };

  const handleAddNew = () => {
    navigate('/');
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.header-actions')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusText = status || 'pending';
    return (
      <span style={{
        ...styles.statusBadge,
        ...(statusText === 'pending' ? styles.pendingBadge :
           statusText === 'approved' ? styles.approvedBadge :
           styles.rejectedBadge)
      }}>
        {statusText}
      </span>
    );
  };

  // Render action buttons
  const renderActionButtons = (student) => (
    <>
      <button
        style={{ ...styles.actionButton, background: '#10b981' }}
        onClick={(e) => {
          e.stopPropagation();
          handleStatusChange(student.id, 'approved');
        }}
        aria-label="Approve"
      >
        <Check size={16} color="white" />
      </button>
      <button
        style={{ ...styles.actionButton, background: '#ef4444' }}
        onClick={(e) => {
          e.stopPropagation();
          handleStatusChange(student.id, 'rejected');
        }}
        aria-label="Reject"
      >
        <X size={16} color="white" />
      </button>
      <button
        style={{ ...styles.actionButton, background: '#6366f1' }}
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(student.id);
        }}
        aria-label="Edit"
      >
        <Edit size={16} color="white" />
      </button>
      <button
        style={{ ...styles.actionButton, background: '#8b5cf6' }}
        onClick={(e) => {
          e.stopPropagation();
          handleDownload(student.id);
        }}
        aria-label="Download"
      >
        <Download size={16} color="white" />
      </button>
      
      <button
        style={{ ...styles.actionButton, background: '#ef4444' }}
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(student.id);
        }}
        aria-label="Delete"
      >
        <Trash size={16} color="white" />
      </button>
    </>
  );

  if (loading) {
    return <div style={styles.loading}>Loading student data...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="search"
                aria-label="Search students"
                placeholder="Search by name, contact or district"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  minWidth: '220px'
                }}
              />
              <button
                style={{ ...styles.button, ...styles.addButton }}
                onClick={handleAddNew}
              >
                Add New Student
              </button>
              <button
                style={{ ...styles.button, ...styles.logoutButton }}
                onClick={handleLogout}
              >
                Logout
              </button>
              
            </div>
          </div>
          
          <div 
            className="header-actions"
            style={{
              ...styles.headerActions,
              display: isMenuOpen ? 'flex' : 'none',
              '@media (min-width: 768px)': {
                display: 'flex',
              },
              alignItems: 'center'
            }}
          >
            {/* Collapsible actions (kept for compatibility with mobile menu toggle) */}
          </div>
        </header>

        {error && <div style={styles.error} role="alert">{error}</div>}

        {/* Apply search filter */}
        {/** compute visible students based on searchQuery **/}
        {
          (() => {})()
        }
        
        {/* Desktop Table View */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>District</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const q = String(searchQuery || '').trim().toLowerCase();
                const visibleStudents = students.filter(s => {
                  if (!q) return true;
                  return [s.studentName, s.mobile1, s.district].some(f => (String(f || '').toLowerCase().includes(q)));
                });
                return visibleStudents.map((student, idx) => (
                <tr key={`desktop-${student.id}`}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={styles.td}>{student.studentName}</td>
                  <td style={styles.td}>{student.mobile1}</td>
                  <td style={styles.td}>{student.district}</td>
                  <td style={styles.td}>
                    {renderStatusBadge(student.status)}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {renderActionButtons(student)}
                    </div>
                  </td>
                </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div style={{ '@media (min-width: 769px)': { display: 'none' } }}>
          {(() => {
            const q = String(searchQuery || '').trim().toLowerCase();
            const visibleStudents = students.filter(s => {
              if (!q) return true;
              return [s.studentName, s.mobile1, s.district].some(f => (String(f || '').toLowerCase().includes(q)));
            });
            return visibleStudents.map((student, idx) => (
            <div key={`mobile-${student.id}`} style={styles.mobileCard}>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>#</span>
                <span style={styles.mobileValue}>{idx + 1}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>Name</span>
                <span style={styles.mobileValue}>{student.studentName}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>Contact</span>
                <span style={styles.mobileValue}>{student.mobile1}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>District</span>
                <span style={styles.mobileValue}>{student.district}</span>
              </div>
              <div style={styles.mobileCardRow}>
                <span style={styles.mobileLabel}>Status</span>
                <span style={styles.mobileValue}>
                  {renderStatusBadge(student.status)}
                </span>
              </div>
              <div style={styles.mobileActions}>
                {renderActionButtons(student)}
              </div>
            </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;