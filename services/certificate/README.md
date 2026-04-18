# Certificate Renderer

Renders a printable HTML income certificate for a worker over any date range. Only confirmed shifts are counted. No DB — fetches verified shifts from Earnings service via REST.

**Port:** 8006
**Stack:** Node.js + Express + EJS

## Setup

```bash
cp .env.example .env   # then fill in your own values
npm install
npm run dev
```

## Env vars (see `.env.example`)

`PORT`, `JWT_SECRET`, `INTERNAL_API_KEY`, `EARNINGS_SERVICE_URL`, `FRONTEND_ORIGIN`.

## Endpoints

See `docs/02-api-contracts.md` §6.

Main: `GET /certificate?worker_id=&from=&to=` → `text/html` with `@media print` styles.

## Health

`GET /health`
