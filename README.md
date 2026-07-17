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
- AI-assisted CV review for PDF, DOCX, PNG, and JPG files with OCR fallback,
  PostgreSQL `pgvector` retrieval, cited evidence, and an overall job-fit score.
- Separate embedding and chat providers: local Ollama can keep indexing free,
  while Gemini can provide stronger generated answers.
- Backend API coverage with Vitest and Supertest, plus end-to-end browser
  coverage with Playwright.
- Production-style environment configuration through `.env` files.

## Screenshots (Dark Mode)

### Public Careers Page

![ATS Pro public careers page](docs/screenshots/landing.png)

### Dashboard

![ATS Pro dashboard overview](docs/screenshots/dashboard.png)

### Jobs And Candidates

![ATS Pro job openings](docs/screenshots/jobs.png)

![ATS Pro candidates directory](docs/screenshots/candidates.png)

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form,
  Zod, Axios, Recharts, Lucide icons.
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, Multer,
  Cloudinary, Resend with Gmail SMTP fallback, PDFKit, XLSX.
- Testing and delivery: ESLint, TypeScript build checks, Vitest, Supertest,
  Playwright E2E, GitHub Actions CI, Docker.

## Project Structure

```text
src/pages/              Frontend route-level page composition
src/features/           Feature-scoped UI, hooks, types, and API helpers
src/components/         Shared frontend components
server/src/app.ts       Express app assembly, middleware, and route mounting
server/src/routes/      Thin HTTP route and middleware wiring
server/src/modules/     Domain controllers, services, and side-effect helpers
server/src/index.ts     Backend process entry point
server/prisma/          Prisma schema and migrations
tests/e2e/              Playwright E2E tests
public/                 Static assets
```

Frontend pages stay focused on composition while feature behavior lives under
`src/features`. Backend HTTP wiring is assembled in `server/src/app.ts` and
`server/src/routes`; each domain under `server/src/modules` separates request
handling from business logic and side effects.

## Production Architecture

```mermaid
flowchart LR
  User["User / HR"] --> Vercel["Vercel\nReact + Vite"]
  Vercel --> Render["Render\nExpress API"]
  Render --> Neon["Neon\nPostgreSQL"]
  Render --> Cloudinary["Cloudinary\nCVs + avatars"]
  Render --> Gemini["Gemini API\nCV embeddings + answers"]
  Local["Local dev"] --> Ollama["Ollama\nlocal CV AI"]
  Render --> Resend["Resend HTTPS API\nPassword reset + notifications"]
  Render -. "local fallback" .-> Gmail["Gmail SMTP"]
```

Frontend requests use `VITE_BASE_URL` to reach the Render API. The backend
allows the deployed frontend through `CLIENT_URL` and stores relational data in
PostgreSQL, while uploaded CVs and avatars are stored in Cloudinary. CV AI
search uses local Ollama or Gemini embeddings with PostgreSQL `pgvector`.

## Core Workflows

- Public candidates browse open roles and apply with contact information plus
  an optional CV file.
- HR users manage jobs, move candidates through a Kanban pipeline, add notes,
  schedule interviews, and upload/download CVs.
- Admin users can export candidate reports to Excel/PDF and access protected
  management actions.
- HR users can preview a CV in the browser and ask grounded questions about its
  skills, experience, and fit against the job description. Retrieval chunks stay
  internal; the UI presents the overall score, evidence, gaps, and interview
  suggestions.

## Demo Walkthrough

1. Open the public careers page and apply to an open role with a CV.
2. Register or sign in as an HR user, then open a job's Kanban board.
3. Move candidates through the hiring pipeline and open a candidate profile.
4. Preview the CV, add notes or an interview, and use the AI tab to compare the
   CV with the job description.
5. Sign in as an Admin to demonstrate protected export and delete actions.

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
CLIENT_URL=http://localhost:5173
RESEND_API_KEY=
RESEND_FROM_EMAIL=ATS PRO <onboarding@resend.dev>
# Optional local SMTP fallback:
GMAIL_USER=
GMAIL_APP_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CV_FOLDER=ats-pro/cv
CLOUDINARY_AVATAR_FOLDER=ats-pro/avatars
RAG_PROVIDER=ollama
RAG_EMBEDDING_PROVIDER=ollama
RAG_CHAT_PROVIDER=gemini
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.2:3b
GEMINI_API_KEY=
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_CHAT_MODELS=gemini-2.5-flash-lite,gemini-2.5-flash
```

Cloudinary variables are optional in local development. If they are not set, CVs
and avatars are saved under `server/uploads`.

Resend is the preferred production email provider because it uses HTTPS. Gmail
SMTP is an optional local fallback when `RESEND_API_KEY` is not configured.
`CLIENT_URL` is the frontend origin allowed by backend CORS and is also used in
password-reset links.

For free local CV AI, install Ollama and run:

```bash
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

