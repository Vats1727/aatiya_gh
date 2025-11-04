import { generatePdfFromHtmlString } from './pdf';
import { renderStudentPrintHtml, renderRulesHtml } from './printTemplate';

export const downloadStudentPdf = async (studentData) => {
  try {
    // Generate the HTML for the form and rules
    const formHtml = renderStudentPrintHtml(studentData);
    const rulesHtml = renderRulesHtml();
    
    // Create a meaningful filename
    const studentName = studentData.studentName || 'student';
    const formattedName = studentName.toLowerCase().replace(/\s+/g, '_');
    const fileName = `student_admission_${formattedName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Generate and download the PDF with both form and rules
    await generatePdfFromHtmlString(formHtml, rulesHtml, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message || 'Failed to generate PDF' };
  }
};
