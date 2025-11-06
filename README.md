# Finance deliverables website template

This repository contains a single-page website template designed to impress finance hiring managers. It generates downloadable deliverables client-side: an Excel workbook (.xlsx) and a one-page memo (PDF). No server required.

Files added/important paths:

- `docs/index.html` — The single-page template.
- `docs/assets/style.css` — Styles for the page.
- `docs/assets/script.js` — JavaScript that generates the Excel and PDF files using SheetJS and jsPDF (CDN).

How it works:

- Click “Download Excel” and the page uses SheetJS (xlsx) loaded from CDN to create a small workbook with `Summary`, `Projections`, and `Scenarios` sheets and downloads it.
- Click “Download Memo” and the page uses jsPDF (loaded from CDN) to create a simple one-page memo populated with the text in the description box.

Customize:

- Edit `docs/assets/script.js` to change sample data or add new sheets.
- Edit the description on the page — it is saved to localStorage and used in the PDF.

To preview locally:

1. From the workspace root, serve the `docs` folder with a simple HTTP server. For example (macOS):

```bash
# from this repo root
python3 -m http.server --directory docs 8000
# then open http://localhost:8000 in your browser
```

2. Click the download buttons on the page.

Notes:

- This is a template — replace sample numbers and text with your real work. Consider adding charts (SheetJS can create data, charts are best produced in Excel itself) or export PNGs if you want to show visualizations on the page.
- If you want to generate richer Excel files (formulas, formats, multi-sheet complex models), consider adding the SheetJS Pro or server-side generation.
# campolley.github.io
<<<<<<< HEAD
Website currently displaying an LBO model and accompanying memo that I built to display for job application purposes. Enjoy!
=======
Currently displaying an LBO model and memo that I created for job applications
>>>>>>> bcf5318 (Changing up everything)
