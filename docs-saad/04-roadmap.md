# FairGig — Development Roadmap

> Order of operations for a hackathon. Do things in this order so demos work end-to-end as early as possible.

---

## Phase 0 — Scaffolding (hour 0 → hour 2)

- [ ] Create folder structure per `01-architecture.md §6`.
- [ ] Top-level `README.md` with one start command per service.
- [ ] `.env.example` at repo root with all env vars (`JWT_SECRET`, DB URL, etc.).
- [ ] Postgres running locally; create `fairgig` DB; create schemas (`auth`, `earnings`, `grievance`).
- [ ] Stub each of the 6 services with a `GET /health → {status:"ok"}` route and a runnable start command.
- [ ] Frontend: `npm create vite@latest frontend -- --template react-ts`, add Tailwind, Router, TanStack Query, axios, Recharts. `/` shows "FairGig".

**Exit criteria:** I can `curl` a health check on ports 8001–8006 and load `http://localhost:5173`.

---

## Phase 1 — Auth + skeleton data (hour 2 → hour 5)

- [ ] Auth service: register, login, refresh, me. JWT HS256.
- [ ] Shared JWT validator (Python dep in `services/_shared_py/jwt_auth.py`; Node dep in grievance).
- [ ] `auth.users` table + migration.
- [ ] Frontend: login / register pages, auth context, protected routes, role-based redirect.
- [ ] Seed a worker, verifier, advocate account. Credentials tracked in `docs/06-demo-credentials.md`.

**Exit criteria:** I can register → log in as each role → hit a protected `/auth/me` from frontend.

---

## Phase 2 — Earnings logger + CSV import (hour 5 → hour 9)

- [ ] Earnings service: `POST /shifts`, `GET /shifts`, `PATCH`, `DELETE`, `POST /shifts/import`.
- [ ] Worker UI: "Log a shift" form (simple, big inputs for non-tech-savvy).
- [ ] Worker UI: shifts table with filtering by date / platform.
- [ ] CSV upload UI with sample CSV download link.
- [ ] CSV parser on backend (pandas) with error reporting per row.

**Exit criteria:** worker logs 3 shifts via UI + uploads a CSV → sees them in the table.

---

## Phase 3 — Verification flow (hour 9 → hour 12)

- [ ] Screenshot upload: `POST /verifications` (multipart). Store in `services/earnings/uploads/` with UUID filename.
- [ ] Worker UI: attach screenshot to a shift, status badge on each shift (`unverified / pending / confirmed / flagged / unverifiable`).
- [ ] Verifier UI: queue of pending, click a row → see shift details + screenshot → confirm / flag / unverifiable with note.
- [ ] Side-effect: status updates on shift.

**Exit criteria:** full loop — worker uploads screenshot → verifier approves → worker sees "Verified" badge.

---

## Phase 4 — Seed data + analytics service (hour 12 → hour 16)

- [ ] Seed script creates 50 workers, 3000 shifts across 3 months, verifications, grievances (per `03-data-model.md`).
- [ ] Analytics service (FastAPI) endpoints from `02-api-contracts.md §5`.
- [ ] **k-anonymity guard** on every endpoint (min 5 workers per bucket).
- [ ] Worker dashboard charts: weekly/monthly earnings (Recharts), effective hourly rate line, platform commission tracker, median comparison card.
- [ ] Advocate dashboard: commission trend chart, income distribution histogram, top complaints card, vulnerability flag list (table).

**Exit criteria:** worker dashboard shows real numbers from seed; advocate panel shows aggregate charts; changing seed changes numbers.

---

## Phase 5 — Anomaly service (hour 16 → hour 19)

- [ ] FastAPI anomaly service with `POST /anomalies/detect`.
- [ ] Implement 3 detectors:
  1. Z-score on deduction ratio (|z|>2).
  2. MoM net income drop > 20%.
  3. Effective hourly < 0.6 × `city_median_hourly_rate` (provided in payload).
- [ ] Plain-language explanations for each flag.
- [ ] `/docs` (Swagger) is on.
- [ ] Worker UI: "Run anomaly check" button on dashboard → shows returned flags with explanations.
- [ ] Draft a Postman example payload for judges (embed in README and in Postman collection).

**Exit criteria:** I can POST a crafted payload via Postman and see correct anomaly flags + explanations.

---

## Phase 6 — Grievance service (hour 19 → hour 22)

- [ ] Node.js/Express grievance service. CRUD, clustering, escalation.
- [ ] Worker UI: grievance board — post (with anonymous toggle), browse, filter by platform/category.
- [ ] Advocate UI: moderation panel — tag, mark escalated/resolved, see clusters.
- [ ] Analytics `GET /analytics/top-complaints` fetches from grievance service.

**Exit criteria:** worker posts grievance anonymously → advocate sees it, tags it, clusters show duplicate (platform,category) groupings.

---

## Phase 7 — Certificate renderer (hour 22 → hour 24)

- [ ] Node.js + Express + EJS/Handlebars.
- [ ] `GET /certificate?worker_id=&from=&to=` returns printable HTML.
- [ ] Only verified shifts counted.
- [ ] Clean layout: header with FairGig logo (text), worker info, summary totals, platform breakdown table, footer with verification hash + generated-at.
- [ ] `@media print`: A4 page, hide nav (there is none), black text on white, no background.
- [ ] Worker UI: "Download income certificate" button → opens cert in new tab → browser print works.

**Exit criteria:** opening the URL prints cleanly; Ctrl+P preview looks like a real document.

---

## Phase 8 — Polish + deliverables (hour 24 → end)

- [ ] Each `services/*/README.md` has one start command, env vars, and dependency install.
- [ ] Top-level `README.md` tells reviewers how to boot the full system.
- [ ] Postman collection covering every documented endpoint (`postman/FairGig.postman_collection.json`).
- [ ] `docs/05-evaluation-checklist.md` ticked off.
- [ ] Demo script: fixed happy path for the presentation.
- [ ] Safety net: a set of "demo data" logins ready and working.
- [ ] Handle the obvious crash-modes: empty worker with no shifts, worker with too few data points for anomaly, advocate on empty buckets (k-anonymity fallback).

---

## Nice-to-haves (only if time)

- Urdu labels toggle on worker UI (big UX win for non-tech-savvy persona).
- SSE or WebSocket for live "new grievance posted" feed in advocate panel.
- Rate intel feature on grievance board (share current commission % you're seeing).
- Accessibility pass (focus rings, alt text on screenshots, large font option).
