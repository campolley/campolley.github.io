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

  // Sample data generator for Excel workbook
  function buildWorkbook() {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summary = [
      ['Metric','Value','Unit'],
      ['Revenue (Year 1)', 1250000,'USD'],
      ['Revenue (Year 2)', 1750000,'USD'],
      ['Revenue (Year 3)', 2300000,'USD'],
      ['EBITDA Margin', 0.22,'%'],
      ['Net Income', 320000,'USD']
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Projections sheet with sample months and simple growth
    const headers = ['Year','Revenue','COGS','Expenses','EBITDA'];
    const projections = [headers];
    const rev = [1250000,1750000,2300000];
    for (let i=0;i<3;i++){
      const cogs = Math.round(rev[i]*0.4);
      const exp = Math.round(rev[i]*0.2);
      const ebitda = rev[i]-cogs-exp;
      projections.push([`Year ${i+1}`,rev[i],cogs,exp,ebitda]);
    }
    const ws2 = XLSX.utils.aoa_to_sheet(projections);
    XLSX.utils.book_append_sheet(wb, ws2, 'Projections');

    // Add a small sensitivity table
    const sens = [
      ['Scenario','Revenue growth','EBITDA Margin'],
      ['Base','15%','22%'],
      ['Upside','25%','26%'],
      ['Downside','5%','18%']
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(sens);
    XLSX.utils.book_append_sheet(wb, ws3, 'Scenarios');

    return wb;
  }

  // Hook download Excel
  function downloadExcel() {
    const wb = buildWorkbook();
    // Use SheetJS to trigger a download
    XLSX.writeFile(wb, 'Campolley_Finance_Sample.xlsx');
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

  // Wire buttons (multiple buttons point to same functions for convenience)
  ['#downloadExcel','#downloadExcel2'].forEach(id => {
    const el = document.querySelector(id);
    if (el) el.addEventListener('click', () => {
      downloadExcel();
    });
  });
  ['#downloadPdf','#downloadPdf2'].forEach(id => {
    const el = document.querySelector(id);
    if (el) el.addEventListener('click', () => {
      downloadPdf();
    });
  });

})();
