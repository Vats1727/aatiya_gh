

export const renderStudentPrintHtml = (student = {}) => {
  const s = student || {};
  const escape = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Use the reference styles: two-page HTML (form page + affidavit/rules page).
  // Use A4 dimensions so the form occupies the full first page and rules always start on page 2
  // make the page container position:relative so we can absolutely position signatures
  const pageStyle = `width:210mm;min-height:297mm;margin:0 auto;background:white;padding:24px;box-sizing:border-box;font-family:Arial, sans-serif;color:#111827;page-break-after:always;position:relative;`;

  const photoBlock = (label, src) => `
    <div style="text-align:center">
      <div style="font-weight:600;margin-bottom:6px;font-size:12px;color:#374151">${label}</div>
      ${src ? `<img src="${src}" style="width:128px;height:128px;object-fit:cover;border-radius:6px;" />` : `<div style="width:128px;height:128px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;border-radius:6px;color:#9ca3af;font-weight:600">stick Passport size photo</div>`}
    </div>
  `;

  // helpers for time and date formatting
  const formatTime12 = (t) => {
    if (!t) return '';
    // accept HH:MM (24h) or already formatted; try to split
    const parts = String(t).split(':');
    if (parts.length < 2) return t;
    let hh = parseInt(parts[0], 10);
    const mm = (parts[1] || '00').padStart(2, '0');
    const suffix = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 === 0 ? 12 : hh % 12;
    return `${hh}:${mm} ${suffix}`;
  };

  const formatDateDDMMYYYY = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = dt.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  const formHtml = `
    <div style="${pageStyle}">
      <div style="text-align:center;border-bottom:3px solid #9ca3af;padding-bottom:8px;margin-bottom:12px;">
        <h1 style="margin:0;font-size:28px;color:#db2777">आतिया गर्ल्स हॉस्टल</h1>
        <h2 style="margin:0;font-size:20px;color:#ec4899">ATIYA GIRLS HOSTEL</h2>
        <p style="margin:6px 0;font-size:14px;color:#4b5563">रामपाड़ा कटिहार / Rampada Katihar</p>
        <div style="font-weight:700;margin-top:6px;font-size:16px;color:#111827">नामांकन फॉर्म / ADMISSION FORM</div>
        <div style="font-size:12px;color:#6b7280;margin-top:6px">दिनांक / Date: ${escape(formatDateDDMMYYYY(s.admissionDate))}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
        <div>${photoBlock('पिता/माता का फोटो / Parent Photo', s.parentPhoto)}</div>
        <div>${photoBlock('छात्रा का फोटो / Student Photo', s.studentPhoto)}</div>
      </div>

  <div style="margin-bottom:10px">
        <h3 style="background:#f3e8ff;padding:6px;border-radius:4px;font-weight:700;color:#9333ea;margin:0 0 8px 0">व्यक्तिगत जानकारी / Personal Information</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
          <div><strong>छात्रा का नाम:</strong> ${escape(s.studentName)}</div>
          <div><strong>माता का नाम:</strong> ${escape(s.motherName)}</div>
          <div><strong>पिता का नाम:</strong> ${escape(s.fatherName)}</div>
          <div><strong>जन्म तिथि:</strong> ${escape(formatDateDDMMYYYY(s.dob))}</div>
        </div>
      </div>

  <div style="margin-bottom:10px">
        <h3 style="background:#f3e8ff;padding:6px;border-radius:4px;font-weight:700;color:#9333ea;margin:0 0 8px 0">संपर्क जानकारी / Contact Information</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
          <div><strong>मोबाइल नं (1):</strong> ${escape(s.mobile1)}</div>
          <div><strong>मोबाइल नं (2):</strong> ${escape(s.mobile2) || 'N/A'}</div>
        </div>
      </div>

      <div style="margin-bottom:10px">
        <h3 style="background:#f3e8ff;padding:6px;border-radius:4px;font-weight:700;color:#9333ea;margin:0 0 8px 0">स्थायी पता / Permanent Address</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
          <div><strong>ग्राम:</strong> ${escape(s.village)}</div>
          <div><strong>पोस्ट:</strong> ${escape(s.post)}</div>
          <div><strong>थाना:</strong> ${escape(s.policeStation)}</div>
          <div><strong>जिला:</strong> ${escape(s.district)}</div>
          <div><strong>पिन कोड:</strong> ${escape(s.pinCode)}</div>
        </div>
      </div>

      <div style="margin-bottom:10px">
        <h3 style="background:#f3e8ff;padding:6px;border-radius:4px;font-weight:700;color:#9333ea;margin:0 0 8px 0">छात्रा से मिलने वाले का नाम / Allowed Visitors</h3>
        <div style="font-size:12px;">
          ${(() => {
            const arr = [];
            for (let i = 1; i <= 4; i++) {
              const v = String(s[`allowedPerson${i}`] || '').trim();
              if (v) arr.push(v);
            }
            if (arr.length === 0) return '';
            return arr.map((name, idx) => `<div>${idx + 1}. ${escape(name)}</div>`).join('');
          })()}
        </div>
      </div>

      <div style="margin-bottom:10px">
        <h3 style="background:#f3e8ff;padding:6px;border-radius:4px;font-weight:700;color:#9333ea;margin:0 0 8px 0">कोचिंग विवरण / Coaching Details</h3>
        <div style="font-size:12px;">
          ${[1,2,3,4].map(i => {
            const name = escape(s[`coaching${i}Name`]);
            const addr = escape(s[`coaching${i}Address`]);
            const startRaw = s[`coaching${i}Start`];
            const endRaw = s[`coaching${i}End`];
            const start = formatTime12(startRaw);
            const end = formatTime12(endRaw);
            const timePart = (start || end) ? ` - समय: ${start || ''}${(start && end) ? ` - ${end}` : (end ? ` - ${end}` : '')}` : '';
            return (name || addr || start || end) ? `<div style="border-bottom:1px solid #e5e7eb;padding:6px 0;margin-bottom:6px"><strong>कोचिंग ${i}:</strong> ${name ? `नाम: ${name}` : ''}${timePart} ${addr ? ` - पता: ${addr}` : ''}</div>` : '';
          }).join('')}
        </div>
      </div>

      <!-- Place a single student signature on the bottom-right of page 1 -->
      <div style="position:absolute;right:24px;bottom:24px;width:260px;text-align:right;">
        <div style="border-top:2px solid #9ca3af;padding-top:4px;min-height:36px">${escape(s.studentSignature) || ''}</div>
        <div style="font-size:12px;color:#666;margin-top:2px">छात्रा का हस्ताक्षर / Student Signature</div>
      </div>
    </div>
  `;

  return formHtml;
};
export const renderRulesHtml = (student = {}) => {
  const s = student || {};
  const escape = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // local date formatter (DD/MM/YYYY)
  const formatDateDDMMYYYY = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = dt.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  const parentName = s.fatherName || s.motherName || '';
  const daughterName = s.studentName || '';
  const village = s.village || '';
  const post = s.post || '';
  const police = s.policeStation || '';
  const district = s.district || '';
  const formattedDate = formatDateDDMMYYYY(s.admissionDate);

  return `
    <div style="max-width:900px;margin:0 auto;background:white;padding:24px;box-sizing:border-box;font-family:Arial, sans-serif;color:#111827;min-height:297mm;position:relative;">
      <div style="text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:10px;margin-bottom:12px;">
        <h2 style="color:#4f46e5;margin:0;font-size:18px;">हॉस्टल नियम एवं शर्तें / HOSTEL RULES AND REGULATIONS</h2>
      </div>

      <div style="font-size:14px;line-height:1.8;margin-top:10px;text-align:justify;color:#111827">
        <p style="margin-bottom:12px;">
          मैं <strong>${escape(parentName)}</strong> अपनी पुत्री / बहन <strong>${escape(daughterName)}</strong> ग्राम <strong>${escape(village)}</strong> पो॰ <strong>${escape(post)}</strong> थाना <strong>${escape(police)}</strong> जिला <strong>${escape(district)}</strong> को अपनी मर्ज़ी से आतिया गर्ल्स हॉस्टल में रख रहा/रही हूँ। मैं और मेरी पुत्री / बहन यह <u>${escape(formattedDate) || ''}</u> शपथ लेते हैं कि हॉस्टल के निम्नलिखित नियमों का पालन करेंगे।
        </p>
      </div>

  <div style="font-size:13px;line-height:1.8;margin-top:6px;white-space:pre-wrap;text-align:left;color:#111827">
        1. हॉस्टल से बाहर निकलने और वापस आने पर हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है.
        
        2. कोचिंग के समय से 30 मिनट पूर्व कोचिंग के लिए निकलना और कोचिंग समाप्ति के 30 मिनट के भीतर वापस आना अनिवार्य है.
        
        3. छात्रा अपनी जगह की साफ-सफाई की जिम्मेदार है.
        
        4. कमरे से बाहर निकलते समय पंखे और लाइटें बंद करना अनिवार्य है; ऐसा न करने पर ₹50 का जुर्माना लगेगा.
        
        5. यदि छात्रा परिसर से बाहर जाने के बाद भाग जाती है तो हॉस्टल जिम्मेदार नहीं होगा.
        
        6. हॉस्टल की फीस प्रत्येक माह की 1 तारिख से 5 तारिख के बीच जमा करना अनिवार्य है.
        
        7. अभिभावकों से अनुरोध है कि वे अपने बच्चे से केवल रविवार को मिलें; मिलने वालों में माता-पिता और भाई-बहन ही शामिल होंगे.
        
        8. किसी भी विज़िट से पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है; विज़िटर्स को आवासीय क्षेत्रों में प्रवेश की अनुमति नहीं होगी.
        
        9. खिड़कियों के पास खड़ा होना सख्त मना है.
        
        10. खिड़की से कोई भी वस्तु बाहर न फेंके; उपलब्ध कचरा डिब्बे का प्रयोग करें.
        
        11. छात्राओं को पढ़ाई पर ध्यान केंद्रित करना आवश्यक है.
        
        12. किसी भी समस्या या शिकायत की सूचना सीधे हॉस्टल इंचार्ज को दें.
        
        13. हॉस्टल खाली करने के लिए एक महीने का नोटिस देना अनिवार्य है; अन्यथा अगले माह का शुल्क लिया जाएगा.
      </div>
      <!-- signatures at bottom of page 2: both parent and student -->
      <div style="position:absolute;left:24px;right:24px;bottom:24px;display:flex;justify-content:space-between;gap:16px;">
        <div style="text-align:left;width:45%">
          <div style="border-top:2px solid #9ca3af;padding-top:8px;min-height:48px">${escape(s.parentSignature) || ''}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">पिता/माता का हस्ताक्षर / Parent Signature</div>
        </div>
        <div style="text-align:right;width:45%">
          <div style="border-top:2px solid #9ca3af;padding-top:8px;min-height:48px">${escape(s.studentSignature) || ''}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">छात्रा का हस्ताक्षर / Student Signature</div>
        </div>
      </div>
    </div>
  `;
};
