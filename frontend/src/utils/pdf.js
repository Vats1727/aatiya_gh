import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePdfFromHtmlString(htmlString, fileName = 'document.pdf') {
  // create off-screen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '900px';
  container.style.padding = '16px';
  container.style.background = '#fff';
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  try {
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

    pdf.save(fileName);
  } finally {
    // cleanup
    document.body.removeChild(container);
  }
}
