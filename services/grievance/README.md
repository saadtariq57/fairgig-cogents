# Grievance Service

Complaint CRUD, tagging, clustering, escalation. Owns the `grievance` Postgres schema.

**Port:** 8004
**Stack:** Node.js + Express + Prisma

## Setup

```bash
cp .env.example .env   # then fill in your own values
npm install
npm run db:push
npm run dev
```

## Env vars (see `.env.example`)

`PORT`, `DATABASE_URL`, `JWT_SECRET`, `INTERNAL_API_KEY`, `FRONTEND_ORIGIN`.

## Endpoints

See `docs/02-api-contracts.md` §4.

## Clustering

Grievances are clustered by `(platform, category)` + Jaccard keyword overlap on descriptions (threshold 0.3). See `GET /grievances/clusters`.

## Health

`GET /health`
