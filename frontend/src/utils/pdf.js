import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePdfFromHtmlString(formHtml, rulesHtml, fileName = 'admission_form.pdf') {
  return new Promise(async (resolve, reject) => {
    try {
      // Create PDF with A4 size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Function to add a page with content and signature space
      const addPageWithContent = async (html, isLastPage = false) => {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm';
        container.style.padding = '20px';
        container.style.background = '#fff';
        container.innerHTML = html;
        document.body.appendChild(container);

        try {
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            imageTimeout: 15000
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgWidth = pageWidth - 20; // 10mm margin on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Add new page if not the first page
          if (pdf.internal.getNumberOfPages() > 1) {
            pdf.addPage();
          }

          // Add content to PDF
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');

          // Add signature space if it's the last page
          if (isLastPage) {
            const signatureY = imgHeight + 20;
            if (signatureY < 270) { // Check if there's space on current page
              addSignatureSpace(pdf, signatureY);
            } else {
              pdf.addPage();
              addSignatureSpace(pdf, 20);
            }
          }

        } finally {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }
      };

      // Function to add signature space
      const addSignatureSpace = (pdf, y) => {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const lineY = y + 10;
        
        // Student signature
        pdf.setFontSize(10);
        pdf.text('Student Signature', 30, lineY + 20);
        pdf.line(30, lineY + 22, 90, lineY + 22);
        
        // Parent/Guardian signature
        pdf.text('Parent/Guardian Signature', pageWidth - 90, lineY + 20);
        pdf.line(pageWidth - 90, lineY + 22, pageWidth - 30, lineY + 22);
        
        // Date
        pdf.text('Date:', pageWidth / 2 - 15, lineY + 40);
        pdf.line(pageWidth / 2 + 10, lineY + 40, pageWidth / 2 + 60, lineY + 40);
      };

      // Add form content (first page)
      await addPageWithContent(formHtml);
      
      // Add rules content (second page) with signature space
      await addPageWithContent(rulesHtml, true);

      // Save the PDF
      pdf.save(fileName);
      resolve({ success: true });

    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(new Error('Failed to generate PDF: ' + error.message));
    }
  });
}
