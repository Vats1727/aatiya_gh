import { generatePdfFromHtmlString } from './pdf';
import { renderStudentPrintHtml } from './printTemplate';

export const downloadStudentPdf = async (studentData) => {
  try {
    // Generate the HTML for the PDF
    const htmlContent = renderStudentPrintHtml(studentData);
    
    // Create a meaningful filename
    const studentName = studentData.studentName || 'student';
    const formattedName = studentName.toLowerCase().replace(/\s+/g, '_');
    const fileName = `student_admission_${formattedName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Generate and download the PDF
    await generatePdfFromHtmlString(htmlContent, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: 'Failed to generate PDF' };
  }
};
