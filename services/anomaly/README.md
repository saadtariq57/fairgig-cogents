# Anomaly Service

Stateless anomaly detection on a worker's earnings log. Takes JSON in the request body; no database.

**Port:** 8003
**Stack:** Python 3.11 + FastAPI + numpy

## Setup

```bash
cp .env.example .env   # then fill in your own values
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8003 --reload
```

## Env vars (see `.env.example`)

`PORT`, `JWT_SECRET`, `FRONTEND_ORIGIN`.

## Endpoints

See `docs/02-api-contracts.md` §3.

Main endpoint: `POST /anomalies/detect`. Swagger UI at `/docs`.

## Health

`GET /health`
