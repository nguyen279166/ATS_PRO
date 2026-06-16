# ATS Pro

Full-stack applicant tracking system built as an internship portfolio project.
The app helps HR teams publish jobs, manage candidates through a Kanban hiring
pipeline, store notes/interviews/CVs, and export reports.

## Live Demo

- Frontend: https://ats-pro-five.vercel.app
- Backend health check: https://ats-pro-api.onrender.com/api/health

The backend is hosted on Render's free tier, so the first request after a long
idle period can take about 50 seconds while the service wakes up.

## Highlights

- Authentication with JWT and role-based access control for Admin and HR users.
- Job CRUD with public job listing and candidate application flow.
- Candidate management with pagination, filters, bulk actions, CV upload with
  Cloudinary/local fallback storage, notes, interviews, and Kanban status
  updates.
- Admin-only Excel/PDF export endpoints.
- End-to-end coverage with Playwright.
- Production-style environment configuration through `.env` files.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form,
  Zod, Axios, Recharts, Lucide icons.
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, Multer,
  Cloudinary, Nodemailer, PDFKit, XLSX.
- Testing and delivery: ESLint, TypeScript build checks, Playwright E2E,
  GitHub Actions CI, Docker.

## Project Structure

```text
src/              Frontend source
server/src/       Express API source
server/prisma/    Prisma schema and migrations
tests/e2e/        Playwright E2E tests
public/           Static assets
```

## Production Architecture

```mermaid
flowchart LR
  User["User / HR"] --> Vercel["Vercel\nReact + Vite"]
  Vercel --> Render["Render\nExpress API"]
  Render --> Neon["Neon\nPostgreSQL"]
  Render --> Cloudinary["Cloudinary\nCVs + avatars"]
  Render --> Gmail["Gmail SMTP\nPassword reset + notifications"]
```

Frontend requests use `VITE_BASE_URL` to reach the Render API. The backend
allows the deployed frontend through `CLIENT_URL` and stores relational data in
PostgreSQL, while uploaded CVs and avatars are stored in Cloudinary.

## Core Workflows

- Public candidates browse open roles and apply with contact information plus
  an optional CV file.
- HR users manage jobs, move candidates through a Kanban pipeline, add notes,
  schedule interviews, and upload/download CVs.
- Admin users can export candidate reports to Excel/PDF and access protected
  management actions.

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
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CV_FOLDER=ats-pro/cv
CLOUDINARY_AVATAR_FOLDER=ats-pro/avatars
```

Cloudinary variables are optional in local development. If they are not set, CVs
and avatars are saved under `server/uploads`.

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

GitHub Actions runs lint and production builds for both frontend and backend on
push and pull request.

## Docker

Build and run both services:

```bash
docker compose up --build -d
```

The frontend container serves the Vite build through Nginx on
`http://localhost:5173`; the backend runs on `http://localhost:3001`. Docker
Compose reads backend environment variables from `server/.env`.

## Deployment Notes

- Frontend can be deployed to Vercel, Netlify, or similar static hosting.
- Backend can be deployed to Render, Railway, Fly.io, or another Node host.
- PostgreSQL can be hosted on Neon, Supabase, Railway, or Render.
- Set `VITE_BASE_URL` to the deployed backend URL.
- Set backend CORS rules to allow the deployed frontend domain before sharing
  the demo link.
- See [`docs/deployment.md`](docs/deployment.md) for the deployment checklist.

## Portfolio Pitch

Suggested CV description:

> ATS Pro - Full-stack recruitment management system using React, TypeScript,
> Express, Prisma, PostgreSQL, JWT auth, RBAC, Kanban hiring pipeline,
> Cloudinary CV storage, reports export, Docker, GitHub Actions CI, and
> Playwright E2E tests.
