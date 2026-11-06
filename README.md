# Sonu & Kajal — Wedding Invitation

Plain HTML/CSS/JS invitation site with English, Hindi and Bhojpuri, Google Maps directions and two downloadable A4 PDF cards:

- **Family & Relatives** — formal invitation card + family & venue page
- **Friends** — fun party card + barati guide (route, departments, rules)

## Run
Serve the folder (needed for the pre-built PDFs to download):

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

To share with guests, upload the whole folder to any static host (GitHub Pages, Netlify, etc.).
Opening `index.html` directly also works; PDFs are then generated in the browser instead.

## PDFs
The ready-made PDFs are in `pdfs/` (3 languages × Family / Friends / Friends-with-special-department).
They are printed by Google Chrome, so text is sharp, selectable and never overlaps.

After editing `js/config.js` or `js/translations.js`, rebuild them:

```bash
npm install          # once (uses your installed Google Chrome)
npm run build:pdfs
```

Until you rebuild, the site notices the PDFs are out of date and generates cards in the browser instead.

## Update details
Edit `js/config.js` — names, phone numbers, addresses, venue coordinates/links, and
`date` / `muhurat` (leave `null` to show "To Be Announced"). Texts live in `js/translations.js`.

## Files
- `index.html`, `styles.css`, `script.js` — site structure, styles, interactions
- `js/config.js` — wedding details · `js/translations.js` — EN / HI / Bhojpuri text
- `js/ornaments.js` — SVG mandala, corners, toran, kalash
- `js/pdf.js` + `pdf.css` — PDF card layouts (shared by the build and the in-browser fallback)
- `tools/build-pdfs.mjs` — prints the PDFs into `pdfs/` with Chrome
- `vendor/` — jsPDF, html2canvas, qrcode-generator (MIT, loaded only for the in-browser fallback)
- `assets/images/` — web-optimised copies of `groom.png` / `bride.png` (originals untouched)
