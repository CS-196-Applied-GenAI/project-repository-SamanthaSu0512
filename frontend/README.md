# Chirper frontend

React (Vite) + React Router frontend for the Chirper app. Uses CSS Modules and session cookies for auth.

## Prerequisites

- **Backend** must be running on **port 3000** with the database set up. See the project root for backend and database setup.
- Node.js 18+

## Scripts

- **`npm run dev`** — Start the Vite dev server (default: http://localhost:5173). API requests to `/api` and `/uploads` are proxied to the backend at http://localhost:3000.
- **`npm run build`** — Production build; output in `dist/`.
- **`npm run preview`** — Serve the production build locally.
- **`npm run test`** — Run Vitest tests once.
- **`npm run test:watch`** — Run Vitest in watch mode.
- **`npm run test:coverage`** — Run tests with coverage report (text + HTML in `coverage/`). Assignment uses overall coverage (60%+ = full points); thresholds are set so coverage must not drop below 60% lines/statements/functions, 55% branches.

## API and proxy

- All API calls use **`credentials: 'include'`** so session cookies are sent. The app expects to be served from the same origin as the API in development (Vite proxies `/api` and `/uploads` to the backend).
- In development, ensure the backend is running on port 3000 and the database is configured; otherwise login, feed, and other API calls will fail.

## Routes

- `/login`, `/signup` — Auth (guests only).
- `/` — Home feed (protected).
- `/compose` — New tweet (protected).
- `/tweet/:id/reply` — Reply to a tweet (protected).
- `/tweet/:id/replies` — View replies (protected).
- `/profile` — Current user profile (protected).
- `/profile/:username` — User profile by username (protected).
- `*` — 404 (Not found).
