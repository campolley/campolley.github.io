// Client-side generation of an Excel workbook (SheetJS) and a memo PDF (jsPDF)
// Keep this file small and easy to customize for your portfolio.

(() => {
  // Utilities
  const $ = (sel) => document.querySelector(sel);
  const descriptionEl = $('#description');
  const hasDescription = Boolean(descriptionEl);
  const memoPreview = $('#memoPreview');
  // Fallback storage for when description element is removed
  let fallbackDescription = '';
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Restore description from localStorage if present (only when element exists)
  const STORAGE_KEY = 'portfolio_description_v1';
  if (hasDescription) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) descriptionEl.value = saved;

    descriptionEl.addEventListener('input', () => {
      localStorage.setItem(STORAGE_KEY, descriptionEl.value);
      updateMemoPreview();
    });
  } else {
    // set fallback from storage if present for downloads
    fallbackDescription = localStorage.getItem(STORAGE_KEY) || '';
  }

  function getDescriptionText() {
    if (hasDescription) return descriptionEl.value.trim();
    return (fallbackDescription || '').trim();
  }

  function updateMemoPreview() {
    const text = getDescriptionText() || 'Executive memo summary will appear here. Provide context, assumptions, and key recommendations.';
    if (memoPreview) memoPreview.textContent = text;
  }

  updateMemoPreview();

  // Download an existing Excel file that lives in the `docs` folder.
  // Update EXCEL_FILE if you rename the file in the docs directory.
  const EXCEL_FILE = 'practiceLBO - CAVA.xlsx';
  function downloadExcel() {
    const url = encodeURI(EXCEL_FILE); // relative to the docs root
    const a = document.createElement('a');
    a.href = url;
    a.download = EXCEL_FILE;
    // For Safari support, open in same tab if download attribute isn't honored
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Hook download PDF (using jsPDF UMD)
  function downloadPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit:'pt',format:'letter'});
    const margin = 48;
    // Header
    doc.setFontSize(18);
    doc.setTextColor(10, 30, 40);
    doc.text('Executive Memo', margin, 72);

    // Subheader / contact line
    doc.setFontSize(10);
    const contactLine = 'Prepared for: Hiring Manager · Prepared by: [Your Name]';
    doc.setTextColor(90, 98, 108);
    doc.text(contactLine, margin, 92);

    // Draw a light line
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, 100, doc.internal.pageSize.width - margin, 100);

    // Body text (description)
    doc.setFontSize(11);
    doc.setTextColor(30,40,50);
  const body = (getDescriptionText() || 'Provide a crisp 3-5 line executive summary here describing what the Excel workbook contains, highlight 2–3 key takeaways, and recommended next steps.');
    const split = doc.splitTextToSize(body, doc.internal.pageSize.width - margin*2);
    doc.text(split, margin, 122);

    // Small footer with timestamp
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text('Generated from portfolio template', margin, doc.internal.pageSize.height - 40);
    doc.text(new Date().toLocaleString(), doc.internal.pageSize.width - margin - 120, doc.internal.pageSize.height - 40);

    doc.save('Campolley_Memo.pdf');
  }

  // Add functionality to download the static PDF file
  const PDF_FILE = 'CAVA LBO Memo.pdf';
  function downloadStaticPdf() {
    const url = encodeURI(PDF_FILE); // relative to the docs root
    const a = document.createElement('a');
    a.href = url;
    a.download = PDF_FILE;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Wire the download Excel button to serve the static file in `docs/`.
  const downloadExcelBtn = document.querySelector('#downloadExcel');
  if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', downloadExcel);
  ['#downloadPdf','#downloadPdf2'].forEach(id => {
    const el = document.querySelector(id);
    if (el) el.addEventListener('click', () => {
      downloadPdf();
    });
  });
  const downloadPdfBtn = document.querySelector('#downloadPdf');
  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', downloadStaticPdf);

})();
