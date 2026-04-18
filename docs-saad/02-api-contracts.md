# FairGig — API Contracts

> Judges will ask for this. Keep it updated as we build. A Postman collection (`postman/FairGig.postman_collection.json`) must mirror this.

All requests/responses are JSON unless stated. All protected endpoints require `Authorization: Bearer <JWT>`.

---

## 1. Auth service — `http://localhost:8001`

### POST `/auth/register`
Body:
```json
{ "email": "rider1@example.com", "password": "string", "name": "Ali", "role": "worker", "city_zone": "Gulberg", "category": "ride_hailing" }
```
`role` ∈ `worker | verifier | advocate`. `city_zone` and `category` only required when `role=worker`.

Response `201`:
```json
{ "user_id": "uuid", "email": "rider1@example.com", "role": "worker" }
```

### POST `/auth/login`
Body: `{ "email": "...", "password": "..." }`
Response `200`:
```json
{ "access_token": "jwt", "refresh_token": "jwt", "user": { "id": "uuid", "role": "worker", "name": "Ali" } }
```

### POST `/auth/refresh`
Body: `{ "refresh_token": "..." }` → `{ "access_token": "...", "refresh_token": "..." }`

### GET `/auth/me`  (protected)
Response: `{ "id": "...", "email": "...", "role": "...", "name": "...", "city_zone": "...", "category": "..." }`

---

## 2. Earnings service — `http://localhost:8002`

### POST `/shifts`  (role: worker)
Body:
```json
{
  "platform": "Careem",
  "date": "2026-04-17",
  "hours_worked": 7.5,
  "gross_earned": 3500.00,
  "platform_deductions": 700.00,
  "net_received": 2800.00,
  "notes": "weekend surge"
}
```
Response `201`: the shift object with `id`, `worker_id`, `created_at`, `verification_status: "unverified"`.

### GET `/shifts?from=YYYY-MM-DD&to=YYYY-MM-DD&platform=...`  (worker: own only; advocate: aggregate-only)
Response: `{ "items": [ Shift, ... ], "total": n }`

### GET `/shifts/{id}`  (worker: own; verifier: any)

### PATCH `/shifts/{id}`  (worker: own only, only if `unverified`)

### DELETE `/shifts/{id}`  (worker: own; admin/verifier: never)

### POST `/shifts/import`  (role: worker)
Multipart: `file=@earnings.csv`.
CSV headers: `platform,date,hours_worked,gross_earned,platform_deductions,net_received,notes`.
Response: `{ "imported": 42, "skipped": [ { "row": 3, "reason": "..." } ] }`

### POST `/verifications`  (role: worker)  — upload screenshot
Multipart: `shift_id=<uuid>`, `file=@screenshot.png`.
Response `201`:
```json
{ "verification_id": "uuid", "shift_id": "uuid", "status": "pending_review", "screenshot_url": "/uploads/..." }
```

### GET `/verifications?status=pending_review`  (role: verifier)
Returns queue of verification requests with joined shift + worker (anonymised id only).

### PATCH `/verifications/{id}`  (role: verifier)
Body: `{ "status": "confirmed" | "flagged" | "unverifiable", "reviewer_note": "..." }`
Side-effect: updates `shifts.verification_status` to match.

### GET `/workers/{worker_id}/profile`  (self or verifier)
Response:
```json
{
  "worker_id": "uuid",
  "name": "Ali",
  "city_zone": "Gulberg",
  "category": "ride_hailing",
  "totals": {
    "shifts": 180,
    "verified_shifts": 120,
    "net_earned_last_30d": 64000
  }
}
```

---

## 3. Anomaly service — `http://localhost:8003` **(judges will call directly)**

### POST `/anomalies/detect`  (documented, public to judges via JWT)
**Body (the exact payload judges might craft):**
```json
{
  "worker_id": "uuid-or-any-string",
  "city_median_hourly_rate": 420.0,
  "shifts": [
    {
      "date": "2026-03-01",
      "platform": "Careem",
      "hours_worked": 8.0,
      "gross_earned": 3200,
      "platform_deductions": 600,
      "net_received": 2600
    }
    /* ... */
  ]
}
```

**Response `200`:**
```json
{
  "worker_id": "...",
  "summary": "Detected 2 anomalies in 45 shifts.",
  "flags": [
    {
      "type": "unusual_deduction",
      "date": "2026-03-12",
      "severity": "high",
      "explanation": "Deduction on 2026-03-12 was 32% of gross, which is 2.4 standard deviations above your typical 18%."
    },
    {
      "type": "sudden_income_drop",
      "period": "2026-03",
      "severity": "medium",
      "explanation": "Your net earnings in March (PKR 42,000) are 27% lower than February (PKR 57,500)."
    }
  ],
  "method": {
    "unusual_deduction": "z-score on deduction ratio, threshold |z|>2",
    "sudden_income_drop": "month-on-month net earnings delta, threshold > 20%",
    "below_median_hourly": "effective hourly rate < 0.6 * city_median_hourly_rate"
  }
}
```

### GET `/anomalies/health`  → `{ "status": "ok" }`

