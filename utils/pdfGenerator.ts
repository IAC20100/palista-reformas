
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from an HTML element and initiates a download.
 * @param {string} elementId The ID of the HTML element to capture.
 * @param {string} fileName The desired file name for the downloaded PDF.
 */
export const generatePdfFromElement = async (elementId: string, fileName:string): Promise<void> => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`PDF generation failed: Element with ID '${elementId}' not found.`);
  }

  // We temporarily make the element visible for capture if it's positioned off-screen
  const originalStyle = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    zIndex: element.style.zIndex
  };
  element.style.position = 'absolute';
  element.style.left = '0';
  element.style.top = '0';
  element.style.zIndex = '-1'; // Put it behind everything

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Use a higher scale for better resolution
      useCORS: true, // Important for images from other origins
      logging: false,
      backgroundColor: '#ffffff', // Force white background
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / pdfWidth;
    const imgHeight = canvasHeight / ratio;

    let heightLeft = imgHeight;
    let position = 0;

    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add new pages if the content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);

  } catch (error) {
      console.error("Error during PDF generation:", error);
      throw error; // re-throw to be caught by the component
  } finally {
    // Restore original styles to hide the element again
    element.style.position = originalStyle.position;
    element.style.left = originalStyle.left;
    element.style.top = originalStyle.top;
    element.style.zIndex = originalStyle.zIndex;
  }
};