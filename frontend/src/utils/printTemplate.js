export const renderStudentPrintHtml = (student = {}) => {
  const s = student || {};
  const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Main container mirrors StudentForm printContainer and typography/colors
  const containerStyle = `max-width:900px;margin:0 auto;background:#fff;padding:24px;box-sizing:border-box;font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;color:#111827;`;

  const header = `
    <div style="text-align:center;border-bottom:2px solid #9ca3af;padding-bottom:12px;margin-bottom:16px;">
      <h1 style="margin:0;font-size:22px;color:#db2777;">आतिया गर्ल्स हॉस्टल</h1>
      <h2 style="margin:0;font-size:14px;color:#9333ea;letter-spacing:0.02em">ATIYA GIRLS HOSTEL</h2>
      <div style="font-size:12px;margin-top:6px;color:#374151">रामपाड़ा कटिहार / Rampada Katihar</div>
      <div style="font-weight:700;margin-top:8px;font-size:13px;color:#111827">नामांकन फॉर्म / ADMISSION FORM</div>
      <div style="font-size:11px;color:#6b7280;margin-top:6px;">Admission Date: ${escapeHtml(s.admissionDate)}</div>
    </div>
  `;

  const photos = `
    <div style="display:flex;gap:16px;margin:12px 0;flex-wrap:wrap;">
      <div style="flex:1 1 180px;text-align:center;border:1px solid #e5e7eb;padding:12px;border-radius:6px;background:#fafafa;">
        <div style="font-weight:600;font-size:12px;margin-bottom:8px;color:#374151">पिता/माता का फोटो / Parent Photo</div>
        ${s.parentPhoto ? `<img src="${s.parentPhoto}" style="width:150px;height:180px;object-fit:cover;border-radius:4px;" />` : '<div style="width:150px;height:180px;display:flex;align-items:center;justify-content:center;color:#9ca3af">No Photo</div>'}
      </div>
      <div style="flex:1 1 180px;text-align:center;border:1px solid #e5e7eb;padding:12px;border-radius:6px;background:#fafafa;">
        <div style="font-weight:600;font-size:12px;margin-bottom:8px;color:#374151">छात्रा का फोटो / Student Photo</div>
        ${s.studentPhoto ? `<img src="${s.studentPhoto}" style="width:150px;height:180px;object-fit:cover;border-radius:4px;" />` : '<div style="width:150px;height:180px;display:flex;align-items:center;justify-content:center;color:#9ca3af">No Photo</div>'}
      </div>
    </div>
  `;

  const infoRows = (label, value) => `
    <div style="display:flex;gap:12px;margin:8px 0;align-items:flex-start;">
      <div style="width:220px;font-weight:700;color:#4b5563">${label}</div>
      <div style="flex:1;color:#111827">${escapeHtml(value)}</div>
    </div>
  `;

  const info = `
    <div style="margin-top:12px;">
      ${infoRows("छात्रा का नाम / Student Name", s.studentName)}
      ${infoRows("माता का नाम / Mother's Name", s.motherName)}
      ${infoRows("पिता का नाम / Father's Name", s.fatherName)}
      ${infoRows("जन्म तिथि / Date of Birth", s.dob ? s.dob : '')}
      ${infoRows("मोबाइल नं (1)", s.mobile1)}
      ${infoRows("मोबाइल नं (2)", s.mobile2)}
      ${infoRows("ग्राम / Village", s.village)}
      ${infoRows("पोस्ट / Post", s.post)}
      ${infoRows("थाना / Police Station", s.policeStation)}
      ${infoRows("जिला / District", s.district)}
      ${infoRows("पिन कोड / PIN Code", s.pinCode)}
    </div>
  `;

  const allowed = `
    <div style="margin-top:12px;">
      <div style="font-weight:700;margin-bottom:6px;color:#4b5563">छात्रा से मिलने वाले का नाम / Names of Persons Allowed to Meet</div>
      ${[1,2,3,4].map(i => `<div style="margin:4px 0;">${i}. ${escapeHtml(s[`allowedPerson${i}`])}</div>`).join('')}
    </div>
  `;

  const coaching = `
    <div style="margin-top:12px;">
      <div style="font-weight:700;margin-bottom:6px;color:#4b5563">कोचिंग विवरण / Coaching Details</div>
      ${[1,2,3,4].map(i => `<div style="margin-bottom:6px;color:#111827"><strong>कोचिंग ${i}:</strong> ${escapeHtml(s[`coaching${i}Name`])} ${s[`coaching${i}Address`] ? '- ' + escapeHtml(s[`coaching${i}Address`]) : ''}</div>`).join('')}
    </div>
  `;

  const signatures = `
    <div style="display:flex;gap:24px;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;flex-wrap:wrap;">
      <div style="flex:1 1 300px;text-align:center;padding-top:8px;">
        <div style="border-top:2px solid #9ca3af;padding-top:12px;min-height:48px;font-weight:700">${escapeHtml(s.parentSignature)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:6px">पिता / माता का हस्ताक्षर</div>
      </div>
      <div style="flex:1 1 300px;text-align:center;padding-top:8px;">
        <div style="border-top:2px solid #9ca3af;padding-top:12px;min-height:48px;font-weight:700">${escapeHtml(s.studentSignature)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:6px">छात्रा का हस्ताक्षर</div>
      </div>
    </div>
  `;

  const rules = `
    <div style="margin-top:18px;font-size:13px;line-height:1.6;color:#374151">
      <div style="font-weight:700;margin-bottom:8px;text-align:center;color:#4b5563">हॉस्टल नियम एवं शर्तें</div>
      <ol style="margin-left:1rem;">
        <li>हॉस्टल से बाहर निकलने और वापस आने पर हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है।</li>
        <li>कोचिंग के समय से 30 मिनट पूर्व कोचिंग के लिए निकलना और कोचिंग समाप्ति के 30 मिनट के भीतर वापस आना अनिवार्य है।</li>
        <li>छात्रा अपनी जगह की साफ-सफाई की जिम्मेदार है।</li>
        <li>कमरे से बाहर निकलते समय पंखे और लाइटें बंद करना अनिवार्य है; ऐसा न करने पर ₹50 का जुर्माना लगेगा।</li>
        <li>यदि छात्रा परिसर से बाहर जाने के बाद भाग जाती है तो हॉस्टल जिम्मेदार नहीं होगा।</li>
        <li>हॉस्टल की फीस प्रत्येक माह की 1 तारिख से 5 तारिख के बीच जमा करना अनिवार्य है।</li>
        <li>अभिभावकों से अनुरोध है कि वे अपने बच्चे से केवल रविवार को मिलें; मिलने वालों में माता-पिता और भाई-बहन ही शामिल होंगे।</li>
        <li>किसी भी विज़िट से पहले हॉस्टल इंचार्ज से अनुमति लेना अनिवार्य है; विज़िटर्स को आवासीय क्षेत्रों में प्रवेश की अनुमति नहीं होगा।</li>
        <li>खिड़कियों के पास खड़ा होना सख्त मना है।</li>
        <li>खिड़की से कोई भी वस्तु बाहर न फेंके; उपलब्ध कचरा डिब्बे का प्रयोग करें।</li>
      </ol>
    </div>
  `;

  const full = `
    <div style="${containerStyle}">
      ${header}
      ${photos}
      ${info}
      ${allowed}
      ${coaching}
      ${signatures}
      ${rules}
    </div>
  `;

  return full;
};