### GET `/anomalies/docs`  → served by FastAPI at `/docs` (Swagger UI). **Tell the judges this.**

---

## 4. Grievance service — `http://localhost:8004`  (Node.js)

### POST `/grievances`  (role: worker)
Body: `{ "platform": "Foodpanda", "category": "sudden_deactivation", "description": "...", "anonymous": true }`
Response `201`: grievance with `id`, `status: "open"`, `posted_at`, `author_display: "Anonymous" | "Ali R."`.

### GET `/grievances?platform=&category=&status=`  (public-ish: any logged-in user)
Lists with pagination. Description always visible; author masked if `anonymous=true`.

### GET `/grievances/{id}`

### PATCH `/grievances/{id}`  (role: advocate)
Body: `{ "status": "escalated" | "resolved", "tags": ["commission_spike","jan-2026"], "cluster_id": "optional" }`

### GET `/grievances/clusters`  (role: advocate)
Groups similar grievances. Algorithm: same `(platform, category)` bucket, then simple keyword-overlap (Jaccard over tokenised description, threshold 0.3). Returns:
```json
{
  "clusters": [
    {
      "cluster_id": "auto-1",
      "platform": "Foodpanda",
      "category": "commission_change",
      "count": 12,
      "sample_ids": ["...","...","..."]
    }
  ]
}
```

### POST `/grievances/{id}/comments`  (role: advocate)

---

## 5. Analytics service — `http://localhost:8005`

> **All endpoints enforce k-anonymity: min 5 distinct workers per bucket, else `null` with `reason: "insufficient_sample"`.**

### GET `/analytics/median-hourly?category=ride_hailing&city_zone=Gulberg`
Response: `{ "category": "...", "city_zone": "...", "median_hourly_rate": 385.0, "sample_size": 23 }`
or `{ "median_hourly_rate": null, "reason": "insufficient_sample", "sample_size": 3 }`

### GET `/analytics/commission-trends?platform=Careem&from=&to=`
Response:
```json
{
  "platform": "Careem",
  "series": [
    { "week": "2026-W10", "avg_commission_pct": 19.4, "sample_size": 48 },
    { "week": "2026-W11", "avg_commission_pct": 22.1, "sample_size": 51 }
  ]
}
```

### GET `/analytics/income-distribution?city_zone=Gulberg`
Response: histogram buckets with counts.

### GET `/analytics/top-complaints?window=7d`
Pulls from grievance service, returns top (category, count).

### GET `/analytics/vulnerability-flags`  (role: advocate)
Response:
```json
{
  "workers": [
    { "worker_id_masked": "w_4a2...", "drop_pct": 31.5, "last_month_net": 22000, "prev_month_net": 32100, "city_zone": "Johar Town", "category": "delivery" }
  ],
  "generated_at": "..."
}
```

### GET `/analytics/worker/{worker_id}/summary`  (role: worker self, or advocate aggregated)
Worker-scoped: weekly / monthly trends, effective hourly rate over time, platform commission % over time, AND the relevant `median_hourly_rate` from the city bucket for comparison.

---

## 6. Certificate renderer — `http://localhost:8006`

### GET `/certificate?worker_id=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns **`Content-Type: text/html`** — a standalone printable page.

Rules:
- Only **verified** shifts are counted.
- Includes: worker name, category, city zone, date range, total verified gross, total deductions, total net, platform breakdown table, generated-at timestamp, a small "verification hash" footer (e.g. SHA-256 of (worker_id + date range + totals)) for lightweight tamper-check.
- `@media print` styles: A4, no nav, no color bg.

### GET `/certificate/health` → `{ "status": "ok" }`

---

## 7. Frontend → backend call map (quick ref)

| UI screen | Calls |
|---|---|
| Login | `POST /auth/login` |
| Worker dashboard | `GET /shifts`, `GET /analytics/worker/{id}/summary`, `GET /analytics/median-hourly` |
| Log a shift | `POST /shifts` |
| CSV import | `POST /shifts/import` |
| Upload screenshot | `POST /verifications` |
| Income certificate | `GET /certificate?...` (opens in new tab) |
| Grievance board (worker) | `GET /grievances`, `POST /grievances` |
| Verifier queue | `GET /verifications?status=pending_review`, `PATCH /verifications/{id}` |
| Advocate analytics | `GET /analytics/commission-trends`, `/income-distribution`, `/top-complaints`, `/vulnerability-flags`, `/grievances/clusters` |
| Advocate grievance mod | `PATCH /grievances/{id}`, `POST /grievances/{id}/comments` |
| Anomaly demo (worker) | `POST /anomalies/detect` (called by frontend with the worker's recent shifts) |

---

## 8. Standard error responses

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad input. `details` lists fields. |
| 401 | `UNAUTHENTICATED` | Missing/invalid JWT. |
| 403 | `FORBIDDEN` | Wrong role. |
| 404 | `NOT_FOUND` | Resource missing. |
| 409 | `CONFLICT` | e.g. editing a verified shift. |
| 413 | `FILE_TOO_LARGE` | Screenshot > 5 MB. |
| 422 | `CSV_PARSE_ERROR` | CSV import issue. |
| 500 | `INTERNAL` | Last resort. |
