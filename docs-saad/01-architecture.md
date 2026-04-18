# FairGig — Architecture & Tech Stack Decisions

> Companion to `00-project-brief.md`. This is *our* plan (choices we're making). The brief is what the rubric demands.

---

## 1. High-level diagram (text form)

```
                          ┌────────────────────────┐
                          │  Frontend (React+Vite) │
                          │  worker/verifier/      │
                          │  advocate dashboards   │
                          └───────────┬────────────┘
                                      │ REST (JSON + JWT in Authorization header)
      ┌──────────┬──────────┬─────────┼─────────┬──────────┬──────────┐
      ▼          ▼          ▼         ▼         ▼          ▼          ▼
  ┌────────┐┌─────────┐┌─────────┐┌──────────┐┌──────────┐┌──────────────┐
  │  Auth  ││Earnings ││ Anomaly ││Grievance ││Analytics ││ Certificate  │
  │ (Node) ││ (Node)  ││(FastAPI)││ (Node)   ││(FastAPI) ││   (Node)     │
  │  8001  ││  8002   ││  8003   ││  8004    ││  8005    ││    8006      │
  └───┬────┘└────┬────┘└────┬────┘└────┬─────┘└────┬─────┘└──────┬───────┘
      │         │          │ stateless│           │             │
      │         │          │  (takes  │           │             │
      │         │          │   JSON)  │           │             │
      └─────────┴──────────┴──────────┴───────────┴─────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │  PostgreSQL 16        │
                          │  (single instance,    │
                          │  schema per service)  │
                          └───────────────────────┘

  JWT validation is done locally in each service (shared JWT_SECRET, HS256).
  No service proxies through Auth. Auth only handles register/login/refresh/me.
```

**Final stack**: 4 Node services (Auth, Earnings, Grievance, Certificate) + 2 FastAPI services (Anomaly, Analytics). This satisfies:
- Anomaly = FastAPI ✅ (mandatory)
- ≥1 other backend FastAPI = Analytics ✅ (mandatory)
- Grievance = Node.js ✅ (mandatory)
- Frontend = React ✅

Rationale: Node-heavy for team velocity (shared Express+Prisma patterns across 4 services), FastAPI for services that do real Python-native work (numpy stats in Anomaly, pandas aggregation in Analytics).

---

## 2. Service-by-service plan

### 2.1 Auth service — Node.js
- Framework: Express + Prisma + `jsonwebtoken` + `bcrypt`.
- Endpoints: register, login, refresh, me.
- Roles: `worker`, `verifier`, `advocate`.
- Issues access + refresh JWT (HS256, shared `JWT_SECRET`).
- DB: `auth` schema → `users`, `refresh_tokens` tables.
- Port: **8001**.

### 2.2 Earnings service — Node.js
- Framework: Express + Prisma + `multer` (file uploads) + `csv-parse`.
- Endpoints: CRUD shifts, CSV bulk import, screenshot upload (stores file to `./uploads/` and records reference), verification review endpoints.
- DB: `earnings` schema → `shifts`, `verifications` tables.
- Port: **8002**.

### 2.3 Anomaly service — Python FastAPI (MANDATORY)
- Framework: FastAPI + `numpy`.
- Stateless: takes a JSON payload with a worker's earnings log, returns flagged anomalies.
- Detection logic (documented):
  - **Z-score** on deduction %: if |z| > 2, flag as "unusually high deduction".
  - **Month-on-month drop**: if this month's net earnings dropped > 20% vs last month, flag "sudden income drop".
  - **Effective hourly rate** below city-median × 0.6 → flag "below-median hourly rate".
- Returns plain-language explanations, e.g. *"Your deduction on Nov 3 was 32%, which is more than 2 standard deviations above your usual 18%."*
- Port: **8003**.
- **Documented endpoint**: `POST /anomalies/detect` (judges will hit this directly). `/docs` exposes Swagger UI.

### 2.4 Grievance service — Node.js (MANDATORY)
- Framework: Express + Prisma.
- Endpoints: CRUD complaints, tagging, clustering, escalation workflow.
- Clustering approach (simple, defensible): group complaints by `(platform, category)` + Jaccard keyword-overlap score on descriptions (threshold 0.3) → expose `GET /grievances/clusters`.
- DB: `grievance` schema → `grievances`, `grievance_comments` tables.
- Port: **8004**.

### 2.5 Analytics service — Python FastAPI
- Framework: FastAPI + `pandas` + SQLAlchemy (read-only).
- Endpoints: commission trends by platform, income distribution by city zone, top complaint categories this week (pulls from grievance service via internal API key), vulnerability flag list (workers > 20% MoM drop), city-wide medians by category.
- **Privacy**: all endpoints enforce **k-anonymity, k = 5** — if a city-zone/category bucket has <5 distinct workers, return `null` with `reason: "insufficient_sample"`.
- Reads directly from `earnings` schema using `percentile_cont` for medians.
- Port: **8005**.

### 2.6 Certificate renderer — Node.js
- Framework: Express + EJS templating.
- `GET /certificate?worker_id=...&from=...&to=...` → standalone HTML with `@media print` styles.
- Only counts shifts where `verification_status = 'confirmed'`.
- Includes header/footer, worker info, totals, platform breakdown table, SHA-256 verification hash footer.
- Pulls verified earnings from Earnings service via internal API key.
- Port: **8006**.

---

## 3. Frontend

- **React** (Vite + TypeScript).
- Styling: **Tailwind CSS** for speed + clean look.
- Data layer: **TanStack Query** (React Query) + `axios`.
- Auth: store access token in memory, refresh token in httpOnly cookie (if time) OR localStorage (hackathon fallback). Role-gated routes.
- Charts: **Recharts** (bundled, easy).
- 3 role dashboards:
  - `/worker/*` — log shifts, upload screenshot, analytics, certificate, grievance board post.
  - `/verifier/*` — review queue for uploaded screenshots.
  - `/advocate/*` — aggregate analytics, grievance board moderation.
- Public-ish: login / register / landing.
- Port: **5173** (Vite default).

---

## 4. Database choice & justification

**Choice: PostgreSQL (single instance, schema-per-service logical separation).**

Justification (prepare this for the judges):
1. **Aggregate queries**: Postgres has excellent `percentile_cont`, `GROUP BY`, window functions → clean city-median / commission-trend queries.
2. **Privacy of aggregates**: enforce `HAVING COUNT(DISTINCT worker_id) >= 5` in every analytics query (k-anonymity). This is trivially expressed in SQL.
3. **Relational integrity**: shifts ↔ verification ↔ users have FKs.
4. **Single instance, logical separation** by schemas (`auth`, `earnings`, `grievance`, `analytics`) keeps hackathon ops simple while services own their schema only.
5. Alternative considered: MongoDB (rejected — aggregation pipeline is heavier to reason about in a hackathon, and FK/joins are weaker for the analytics panel).

**Privacy rule we enforce**: no analytics endpoint returns a bucket with fewer than **5 distinct workers**. If a bucket is too small, we return `{ "value": null, "reason": "insufficient_sample" }`.

---

## 5. Shared conventions

### 5.1 JWT
- Algorithm: **HS256**.
- Shared env var: `JWT_SECRET` (same across all services).
- Claims: `sub` (user_id), `role`, `exp`, `iat`.
- Access token: 60 min. Refresh token: 7 days.

### 5.2 Inter-service auth
- Frontend sends JWT to every service via `Authorization: Bearer ...`.
- Services validate independently (stateless). No service-to-service calls that need their own auth in MVP — if we do add any (e.g. Analytics reading from Grievance), we'll use a shared `INTERNAL_API_KEY` header.

### 5.3 Error format (all services)
```json
{ "error": { "code": "ERR_CODE", "message": "Human-readable", "details": {} } }
```

### 5.4 Time
- All timestamps in **UTC ISO-8601** at API boundary. Frontend renders in local time.

### 5.5 IDs
- UUID v4 for every primary key.

### 5.6 Ports
| Service | Port |
|---|---|
| Frontend | 5173 |
| Auth | 8001 |
| Earnings | 8002 |
| Anomaly | 8003 |
| Grievance | 8004 |
| Analytics | 8005 |
| Certificate | 8006 |
| Postgres | 5432 |

---

## 6. Repo structure

```
/
├── docs/                              # planning + design docs
├── frontend/                          # React + Vite + TS + Tailwind
├── services/
│   ├── auth/                          # Node.js + Express + Prisma
│   │   └── prisma/schema.prisma       # owns auth.users, auth.refresh_tokens
│   ├── earnings/                      # Node.js + Express + Prisma
│   │   └── prisma/schema.prisma       # owns earnings.shifts, earnings.verifications
│   ├── anomaly/                       # Python FastAPI (stateless, no DB)
│   ├── grievance/                     # Node.js + Express + Prisma
│   │   └── prisma/schema.prisma       # owns grievance.grievances, grievance.grievance_comments
│   ├── analytics/                     # Python FastAPI (read-only, cross-schema SQL)
│   └── certificate/                   # Node.js + Express + EJS (no DB; calls Earnings over REST)
├── db/
│   ├── init.sql                       # creates the 3 Postgres schemas
│   ├── seed.py                        # cross-cutting seed (psycopg2, no Prisma)
│   └── requirements.txt
├── postman/
│   └── FairGig.postman_collection.json
├── .env.example                       # shared env vars (DATABASE_URL, JWT_SECRET, etc.)
└── README.md                          # top-level boot instructions
```

### Per-service ownership

- **Each Node service owns its Prisma schema**. The Prisma client is generated inside that service's `node_modules/` and only knows about its own tables. This enforces the rubric's "logically separated services" at the ORM layer (not just by convention).
- Cross-service references (e.g. `earnings.shifts.worker_id → auth.users.id`) are stored as plain UUID columns with **no Prisma `@relation`**. Identity comes from JWT claims or inter-service REST calls using `INTERNAL_API_KEY`.
- **Certificate** service has no Prisma and no DB connection — it fetches verified shifts from Earnings via REST.
- **Analytics** (FastAPI) uses SQLAlchemy raw SQL with fully-qualified table names (`earnings.shifts`, `auth.users`) via the base `DATABASE_URL`. It reads cross-schema but never writes.

Each service folder has its own `README.md` with **one start command** (e.g. `uvicorn app.main:app --port 8003 --reload` or `npm run dev`).

---

## 7. Seed data plan (critical for median / anomaly to be real)

Seed script (`scripts/seed.py`) must create:
- **≥ 50 workers** across **≥ 3 city zones** (e.g. Gulberg, Johar Town, DHA).
- **≥ 4 platforms** (e.g. Careem, InDrive, Foodpanda, Bykea).
- **≥ 3 months of shift history per worker** (~ 60 shifts each → ~3000 shift records).
- **A few outlier workers** whose income dropped > 20% in the last month (to make the vulnerability flag light up).
- **Verifier + advocate accounts** pre-created.
- **10–20 grievances** across platforms / categories for clustering to work.

Credentials seeded in a `docs/06-demo-credentials.md` (we'll add during dev).
