# Earnings Service

Shift logs, CSV bulk import, screenshot verification flow. Owns the `earnings` Postgres schema.

**Port:** 8002
**Stack:** Node.js + Express + Prisma + multer + csv-parse

## Setup

```bash
cp .env.example .env   # then fill in your own values
npm install
npm run db:push
npm run dev
```

## Env vars (see `.env.example`)

`PORT`, `DATABASE_URL`, `JWT_SECRET`, `INTERNAL_API_KEY`, `UPLOAD_DIR`, `MAX_UPLOAD_SIZE_MB`, `FRONTEND_ORIGIN`.

## Endpoints

See `docs/02-api-contracts.md` §2.

## CSV format

```csv
platform,date,hours_worked,gross_earned,platform_deductions,net_received,notes
Careem,2026-03-15,8.0,3200,600,2600,weekend
```

## Health

`GET /health`
