// Simplified script to handle static file downloads
(() => {
  const $ = (sel) => document.querySelector(sel);

  // Update year dynamically
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Download an existing Excel file
  const EXCEL_FILE = 'practiceLBO - CAVA.xlsx';
  function downloadExcel() {
    const url = encodeURI(EXCEL_FILE);
    const a = document.createElement('a');
    a.href = url;
    a.download = EXCEL_FILE;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Download an existing PDF file
  const PDF_FILE = 'CAVA LBO Memo.pdf';
  function downloadPdf() {
    const url = encodeURI(PDF_FILE);
    const a = document.createElement('a');
    a.href = url;
    a.download = PDF_FILE;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Wire buttons to download functions
  const downloadExcelBtn = $('#downloadExcel');
  if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', downloadExcel);

  const downloadPdfBtn = $('#downloadPdf');
  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', downloadPdf);
})();
