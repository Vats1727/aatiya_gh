Vercel deployment and environment variables

1. Build settings

- Root directory: frontend
- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist

2. Required environment variable

- VITE_API_BASE
  - Value: https://aatiya-gh-backend.onrender.com
  - Purpose: Base URL of the backend API (Render service)
  - Add this under Project Settings → Environment Variables (Preview & Production)

3. Optional local testing

- Create `frontend/.env.local` with the same key when running `npm run dev` locally.

4. SPA routing

- `vercel.json` is included to rewrite all routes to `index.html` so React Router works on deep links.
