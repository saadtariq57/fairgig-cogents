# FairGig

A platform for gig workers to log, verify, and understand their earnings across platforms, and for labour advocates to spot systemic unfairness at scale.

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

## Quickstart

### Prereqs

- Docker Desktop
- A Neon project
