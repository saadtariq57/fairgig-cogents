# FairGig — Internal Docs

Working notes / living documentation for the SOFTEC 2026 Web Dev competition build.

| File | Purpose |
|---|---|
| [`00-project-brief.md`](./00-project-brief.md) | What the question paper demands. Source of truth for requirements & constraints. |
| [`01-architecture.md`](./01-architecture.md) | Our tech stack + service breakdown + DB choice + seed plan. |
| [`02-api-contracts.md`](./02-api-contracts.md) | Every REST endpoint across all 6 services. Mirrored by Postman. |
| [`03-data-model.md`](./03-data-model.md) | PostgreSQL schemas, tables, invariants, seed targets. |
| [`04-roadmap.md`](./04-roadmap.md) | Phased build order so demos work end-to-end early. |
| [`05-evaluation-checklist.md`](./05-evaluation-checklist.md) | Final check before demo — every line item maps back to the paper. |
| [`06-team-split.md`](./06-team-split.md) | Who owns which service + hour-by-hour plan for 12-hour build. |

## Non-negotiables (the stuff that will fail us if missed)

1. Anomaly service = FastAPI, with a publicly-documented endpoint judges can hit directly.
2. At least one other FastAPI service besides anomaly.
3. Grievance service = Node.js.
4. Frontend = React (or Angular).
5. Each service runs with **one command** + has a **README**.
6. City-wide median comes from **real seeded data**, not hardcoded.
7. Income certificate is **print-friendly**.
8. All inter-service contracts documented.
9. DB choice defensible on the basis of anonymised aggregate queries (we use k ≥ 5 via `HAVING COUNT(DISTINCT worker_id) >= 5`).
