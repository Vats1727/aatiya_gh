import { generatePdfFromHtmlString } from './pdf';
import { renderStudentPrintHtml, renderRulesHtml } from './printTemplate';

export const downloadStudentPdf = async (studentData) => {
  try {
  // Generate the HTML for the form and rules and combine
  const formHtml = renderStudentPrintHtml(studentData) || '';
  const rulesHtml = renderRulesHtml ? renderRulesHtml(studentData) : '';

  // Combine into a single HTML string so the PDF generator renders both pages.
  // Note: `formHtml` already includes a page-break (page-break-after) so we must NOT
  // add an extra empty page-break element here — doing so created an unwanted blank page.
  const combinedHtml = `${formHtml}${rulesHtml}`;

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
