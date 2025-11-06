import { generatePdfFromHtmlString } from './pdf';
import { renderStudentPrintHtml, renderRulesHtml } from './printTemplate';

export const downloadStudentPdf = async (studentData) => {
  try {
  // Generate the HTML for the form and rules and combine
  const formHtml = renderStudentPrintHtml(studentData) || '';
  const rulesHtml = renderRulesHtml ? renderRulesHtml(studentData) : '';

  // Combine into a single HTML string so the PDF generator renders both pages.
  // The PDF generator looks for an explicit empty divider with a
  // `page-break-before` style to split the HTML into separate render
  // snippets. Insert that divider so we render the form and rules as two
  // independent canvases (this prevents any part of the rules from
  // appearing on the first rendered page).
  const pageBreakDivider = '<div style="page-break-before: always;"></div>';
  const combinedHtml = `${formHtml}${pageBreakDivider}${rulesHtml}`;

  // Create a meaningful filename
  const studentName = studentData.studentName || 'student';
  const formattedName = studentName.toLowerCase().replace(/\s+/g, '_');
  const fileName = `student_admission_${formattedName}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Generate and download the PDF containing both pages
  await generatePdfFromHtmlString(combinedHtml, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message || 'Failed to generate PDF' };
  }
};
