# FairGig — Project Brief

> Source: `Web Dev - Question Paper.pdf` (SOFTEC 2026, Web Dev Competition, FAST-NU).
> This document is the single source of truth for "what the judges asked for". Do not lose sight of anything in here.

---

## 1. One-liner

Build **FairGig**, a platform that empowers gig workers (ride-hailing drivers, delivery riders, freelancers, domestic workers) to **log, verify, and understand** their earnings across multiple platforms, and gives **labour advocates** a dashboard to spot systemic unfairness at scale.

## 2. Problem Statement (in plain English)

Pakistani gig workers earn across multiple platforms with:
- No unified record of income.
- No payslip they can show to landlords / banks / family.
- No protection when platforms change commission rates overnight or deactivate accounts without explanation.
- No visibility into whether the platform is fairly calculating their earnings.
- No community to surface grievances or share rate intelligence collectively.

FairGig must:
- Work for a rider who is **not tech-savvy**.
- Be **honest** about what it can and cannot verify.
- Surface **patterns** an individual worker could never see alone.

---

## 3. User Personas (4)

| Persona | What they do on FairGig |
|---|---|
| **Gig Worker** | Logs shifts & earnings, uploads platform screenshots for verification, views income analytics, generates a shareable income report. |
| **Verifier** | Reviews uploaded earnings screenshots, flags anomalies, approves or disputes a worker's submitted earnings record. |
| **Advocate / Analyst** | Monitors aggregate trends: commission rate changes across platforms, income volatility by city zone, deactivation complaint clusters. |
| **Worker Community** | Anonymous bulletin board: workers post rate intel, platform complaints, support requests. Moderated by advocates. |

> Note: "Worker Community" is a *surface / feature* (bulletin board) that workers use anonymously. Advocates moderate it. It is not a separate login role — workers post there while logged in, but posts appear anonymised.

**Login roles (auth)**: `worker`, `verifier`, `advocate`. (3 roles.)

---

## 4. Core Functional Requirements (7)

### 4.1 Earnings logger
- Workers log shifts with: **platform, date, hours worked, gross earned, platform deductions, net received**.
- Supports **bulk CSV import** for tech-savvy users.

### 4.2 Screenshot verification flow
- Worker uploads a platform earnings screenshot.
- A verifier reviews it and either **confirms**, **flags a discrepancy**, or marks **unverifiable**.
- Verification status is shown on the worker's profile.

### 4.3 Income analytics dashboard (worker view)
- Weekly / monthly earnings trends.
- Effective hourly rate over time.
- Platform commission rate tracker.
- Comparison against the **anonymised city-wide median** for their category.
  - **Must use real aggregated data from seeded records, NOT hardcoded values.**

### 4.4 Shareable income certificate
- Worker generates a **clean, printable income summary** (PDF-style HTML page) covering any date range.
- Shows **verified** earnings.
- Designed for landlords / banks.
- **Must be print-friendly.**

### 4.5 Grievance board
- Workers post complaints (platform, category, description).
- Advocates can **tag, cluster similar complaints, and mark escalated or resolved**.

### 4.6 Advocate analytics panel
- Aggregate view of commission rates reported across platforms over time.
- Income distribution by city zone.
- Top complaint categories this week.
- Workers whose income dropped **more than 20% month-on-month** (vulnerability flag).

### 4.7 Anomaly detection service
- A **FastAPI** service.
- Given a worker's recent earnings log, flags statistically unusual deductions or sudden income drops.
- Returns a **human-readable explanation**.
- Must expose detection logic as a **documented API endpoint** — judges will call it directly with a crafted payload.

---

## 5. Required Service Architecture (6 services)

Services must be **logically separated** with clear **REST API** boundaries.
- **No Docker compulsion.**
- Each service must be **independently runnable with a single start command and a README**.
- Inter-service communication via **REST or a lightweight event mechanism**.

| # | Service | Language | Responsibility |
|---|---|---|---|
| 1 | **Auth service** | (free choice, but see constraints) | JWT login, role management (worker/verifier/advocate), token refresh. |
| 2 | **Earnings service** | (free choice) | CRUD for shift logs, CSV import, screenshot upload reference, verification status tracking. |
| 3 | **Anomaly service** | **Python FastAPI (mandatory)** | Accepts a worker's earnings history, returns flagged anomalies with plain-language explanations. |
| 4 | **Grievance service** | **Node.js (mandatory)** | Complaint CRUD, tagging, clustering similar complaints, escalation workflow. |
| 5 | **Analytics service** | (free choice) | Aggregate KPIs for the advocate panel. Platform commission trends, income distributions, vulnerability flags. |
| 6 | **Certificate renderer** | (free choice) | Generates a clean printable HTML income certificate from verified earnings data. |

---

## 6. Hard Technical Constraints (DO NOT FORGET)

- [ ] **Anomaly service** = Python **FastAPI**.
- [ ] **At least one OTHER backend service** must also be FastAPI. *(We will pick this — see architecture doc.)*
- [ ] **Grievance service** = **Node.js**.
- [ ] **Frontend** = **React or Angular**. No WordPress, no low-code.
- [ ] **Database** = free choice, but we must **justify it during evaluation**, especially around **anonymised aggregate queries** (avoid exposing individual worker data).
- [ ] **City-wide median** on worker dashboard must use **real aggregated data from seeded records** — NOT hardcoded.
- [ ] **Anomaly service** must expose its detection logic as a **documented API endpoint** — judges will hit it directly with a crafted payload.
- [ ] **All inter-service API contracts** must be documented (table or Postman collection is sufficient).
- [ ] **Income certificate page** must be **print-friendly** (think `@media print`, clean typography, A4 layout).
- [ ] Each service **independently runnable** with a **single start command + README**.

---

## 7. What the Judges Will Likely Do

- Hit the anomaly endpoint directly with their own crafted payload → our API must be bulletproof, documented, and return plain-language explanations.
- Log in as each role (worker / verifier / advocate) and walk through the core flows.
- Print (or print-preview) the income certificate.
- Inspect that the city-wide median actually reflects seeded data (try changing seed data and see if median changes).
- Ask us to justify DB choice & privacy of aggregate queries.
- Check that each service starts on its own with one command.
- Ask for the API contract doc / Postman collection.

---

## 8. Non-functional priorities (implicit)

- **Honesty**: be explicit in UI about "unverified" vs "verified" earnings.
- **Accessibility for non-tech-savvy users**: big buttons, minimal jargon, optional Urdu labels would be a nice-to-have.
- **Privacy**: aggregate queries must not leak individual worker identity.
- **Seed data**: must be rich enough to make median / trend / vulnerability features meaningful.
