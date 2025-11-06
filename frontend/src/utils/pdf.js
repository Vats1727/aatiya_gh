import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Generate a PDF from an HTML string. If a visible preview exists (class .print-content), capture it instead to match the UI.
export async function generatePdfFromHtmlString(htmlString, fileName = 'admission_form.pdf') {
  if (!htmlString) throw new Error('No HTML provided');

  // Prefer capturing the on-screen preview when present
  const previewEl = document.querySelector('.print-content');
  const usePreview = !!previewEl && previewEl.innerHTML && previewEl.innerHTML.trim().length > 0;

  // If the HTML contains an explicit page-break divider inserted by pdfUtils, render each part separately
  const pageBreakRegex = /<div[^>]*page-break-before[^>]*><\/div>/i;
  const hasExplicitBreak = pageBreakRegex.test(htmlString);

  // Helper to render a single html snippet to PDF (adds page when needed)
  const renderSnippetToPdf = async (pdf, snippetHtml, isFirstPage) => {
    // Create offscreen container for this snippet
    const snippetContainer = document.createElement('div');
    snippetContainer.style.position = 'fixed';
    snippetContainer.style.left = '-9999px';
    snippetContainer.style.top = '0';
    // Use a width that maps well to A4 at typical screen DPI
    snippetContainer.style.width = '794px';
    snippetContainer.style.padding = '16px';
    snippetContainer.style.background = '#fff';
    snippetContainer.innerHTML = snippetHtml;
    document.body.appendChild(snippetContainer);

    try {
      const canvas = await html2canvas(snippetContainer, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidthMm = pageWidth;
      const imgHeightMm = (imgProps.height * imgWidthMm) / imgProps.width;

      if (!isFirstPage) pdf.addPage();

      if (imgHeightMm <= pdf.internal.pageSize.getHeight()) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
      } else {
        // Split long canvas into multiple PDF pages
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pxPerMm = canvas.height / imgHeightMm;
        let remainingHeightPx = canvas.height;
        let positionPx = 0;
        while (remainingHeightPx > 0) {
          const pageCanvas = document.createElement('canvas');
          const pageCanvasHeightPx = Math.min(Math.floor(pageHeight * pxPerMm), remainingHeightPx);
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageCanvasHeightPx;
          const ctx = pageCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, positionPx, canvas.width, pageCanvasHeightPx, 0, 0, canvas.width, pageCanvasHeightPx);
          const pageData = pageCanvas.toDataURL('image/png');
          const pageImgProps = pdf.getImageProperties(pageData);
          const pageImgHeightMm = (pageImgProps.height * imgWidthMm) / pageImgProps.width;
          pdf.addImage(pageData, 'PNG', 0, 0, imgWidthMm, pageImgHeightMm);
          remainingHeightPx -= pageCanvasHeightPx;
          positionPx += pageCanvasHeightPx;
          if (remainingHeightPx > 0) pdf.addPage();
        }
      }

      return { success: true };
    } finally {
      if (snippetContainer && document.body.contains(snippetContainer)) document.body.removeChild(snippetContainer);
    }
  };

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  if (hasExplicitBreak) {
    // Ignore on-screen preview in this mode and render each piece individually from htmlString
    const parts = htmlString.split(/<div[^>]*page-break-before[^>]*><\/div>/i);
    for (let i = 0; i < parts.length; i++) {
      // Trim wrapper whitespace
      const part = parts[i].trim();
      await renderSnippetToPdf(pdf, part, i === 0);
    }
    pdf.save(fileName);
    return { success: true };
  }

  // Fallback: capture preview or full HTML in a single pass (legacy behavior)
  let container;
  let created = false;
  if (usePreview) {
    container = previewEl;
  } else {
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '900px';
    container.style.padding = '16px';
    container.style.background = '#fff';
    container.innerHTML = htmlString;
    document.body.appendChild(container);
    created = true;
  }

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidthMm = pageWidth;
    const imgHeightMm = (imgProps.height * imgWidthMm) / imgProps.width;

    if (imgHeightMm <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    } else {
      // Split into pages
      const pxPerMm = canvas.height / imgHeightMm;
      let remainingHeightPx = canvas.height;
      let positionPx = 0;
      while (remainingHeightPx > 0) {
        const pageCanvas = document.createElement('canvas');
        const pageCanvasHeightPx = Math.min(Math.floor(pageHeight * pxPerMm), remainingHeightPx);
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageCanvasHeightPx;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, positionPx, canvas.width, pageCanvasHeightPx, 0, 0, canvas.width, pageCanvasHeightPx);
        const pageData = pageCanvas.toDataURL('image/png');
        const pageImgProps = pdf.getImageProperties(pageData);
        const pageImgHeightMm = (pageImgProps.height * imgWidthMm) / pageImgProps.width;
        pdf.addImage(pageData, 'PNG', 0, 0, imgWidthMm, pageImgHeightMm);
        remainingHeightPx -= pageCanvasHeightPx;
        positionPx += pageCanvasHeightPx;
        if (remainingHeightPx > 0) pdf.addPage();
      }
    }

    pdf.save(fileName);
    return { success: true };
  } finally {
    if (created && container && document.body.contains(container)) document.body.removeChild(container);
  }
}
