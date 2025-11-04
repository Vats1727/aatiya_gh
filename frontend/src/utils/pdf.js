import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePdfFromHtmlString(htmlString, fileName = 'document.pdf') {
  return new Promise((resolve, reject) => {
    try {
      // Create off-screen container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.padding = '20px';
      container.style.background = '#fff';
      container.innerHTML = htmlString;
      document.body.appendChild(container);

      // Give it a moment to render
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: true,
            backgroundColor: '#ffffff',
            imageTimeout: 15000,
            removeContainer: false
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgProps = pdf.getImageProperties(imgData);
          
          // Calculate dimensions to maintain aspect ratio
          const imgWidth = pageWidth - 20; // 10mm margin on each side
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
          
          // Add the image to the PDF
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');
          
          // Save the PDF
          pdf.save(fileName);
          resolve({ success: true });
        } catch (error) {
          console.error('Error in PDF generation:', error);
          reject(new Error('Failed to generate PDF: ' + error.message));
        } finally {
          // Cleanup
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }
      }, 500);
    } catch (error) {
      console.error('Error setting up PDF generation:', error);
      reject(new Error('Failed to set up PDF generation: ' + error.message));
    }
  });
}
