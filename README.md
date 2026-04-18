# FairGig

A platform for gig workers to log, verify, and understand their earnings across platforms, and for labour advocates to spot systemic unfairness at scale.

Built for SOFTEC 2026 (Web Dev competition, FAST-NU). Problem statement: [`Web Dev - Question Paper.pdf`](./Web%20Dev%20-%20Question%20Paper.pdf).

## Structure

```
.
├── docs/                  # planning + API contracts
├── frontend/              # Next.js 15 (App Router) + React 19 + Tailwind v4
├── services/
│   ├── auth/              # Node — JWT, roles (8001)
│   ├── earnings/          # Node — shifts, CSV, verification (8002)
│   ├── anomaly/           # Python FastAPI — detection (8003)
│   ├── grievance/         # Node — complaints, clusters (8004)
│   ├── analytics/         # Python FastAPI — aggregates (8005)
│   └── certificate/       # Node — printable income cert (8006)
└── postman/               # API collection
```

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind v4 |
| Node services | Node 20, Express, Prisma, jsonwebtoken, bcrypt |
| Python services | Python 3.11, FastAPI, Uvicorn, numpy, pandas, psycopg2 |
| Database | Neon — PostgreSQL 17 (one database, schema per service) |
| Auth | Stateless JWT HS256, shared `JWT_SECRET`, validated locally in every service |

## Config convention

**Every service is self-contained.** It has its own `.env`, its own `.env.example`, its own dependencies, and its own `README.md` with a single start command. There is no root-level `.env` and services never read each other's files — the repo just happens to live in one folder for hackathon convenience.

Shared values (`JWT_SECRET`, `INTERNAL_API_KEY`, the same Neon connection) are duplicated into each `.env` that needs them. At deploy time each service gets its own env independently.

## Quickstart

### Prereqs

- Docker Desktop (for the one-command path) **or** Node 20+ and Python 3.11+.
- A Neon project (free tier) — https://console.neon.tech.

### Option A — Docker (runs the whole stack)

```bash
# 1. fill in each .env from its .env.example (once)
for d in services/auth services/earnings services/anomaly services/grievance services/analytics services/certificate frontend; do
  cp $d/.env.example $d/.env
done
# 2. push schemas to Neon (once)
(cd services/auth      && npm install && npm run db:push)
(cd services/earnings  && npm install && npm run db:push)
(cd services/grievance && npm install && npm run db:push)
# 3. boot everything
docker compose up -d --build
```

That brings up all seven containers. Frontend at http://localhost:3000, services at 8001–8006, each with a `/health` endpoint. Stop with `docker compose down`.

### Option B — run services directly

For each service (and the frontend), follow its own README. The pattern is the same everywhere:

```bash
cd services/<name>
cp .env.example .env   # fill in values (Neon URL, JWT secret, etc.)
npm install            # or: python -m venv .venv && pip install -r requirements.txt
npm run db:push        # only for services that own a Postgres schema
npm run dev            # or: uvicorn app.main:app --port <port> --reload
```

Services in this repo:

| Service | Dir | Setup guide |
|---|---|---|
| Auth (8001) | `services/auth/` | [README](./services/auth/README.md) |
| Earnings (8002) | `services/earnings/` | [README](./services/earnings/README.md) |
| Anomaly (8003) | `services/anomaly/` | [README](./services/anomaly/README.md) |
| Grievance (8004) | `services/grievance/` | [README](./services/grievance/README.md) |
| Analytics (8005) | `services/analytics/` | [README](./services/analytics/README.md) |
| Certificate (8006) | `services/certificate/` | [README](./services/certificate/README.md) |
| Frontend (3000) | `frontend/` | [README](./frontend/README.md) |

## Docs

- [`docs/00-project-brief.md`](./docs/00-project-brief.md) — requirements
- [`docs/01-architecture.md`](./docs/01-architecture.md) — tech choices
- [`docs/02-api-contracts.md`](./docs/02-api-contracts.md) — all endpoints
- [`docs/03-data-model.md`](./docs/03-data-model.md) — database tables (see each service's `prisma/schema.prisma` for source of truth)
- [`docs/04-roadmap.md`](./docs/04-roadmap.md) — build plan
- [`docs/05-evaluation-checklist.md`](./docs/05-evaluation-checklist.md) — demo checklist

## API testing

Postman collection: [`postman/FairGig.postman_collection.json`](./postman/FairGig.postman_collection.json).

Anomaly service Swagger UI: http://localhost:8003/docs
