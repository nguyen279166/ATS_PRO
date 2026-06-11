# ATS Pro

Full-stack applicant tracking system built as an internship portfolio project.
The app helps HR teams publish jobs, manage candidates through a Kanban hiring
pipeline, store notes/interviews/CVs, and export reports.

## Highlights

- Authentication with JWT and role-based access control for Admin and HR users.
- Job CRUD with public job listing and candidate application flow.
- Candidate management with pagination, filters, bulk actions, CV upload, notes,
  interviews, and Kanban status updates.
- Admin-only Excel/PDF export endpoints.
- End-to-end coverage with Playwright.
- Production-style environment configuration through `.env` files.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form,
  Zod, Axios, Recharts, Lucide icons.
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, Multer,
  Nodemailer, PDFKit, XLSX.
- Testing: ESLint, TypeScript build checks, Playwright E2E.

## Project Structure

```text
src/              Frontend source
server/src/       Express API source
server/prisma/    Prisma schema and migrations
tests/e2e/        Playwright E2E tests
public/           Static assets
```

## Environment

Create the frontend env file:

```bash
cp .env.example .env
```

Create the backend env file:

```bash
cp server/.env.example server/.env
```

Required values:

```env
VITE_BASE_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
BASE_URL=http://localhost:3001
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Do not commit real `.env` files. If real secrets were ever shared publicly,
rotate the database password, JWT secret, and mail app password before demoing.

## Local Setup

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
cd ..
```

Run the backend:

```bash
cd server
npm run dev
```

Run the frontend in another terminal:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`; backend defaults to
`http://localhost:3001`.

## Quality Checks

Frontend build:

```bash
npm run build
```

Lint and build:

```bash
npm run check
```

Backend build:

```bash
cd server
npm run build
```

E2E tests require the backend and frontend to be running:

```bash
npm run test:e2e
```

## Deployment Notes

- Frontend can be deployed to Vercel, Netlify, or similar static hosting.
- Backend can be deployed to Render, Railway, Fly.io, or another Node host.
- PostgreSQL can be hosted on Neon, Supabase, Railway, or Render.
- Set `VITE_BASE_URL` to the deployed backend URL.
- Set backend CORS rules to allow the deployed frontend domain before sharing
  the demo link.

## Portfolio Pitch

Suggested CV description:

> ATS Pro - Full-stack recruitment management system using React, TypeScript,
> Express, Prisma, PostgreSQL, JWT auth, RBAC, Kanban hiring pipeline, CV upload,
> reports export, and Playwright E2E tests.
