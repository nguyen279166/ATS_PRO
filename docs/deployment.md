# Deployment Guide

This project is split into a static Vite frontend and a Node/Express backend.
Deploy them as two services that share the same PostgreSQL database and
Cloudinary account.

## 1. Required Services

- PostgreSQL database: Neon, Supabase, Railway, Render, or similar.
- Backend host: Render, Railway, Fly.io, or any Node host.
- Frontend host: Vercel, Netlify, Cloudflare Pages, or similar.
- Cloudinary account for avatar and CV storage.
- Gmail app password if email notifications are enabled.

## 2. Backend Environment

Set these variables on the backend host:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
PORT=3001
BASE_URL=https://your-backend.example.com
CLIENT_URL=https://your-frontend.example.com
# Trusted reverse-proxy hop count. Render is also auto-detected as one hop.
TRUST_PROXY=

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
```

`CLIENT_URL` is used by CORS. For multiple frontend domains, separate them with
commas:

```env
CLIENT_URL=https://ats.example.com,https://ats-preview.example.com
```

`TRUST_PROXY` makes IP-based rate limits use the real client address. Render's
`RENDER=true` environment is detected automatically; set the trusted hop count
explicitly on other reverse-proxy hosts and leave it empty for direct traffic.
Never set `TRUST_PROXY=true`; use a numeric hop count or an explicit proxy
allowlist so clients cannot spoof forwarding headers.

## 3. Backend Build Commands

From the `server` directory:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

On Render/Railway-style platforms, use:

```bash
npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
```

Start command:

```bash
npm start
```

## 4. Frontend Environment

Set this on the frontend host:

```env
VITE_BASE_URL=https://your-backend.example.com
```

Frontend build command:

```bash
npm ci
npm run build
```

Publish directory:

```text
dist
```

## 5. Docker Local Production Check

Use Docker after normal development to verify the production-style build:

```bash
docker compose up --build -d
```

Then open:

```text
http://localhost:5173
```

Docker Compose reads backend secrets from `server/.env`.

## 6. Smoke Test Checklist

After every deploy, verify:

- `GET /api/health` returns OK.
- Login works with a seeded/demo HR account.
- Jobs load on the public landing page.
- Kanban board opens for a job.
- Avatar upload stores an image in Cloudinary `ats-pro/avatars`.
- CV upload stores a raw asset in Cloudinary `ats-pro/cv`.
- CV download keeps the original file name and extension.
- Password reset email works if Gmail variables are configured.

## 7. Common Deploy Issues

### Frontend cannot call backend

Check:

- `VITE_BASE_URL` points to the backend URL.
- Backend `CLIENT_URL` contains the deployed frontend URL.
- `TRUST_PROXY` matches the reverse-proxy hop count (Render defaults to `1`).
- Backend is reachable at `/api/health`.

### Prisma client missing

Make sure the backend build runs:

```bash
npx prisma generate
```

### Database schema is outdated

Run migrations on deploy:

```bash
npx prisma migrate deploy
```

### Files do not appear in Cloudinary folders

CVs are raw assets and should appear under:

```text
ats-pro/cv
```

Avatars are image assets and should appear under:

```text
ats-pro/avatars
```

If Cloudinary API shows the asset but the UI folder does not, check that the
upload sets both `folder` and `public_id` correctly.
