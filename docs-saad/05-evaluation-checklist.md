# FairGig — Evaluation Checklist

> Tick every box before demo. Every item maps to an explicit line in the question paper.

## Mandatory services & languages

- [ ] **6 logically separated services** exist with **clear REST boundaries**.
- [ ] Each service is **independently runnable with a single start command**.
- [ ] Each service has its own **README.md**.
- [ ] **Anomaly service is Python FastAPI**.
- [ ] **At least one OTHER backend service is FastAPI** (we have Earnings, Analytics, Auth — at least 2 extra).
- [ ] **Grievance service is Node.js**.
- [ ] **Frontend is React (or Angular)** — we used React. No WordPress / low-code.

## Functional coverage (7 features from the paper)

- [ ] **Earnings logger** — manual entry + **CSV bulk import**.
- [ ] **Screenshot verification flow** — upload → verifier reviews → confirm / flag / unverifiable → status visible on worker profile.
- [ ] **Worker income analytics** — weekly/monthly trends + **effective hourly rate over time** + **platform commission rate tracker** + **city-wide median comparison**.
- [ ] **Shareable income certificate** — printable HTML, any date range, verified earnings only.
- [ ] **Grievance board** — workers post complaints; advocates **tag, cluster, escalate/resolve**.
- [ ] **Advocate analytics panel** — commission rates over time, income distribution by city zone, top complaint categories this week, **>20% MoM income drop vulnerability flags**.
- [ ] **Anomaly service** — flags unusual deductions / income drops with **plain-language explanations**.

## Technical constraints

- [ ] **City-wide median** uses **real seeded aggregated data** (NOT hardcoded). Proven by changing seed → value changes.
- [ ] **Anomaly service has a documented endpoint** (`POST /anomalies/detect`) callable directly by judges, with FastAPI `/docs` live.
- [ ] **All inter-service API contracts documented** (`docs/02-api-contracts.md` + Postman collection).
- [ ] **Income certificate is print-friendly** (`@media print` CSS verified via browser Ctrl+P).
- [ ] **Database choice justified** — we can articulate: Postgres, chosen for SQL aggregates + k-anonymity via `HAVING COUNT(DISTINCT worker_id) >= 5`.
- [ ] **Anonymised aggregate queries** — verified via a test that a small bucket (<5 workers) returns `null` with a reason.

## Demo readiness

- [ ] Seeded credentials for one worker, one verifier, one advocate, all working.
- [ ] Happy-path script rehearsed end-to-end under 5 minutes.
- [ ] Postman collection loads without errors; anomaly endpoint has a canned example payload.
- [ ] Top-level README with boot instructions (including DB + env setup).
- [ ] Edge cases behave: empty shifts list, insufficient sample for median, flagged verification, anonymous grievance.

## Honest-UI checks (implicit rubric)

- [ ] Verification status visible everywhere earnings appear (no accidental "verified" if it isn't).
- [ ] Anonymous grievances never leak `worker_id` in responses.
- [ ] Aggregate analytics never leak identity (k ≥ 5 enforced).
- [ ] Worker UI is usable with minimal jargon / large buttons (non-tech-savvy persona).
