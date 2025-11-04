

export const renderStudentPrintHtml = (student = {}) => {
  const s = student || {};
  const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Main container with exact styling to match reference PDF
  const containerStyle = `
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 20mm 25mm 20mm 25mm;
    background: #fff;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    color: #000;
    line-height: 1.5;
  `;

  // Header with exact styling to match reference PDF
  const header = `
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="margin:0;font-size:24px;color:#000;font-weight:bold;text-decoration:underline;margin-bottom:5px;">
        आतिया गर्ल्स हॉस्टल / ATIYA GIRLS HOSTEL
      </h1>
      <div style="font-size:16px;margin-bottom:5px;">
        रामपाड़ा कटिहार / Rampada Katihar
      </div>
      <div style="font-size:18px;font-weight:bold;margin-bottom:15px;text-decoration:underline">
        HOSTEL ADMISSION FORM
      </div>ांकन फॉर्म / ADMISSION FORM</div>
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

  const formSection = (title, fields) => {
    return `
      <div style="margin-bottom:15px;">
        <h3 style="margin:0 0 10px 0;font-size:16px;color:#000;border-bottom:1px solid #000;padding-bottom:3px;">
          ${title}
        </h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:10px;">
          ${fields}
        </div>
      </div>
    `;
  };

  const formField = (label, value) => {
    if (!value) return '';
    return `
      <div style="margin-bottom:8px;">
        <div style="font-weight:bold;font-size:14px;">${label}:</div>
        <div style="border-bottom:1px solid #000;min-height:20px;padding:2px 5px;">${escapeHtml(value)}</div>
      </div>
    `;
  };

  const personalInfo = `
    ${formField('Name of Student', s.studentName)}
    ${formField("Father's Name", s.fatherName)}
    ${formField("Mother's Name", s.motherName)}
    ${formField('Date of Birth', s.dob)}
    ${formField('Gender', s.gender)}
    ${formField('Aadhar Number', s.aadharNumber)}
  `;

  const contactInfo = `
    ${formField('Mobile 1', s.mobile1)}
    ${formField('Mobile 2', s.mobile2 || 'N/A')}
    ${formField('Email', s.email || 'N/A')}
    ${formField('Address', `${s.village}, ${s.post}, ${s.policeStation}, ${s.district}, ${s.state || 'Bihar'} - ${s.pinCode}`)}
  `;

  const academicInfo = `
    ${formField('Class', s.class)}
    ${formField('School/College', s.schoolCollege || 'N/A')}
    ${formField('Course', s.course || 'N/A')}
    ${formField('Year/Semester', s.yearSemester || 'N/A')}
  `;

  const emergencyContact = `
    ${formField('Emergency Contact Name', s.emergencyName || 'N/A')}
    ${formField('Relation', s.emergencyRelation || 'N/A')}
    ${formField('Emergency Contact Number', s.emergencyNumber || 'N/A')}
    ${formField('Emergency Address', s.emergencyAddress || 'N/A')}
  `;

  const hostelInfo = `
    ${formField('Room No.', s.roomNumber || 'To be assigned')}
    ${formField('Admission Date', s.admissionDate || new Date().toLocaleDateString())}
    ${formField('Hostel Fee', s.hostelFee ? `₹${s.hostelFee}` : 'N/A')}
    ${formField('Payment Mode', s.paymentMode || 'N/A')}
  `;

  const info = `
    ${formSection('Personal Information', personalInfo)}
    ${formSection('Contact Information', contactInfo)}
    ${formSection('Academic Information', academicInfo)}
    ${formSection('Emergency Contact', emergencyContact)}
    ${formSection('Hostel Information', hostelInfo)}
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

export const renderRulesHtml = () => {
  return `
    <div style="padding:20px;max-width:210mm;margin:0 auto;background:white;min-height:297mm;box-sizing:border-box;position:relative;">
      <h2 style="text-align:center;color:#4f46e5;margin-bottom:20px;font-size:22px;padding-bottom:10px;border-bottom:2px solid #4f46e5">हॉस्टल नियम एवं शर्तें / HOSTEL RULES AND REGULATIONS</h2>
      <div style="font-size:14px;line-height:1.8;text-align:justify;margin-bottom:30px;color:#374151">
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
      <div style="position:absolute;bottom:40px;right:40px;text-align:right">
        <div style="display:inline-block;text-align:center">
          <div style="border-top:1px solid #000;width:250px;margin-left:auto;padding-top:5px">
            <p style="margin:5px 0;font-size:14px;font-weight:500">हॉस्टल इंचार्ज / Hostel Incharge</p>
            <p style="margin:5px 0 0;font-size:12px;color:#666">दिनांक / Date: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  `;
};
