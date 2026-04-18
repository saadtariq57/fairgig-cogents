# Analytics Service

Aggregate KPIs for the advocate panel + city-wide median comparison for the worker dashboard. Read-only; enforces k-anonymity (k = 5) on every endpoint.

**Port:** 8005
**Stack:** Python 3.11 + FastAPI + psycopg2 + pandas

## Setup

```bash
cp .env.example .env   # then fill in your own values
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8005 --reload
```

## Env vars (see `.env.example`)

`PORT`, `DATABASE_URL`, `JWT_SECRET`, `INTERNAL_API_KEY`, `GRIEVANCE_SERVICE_URL`, `K_ANONYMITY_MIN`, `FRONTEND_ORIGIN`.

## Endpoints

See `docs/02-api-contracts.md` §5.

## Privacy

All aggregate endpoints require at least 5 distinct workers per bucket. Smaller buckets return `null` with `reason: "insufficient_sample"`. Enforced in SQL via `HAVING COUNT(DISTINCT worker_id) >= 5`.

## Notes

- Uses the full database connection string (no `schema=` param) and schema-qualifies every table in SQL (`"earnings"."shifts"`, `"auth"."users"`).
- Read-only by convention; no INSERT/UPDATE/DELETE statements.

## Health

`GET /health`
