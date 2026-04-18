# Auth Service

JWT auth and role management. Owns the `auth` Postgres schema.

**Port:** 8001
**Stack:** Node.js + Express + Prisma + jsonwebtoken + bcrypt

## Setup

```bash
cp .env.example .env   # then fill in your own values
npm install
npm run db:push
npm run dev
```

## Env vars (see `.env.example`)

`PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRY_MIN`, `JWT_REFRESH_TOKEN_EXPIRY_DAYS`, `FRONTEND_ORIGIN`.

## Endpoints

See `docs/02-api-contracts.md` §1.

## Health

`GET /health`
