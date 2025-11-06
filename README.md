# Finance deliverables website

This repository hosts a single-page portfolio template that makes it easy for hiring managers to download your deliverables.

Key points
- The Excel model is included as a static file in `docs/` (file: `practiceLBO - CAVA.xlsx`). Clicking the "Download Excel" button serves that file directly.
- The one-page memo PDF is generated client-side using jsPDF and pulls its content from a saved description (if present) or a default memo body.
- The project previously used SheetJS (xlsx) to generate Excel files in-browser; that dependency has been removed and the Excel file is supplied directly.

Preview locally

```bash
# Serve the docs folder and open http://localhost:8000
python3 -m http.server --directory docs 8000
```

Customization
- Replace `docs/practiceLBO - CAVA.xlsx` with your own model (update the filename in `docs/assets/script.js` if you rename it).
- Edit `docs/assets/script.js` to change the memo header/footer or to embed different behavior for downloads.

If you want me to also remove `jsPDF` and convert the memo to a static PDF file in `docs/`, I can do that next.