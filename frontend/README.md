# Frontend

Next.js 15 App Router + React 19 + Tailwind v4 + TypeScript.

**Port:** 3000
**Routes (planned):** `/login`, `/register`, `/worker/*`, `/verifier/*`, `/advocate/*`

## Setup

```bash
cp .env.example .env   # then fill in values
npm install
npm run dev
```

## Env vars (`NEXT_PUBLIC_` prefix is required for client-side access)

`NEXT_PUBLIC_AUTH_URL`, `NEXT_PUBLIC_EARNINGS_URL`, `NEXT_PUBLIC_ANOMALY_URL`, `NEXT_PUBLIC_GRIEVANCE_URL`, `NEXT_PUBLIC_ANALYTICS_URL`, `NEXT_PUBLIC_CERTIFICATE_URL`.

## Production build

```bash
npm run build
npm start
```

## Notes

- `NEXT_PUBLIC_*` vars are **baked at build time**. For a real deployment you must rebuild with the correct public URLs (can't change them post-build).
- The landing page (`/`) shows a live health grid that pings every backend service on mount.
