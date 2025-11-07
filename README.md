## Aatiya Girls Hostel (aatiya_gh)

Comprehensive README describing this repository: a full-stack admission & hostel management app with bilingual (English/Hindi) support, QR-based anonymous student intake, PDF admission form generation, and an admin dashboard.

---

## Table of contents
- Project overview
- Architecture & tech stack
- Key features
- Data model (hostels & students)
- Important files and components
- APIs (server routes)
- Frontend: build & run (development & production)
- Backend: build & run
- Deployment notes

---

## Project overview

This repository implements a hostel admission system for Aatiya Girls Hostel. It supports:

- Admin dashboard for managing hostels (add/edit/delete), generating QR codes to collect student admissions, and viewing & approving student applications.
- Public QR-based flow: scanning a hosted QR URL allows an anonymous user to submit the admission form which is saved under the corresponding hostel.
- Bilingual (English + Hindi) hostel names & addresses. When Hindi versions are missing, the frontend can transliterate English → Devanagari at runtime.
- On-screen Hindi input keyboard for direct Hindi entry.
- Per-hostel monthly fee configuration and per-student applied fee at acceptance.
- PDF generation of the admission form (two-page: filled form + rules) using HTML templates.

This README summarizes how the app is organized, how to run it, and where the important code lives.

---

## Architecture & tech stack

- Frontend: React (JSX), Vite build tool. Code located in `frontend/`.
- Backend: Express (Node.js) with Firestore (Firebase) as the database. Code located in `backend/`.
- Authentication: JWT-based tokens for admin routes (stored in localStorage). Helper functions centralize header creation.
- PDF: HTML templates rendered to PDF via a client-side generator (html→canvas→PDF) using utilities in `frontend/src/utils/`.


---

## Key features (what this repo implements)

- Admin dashboard
  - Manage hostels: Add, edit (inline), delete.
  - Store bilingual fields: `name` / `name_hi`, `address` / `address_hi`.
  - Configure `monthlyFee` and `monthlyFeeCurrency` per hostel.
  - Generate and persist QR codes for public admission flows.

- Student admission
  - Public anonymous route to add a student via QR codes.
  - Admin view of student applications per hostel, with sorting, filtering, pagination, and mobile-friendly card view.
  - Preview student details and set an applied fee before accepting. Accepting writes `appliedFee` and `appliedFeeCurrency` into the student document and sets `status: 'approved'`.

- Multilingual support
  - Fields: hostels can have both `name_hi` and `name` (Hindi/English) and `address_hi` / `address`.
  - Runtime transliteration: when `name_hi` is absent, Sanscript transliteration from English to Devanagari runs in the browser as a fallback.
  - An on-screen Hindi keyboard component supports direct Hindi typing (matras, diacritics, numerals).

- PDF generation & preview
  - `renderStudentPrintHtml` and `renderRulesHtml` produce the HTML for the admission PDF.
  - The Students preview modal can render the HTML preview inline (iframe `srcDoc`) and the download action generates the actual PDF.

---

## Data model

The app stores Hostels under a user (admin) and Students under hostels. Common fields:

- Hostel document (under `/users/{uid}/hostels`):
  - `id` / `docId` — document identifier
  - `hostelId` — short code (string)
  - `name` (string) — English name
  - `name_hi` (string) — Hindi name (Devanagari)
  - `address` (string)
  - `address_hi` (string)
  - `monthlyFee` (number)
  - `monthlyFeeCurrency` (string, e.g., `INR`)
  - `nextStudentSeq` (number)
  - `qrDataUrl` (string) — hosted QR image URL
  - `createdAt`, `updatedAt` (timestamps)

