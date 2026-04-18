# FairGig — Team Split & 12-Hour Execution Plan

> 12 hours. No skipping requirements. Team. Every feature from the paper must ship.
> This doc assigns ownership and overlap so nobody is blocked.

Fill in team member names once known.

---

## Suggested role split

### If you are **3 people**

| Role | Owner | Services / Surface |
|---|---|---|
| **Backend-Node** | `<name>` | Auth, Earnings, Grievance, Certificate (4 Node services) |
| **Backend-Python** | `<name>` | Anomaly, Analytics (2 FastAPI services) + `scripts/seed.py` |
| **Frontend + Integration** | `<name>` | React app, Postman collection, glue work, demo script |

### If you are **4 people**

| Role | Owner | Services / Surface |
|---|---|---|
| **Backend-Node #1** | `<name>` | Auth + Earnings (the data backbone) |
| **Backend-Node #2** | `<name>` | Grievance + Certificate |
| **Backend-Python** | `<name>` | Anomaly + Analytics + seed script |
| **Frontend** | `<name>` | React app + Postman collection |

### If you are **2 people**

Tough but doable. Split by language:

| Role | Owner | Services / Surface |
|---|---|---|
| **Full-stack JS** | `<name>` | Auth, Earnings, Grievance, Certificate, **Frontend** |
| **Python + DB** | `<name>` | Anomaly, Analytics, `scripts/seed.py`, Postman collection |

The JS person is on the critical path; Python person unblocks them with seed + analytics and handles the two services the rubric specifically tests.

---

## Hour-by-hour plan (assumes 3-person team — adjust as needed)

### Hour 0 → 1 — Scaffolding sprint (ALL HANDS)

- **Node dev:** init Auth service (Express + Prisma + JWT middleware). Get `/health` + `/auth/register` + `/auth/login` working.
- **Python dev:** init Anomaly service skeleton (FastAPI + `/health` + empty `POST /anomalies/detect`). Verify Neon connectivity from Analytics.
- **Frontend:** `npm create vite@latest frontend -- --template react-ts`, add Tailwind, React Router, axios, TanStack Query. Build login + register pages pointing at Auth service.

**Exit criteria:** Neon reachable. All services on their ports reply to `/health`. Frontend booting at :5173.

---

### Hour 1 → 4

- **Node dev:**
  - Finish Auth (refresh, `/me`). Copy JWT middleware into a shared snippet.
  - Build Earnings service: CRUD shifts, CSV import, screenshot upload via multer.
- **Python dev:**
  - Write **full seed script** (`scripts/seed.py`) — 50 workers, 3000+ shifts, grievances. This unblocks Analytics + frontend dashboard work.
  - Implement Anomaly detection: z-score deduction, MoM drop, below-median hourly. Write example payload into Postman.
- **Frontend:**
  - Auth context + protected routes.
  - Worker dashboard shell (empty cards).
  - Shift-logging form + shifts table (calls Earnings).

**Exit criteria:** a worker can register, log in, log a shift; verifier/worker/advocate accounts exist in DB; anomaly endpoint accepts a crafted payload and returns correct flags.

---

### Hour 4 → 7

- **Node dev:**
  - Build Grievance service (Node): CRUD, clustering (`/grievances/clusters`), escalation.
  - Build Certificate service (Node + EJS): printable HTML from verified shifts.
- **Python dev:**
  - Build Analytics service: median hourly (`percentile_cont` + k≥5), commission trends, income distribution, vulnerability flags, worker summary.
- **Frontend:**
  - Worker dashboard: charts (Recharts) hooked to Analytics endpoints.
  - Verifier queue page.
  - Anomaly "Run check" button on worker dashboard.

**Exit criteria:** worker sees real charts from seeded data. Verifier can approve/flag a screenshot. Anomaly button returns flags.

---

### Hour 7 → 9

- **Node dev:** Grievance board + Certificate integration.
- **Python dev:** Top-complaints endpoint (Analytics → Grievance via internal key). Tighten k-anonymity fallback.
- **Frontend:**
  - Grievance board (worker posts, browses).
  - Advocate analytics panel (commission trends chart, vulnerability list, top complaints).
  - Advocate grievance moderation panel + clusters view.
  - "Generate certificate" link (opens new tab to Certificate service).

**Exit criteria:** all 7 core features work end-to-end for all 3 roles.

---

### Hour 9 → 11 — Integration, polish, Postman

- End-to-end testing: worker flow, verifier flow, advocate flow.
- Fix CORS, JWT edge cases, seed oddities.
- Complete Postman collection: every endpoint from `docs/02-api-contracts.md` has a saved request.
- Write a "run me" Postman example for the anomaly endpoint (judges-facing).
- UX pass on worker screens (big buttons, clear labels — rubric calls out "non-tech-savvy users").
- Every service has a working README with one start command.

---

### Hour 11 → 12 — Demo prep

- Walk through `docs/05-evaluation-checklist.md` — tick every box.
- Rehearse the 5-minute demo with the happy path.
- Backup: ensure seeded demo credentials work; have them pinned in `docs/06-demo-credentials.md`.
- Prepare answers for likely judge questions:
  - *"Why Postgres?"* → percentile_cont + k-anonymity in SQL.
  - *"Show us how anomaly works with a crafted payload."* → open Postman / Swagger.
  - *"How do you prevent leaking individual workers in aggregates?"* → `HAVING COUNT(DISTINCT worker_id) >= 5`.
  - *"How do services communicate?"* → REST + stateless JWT; internal API key for service-to-service.

---

## Parallelization rules (keep people unblocked)

1. **Contracts come first.** `docs/02-api-contracts.md` is the source of truth. If you change an endpoint, update the doc AND ping the other owners.
2. **Seed data unblocks frontend + analytics.** Python dev's first priority after scaffolding is the seed script, so Frontend and Analytics have real data to work with.
3. **Auth JWT middleware is shared code.** One person writes the Node middleware (15 lines), one writes the Python middleware (20 lines). Copy-paste into each service. Don't over-engineer a shared library.
4. **Don't wait for perfect.** Ship ugly-but-working first, polish last hour.
5. **Daily-standups every 2 hours.** 5-minute sync: "I'm on X, I'm blocked by Y, I need Z from whoever."

---

## Scope-protection tactics (to hit 12h without cutting features)

| Decision | Saves time by |
|---|---|
| Single Prisma schema shared across Node services | Not fighting 4 independent migration setups |
| Analytics reads live SQL (no materialized views) | Skipping refresh logic |
| Grievance clustering = Jaccard on keywords | Not integrating an ML library |
| Certificate = EJS template + `@media print` | No Puppeteer / PDFKit / headless browser |
| JWT in localStorage | No CORS+cookie+SameSite battle |
| Seed in Python with faker | Not hand-crafting 3000 SQL inserts |

---

## Commit hygiene

- Branch per feature (`feat/auth-login`, `feat/anomaly-detect`, etc.).
- PRs merged into `main` only after the service boots and the endpoint works.
- If stuck > 30 min on something, ask the team — don't grind solo.
