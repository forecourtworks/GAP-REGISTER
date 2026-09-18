# FSW × Ainushamsi — Combined Gap Register (Web App)

Mobile/tablet-first web app for the **Combined Equipment Condition & Regulatory Compliance Gap Register**. Generates an **A1 landscape PDF** aligned to the approved print design.

**Companies:** Forecourt Works Limited · Ainushamsi Energy Limited  
**Tagline:** Engineering Reliability into Every Forecourt

---

## Features

- **+ Asset** — add equipment once (name, Asset ID/Tag, manufacturer, model, serial, location, category)
- **+ NC** — multiple non-conformances per asset without repeating equipment identity on the PDF
- Each NC carries: finding, priority, risk, regulatory link, **required action**, WO Yes/No + number, target, responsibility, status
- **NC & Required Action** text auto-wraps; PDF uses **wider columns** so row height stays controlled
- **Save Draft** — `localStorage` + JSON download for transfer between devices
- **Finish & Share as PDF** — opens dual sign-off; **draw** on pad or **attach** signature image (same PDF placement)
- PDF structure: **Cover → Register sheet(s) → Sign-off → Back cover** (A1 landscape, dual border, navy/gold branding)
- Auto **continuation pages** when content exceeds one sheet
- Station dropdown for all **7 Ainushamsi sites** (still editable)

---

## Files

```
gap-register-app/
├── index.html           # UI
├── app-gap-register.js  # Logic + A1 PDF generator
├── logos.js             # Embedded AS + FSW logos for PDF
├── as_energy_logo.png   # Optional local assets
├── fsw_logo.png
├── fsw_logo_gold.png
└── README.md
```

---

## How to use

1. Open `index.html` in Chrome / Safari / Edge (tablet recommended for field sign-off).
2. For camera/share on a phone, host the folder on **HTTPS** (any static host).
3. Fill document meta → **+ Asset** → complete identity → **+ NC** as needed.
4. **Save Draft** anytime.
5. **Finish & Share as PDF** → complete names/dates → draw or attach signatures → **Generate & Share A1 PDF**.

---

## PDF layout rules

| Element | Behaviour |
|---------|-----------|
| Asset identity | Printed **once** per asset (navy band) |
| Each NC | One table row under that asset |
| Finding / Required Action | **Wide columns**, text wraps, row height grows with content only |
| Signatures | Drawn pad **or** uploaded image → same box on sign-off page |

---

## Draft format

JSON includes meta, assets[], NC arrays, and signatory name fields. Reload the app on the same browser to restore from `localStorage`, or import by replacing the saved draft file contents manually if needed.

---

## Technical

- Vanilla HTML/CSS/JS (no build step)
- CDN: Signature Pad, jsPDF
- Page size: **841 × 594 mm** (A1 landscape)

---

© Forecourt Works Limited — Controlled Document System · Rev 1.0 · 2026