- Student document (under `/users/{uid}/hostels/{hostelId}/students`):
  - `id` — document id
  - `combinedId` / `applicationNumber` / `studentId` — application identifiers
  - `studentName`, `fatherName`, `motherName`
  - `mobile1`, `mobile2`
  - `status` — `pending` | `approved` | `rejected`
  - `appliedFee` (number) — fee applied on accept
  - `appliedFeeCurrency` (string)
  - `hostelName`, `hostelNameHi`, `hostelAddress`, `hostelAddressHi` — copied/enriched for PDF convenience
  - photo fields, signatures, coaching info, and other form fields used by PDF template

Note: Some fields are added or merged client-side before generating the PDF (e.g., `hostelNameHi` may be fetched from a public endpoint then attached to the student object for printing).

---

## Important files and components

- Frontend
  - `frontend/src/components/AdminDashboard.jsx` — Manage hostels (list, add/edit, QR generation). Contains `monthlyFee` inputs and bilingual fields.
  - `frontend/src/components/StudentForm.jsx` — Admission form for students (used in QR flow and admin edit flow). Handles submission and robust navigation to success page.
  - `frontend/src/components/StudentsPage.jsx` — Admin listing of students per hostel. Implements preview modal, accept flow, pagination, search, sort, download PDF and inline PDF preview.
  - `frontend/src/components/HindiKeyboard.jsx` — On-screen Hindi virtual keyboard component.
  - `frontend/src/utils/printTemplate.js` — HTML templates used for PDF generation (`renderStudentPrintHtml`, `renderRulesHtml`). Now supports bilingual headers and address building.
  - `frontend/src/utils/pdfUtils.js` — Helper to combine HTML and call the PDF generator.

- Backend
  - `backend/index.js` / `backend/server.js` — Express server bootstrap and route mounting.
  - `backend/routes/hostels.js` — Hostels endpoints (admin and public). Public endpoints added for anonymous QR flows:
    - `GET /api/public/hostels/:hostelDocId?ownerUserId=...` — returns limited public metadata (name, name_hi, address, address_hi, qrDataUrl).
    - `POST /api/public/hostels/:hostelDocId/students?ownerUserId=...` — create a student anonymously for a hostel.
  - `backend/config/firebase.js`, `backend/serviceAccountKey.json` — Firestore initialization.

---

## APIs (summary)

Protected (admin) endpoints (require Authorization header `Bearer <token>`):

- GET /api/users/me — user profile
- GET /api/users/me/hostels — list hostels for current user
- POST /api/users/me/hostels — create hostel
- PUT /api/users/me/hostels/:hostelId — update hostel
- GET /api/users/me/hostels/:hostelId/students — list students for a hostel
- PUT /api/users/me/hostels/:hostelId/students/:studentId — patch student (used to accept with appliedFee)
- POST /api/users/me/hostels/:hostelId/qr — optionally persist generated QR image

Public endpoints for anonymous QR flow (ownerUserId query param typically required):

- GET /api/public/hostels/:hostelDocId?ownerUserId=... — returns limited hostel metadata (id, hostelId, name, name_hi, address, address_hi, qrDataUrl)
- POST /api/public/hostels/:hostelDocId/students?ownerUserId=... — create a student under this hostel (anonymous)

Note: exact route and response shapes can vary depending on backend implementations; review `backend/routes/hostels.js` for authoritative shapes.

---

## How to run (development)

Prerequisites: Node.js (16+ recommended), npm, Firebase service account (for backend), and optional environment variables.

1) Backend

```powershell
cd backend
npm install
# Ensure `serviceAccountKey.json` is present and `config/firebase.js` is configured
npm start
```

2) Frontend (development)

```powershell
cd frontend
npm install
npm run dev
# Open http://localhost:5173 (or the port shown by Vite)
```

3) Frontend (production build)

```powershell
cd frontend
npm run build
# Then serve `frontend/dist` with a static host for tests, or deploy to Vercel/Netlify
```

Environment variables
- Frontend reads `VITE_API_BASE` to point to the backend API (e.g., `https://aatiya-gh-backend.onrender.com`).

---

## Deployment notes

-Already deployed in Render and Vercel db is in Firebase.