`RAG_PROVIDER=ollama` and `RAG_PROVIDER=gemini` are strict and never silently
switch providers. Use `RAG_PROVIDER=auto` only when Ollama-to-Gemini fallback is
intentional. Ollama runs on your own machine, so it is best for local development
and demos. Hosted backend services such as Render cannot reach `localhost:11434`
on your laptop, so set `RAG_PROVIDER=gemini` on Render.
`RAG_EMBEDDING_PROVIDER` and `RAG_CHAT_PROVIDER` optionally override the shared
provider. A useful local setup is Ollama embeddings with Gemini chat; changing
only the chat provider never requires re-indexing the CV.
`GEMINI_CHAT_MODELS` accepts a comma-separated fallback list, so the backend can
try another free Gemini chat model if the first one is out of quota or
overloaded.

Do not commit real `.env` files. If real secrets were ever shared publicly,
rotate the database password, JWT secret, and mail app password before demoing.

## Local Setup

Install the exact frontend dependencies from the committed lockfile:

```bash
npm ci
```

Install the exact backend dependencies:

```bash
cd server
npm ci
```

Generate the Prisma client and apply the committed database migrations:

```bash
npx prisma generate
npx prisma migrate deploy
cd ..
```

Use `npx prisma migrate dev` instead of `migrate deploy` only when creating a
new migration during development.

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

On a fresh database, open `http://localhost:5173/register` and create an HR
account before using protected pages. The optional demo-data scripts require an
existing user and should be run from `server/` after registration:

```bash
npx ts-node src/seed.ts
npx ts-node src/seedCandidates.ts
```

The first script creates sample jobs owned by the earliest registered user; the
second adds sample candidates to those jobs. Neither script creates a user or a
hard-coded demo password.

### Optional CodeGraph MCP

[CodeGraph](https://github.com/colbymchenry/codegraph) is an optional local
development aid for exploring repository relationships through MCP. On Windows,
install and configure it interactively from PowerShell:

```powershell
irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 | iex
cd path\to\ats-system
codegraph init -i
```

Alternatively, run `npx @colbymchenry/codegraph`. Select Codex when prompted,
then restart Codex so the MCP server is discovered. The generated `.codegraph/`
index stays local and is ignored by Git.

## Quality Checks

Frontend lint and production build:

```bash
npm run check
```

Backend build and tests:

```bash
cd server
npm run check
```

Run only the backend tests:

```bash
cd server
npm test
```

E2E tests require the backend and frontend to be running:

```bash
npm run test:e2e
```

Verify the production backend container:

```bash
docker build server
```

Regenerate all README screenshots from the local app in dark mode:

```bash
npm run docs:screenshots
```

The screenshot script needs an existing local account; no account is created by
the seed scripts. Its legacy defaults are `admin@ats.com` / `Password123`, but
for a fresh clone set the credentials of the account you registered. PowerShell
example:

```powershell
$env:SCREENSHOT_EMAIL="your-account@example.com"
$env:SCREENSHOT_PASSWORD="your-password"
npm run docs:screenshots
```

GitHub Actions runs frontend lint/build, backend build/tests, and a backend
Docker build on every push and pull request.

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
- Set backend `CLIENT_URL` to the deployed frontend origin before sharing the
  demo link.
- See [`docs/deployment.md`](docs/deployment.md) for the deployment checklist.

## Portfolio Pitch

Suggested CV description:

> ATS Pro - Full-stack recruitment management system using React, TypeScript,
> Express, Prisma, PostgreSQL, JWT auth, RBAC, Kanban hiring pipeline,
> Cloudinary CV storage, CV AI search with Gemini embeddings and pgvector,
> reports export, Docker, GitHub Actions CI, Vitest/Supertest API tests, and
> Playwright E2E tests.
