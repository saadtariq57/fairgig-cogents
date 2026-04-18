# FairGig — Data Model

> PostgreSQL, schema-per-service logical separation. All PKs are UUID v4. All timestamps UTC.
>
> **Each service owns its own Prisma schema file.** The Prisma schema files live at:
> - `services/auth/prisma/schema.prisma` → `auth` Postgres schema
> - `services/earnings/prisma/schema.prisma` → `earnings` Postgres schema
> - `services/grievance/prisma/schema.prisma` → `grievance` Postgres schema
>
> Cross-service references (e.g. `earnings.shifts.worker_id → auth.users.id`) are stored as plain UUID columns **without a Prisma relation** — the ORM doesn't know about the other service's tables. Identity is carried via JWT claims on incoming requests, not via DB joins.
>
> The Certificate service owns no Postgres schema — it reads verified shifts from the Earnings service over REST (internal API key).
>
> The Analytics service (FastAPI) reads cross-schema via SQLAlchemy raw SQL (fully-qualified table names) using the base `DATABASE_URL`. It does not mutate data.

---

## Schema: `auth`

### `auth.users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | TEXT UNIQUE NOT NULL | |
| password_hash | TEXT NOT NULL | bcrypt |
| name | TEXT | |
| role | TEXT NOT NULL | `worker` \| `verifier` \| `advocate` |
| city_zone | TEXT | for workers only |
| category | TEXT | `ride_hailing` \| `delivery` \| `freelance` \| `domestic` |
| created_at | TIMESTAMPTZ default now() | |
| is_active | BOOLEAN default true | |

### `auth.refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → auth.users.id | |
| token_hash | TEXT | |
| expires_at | TIMESTAMPTZ | |
| revoked | BOOLEAN default false | |

---

## Schema: `earnings`

### `earnings.shifts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| worker_id | UUID | references `auth.users.id` (logical FK across schemas) |
| platform | TEXT NOT NULL | `Careem` \| `InDrive` \| `Foodpanda` \| `Bykea` \| ... |
| shift_date | DATE NOT NULL | |
| hours_worked | NUMERIC(5,2) NOT NULL CHECK > 0 | |
| gross_earned | NUMERIC(12,2) NOT NULL CHECK >= 0 | |
| platform_deductions | NUMERIC(12,2) NOT NULL CHECK >= 0 | |
| net_received | NUMERIC(12,2) NOT NULL | generated OR validated: gross - deductions |
| notes | TEXT | |
| verification_status | TEXT NOT NULL DEFAULT 'unverified' | `unverified` \| `pending_review` \| `confirmed` \| `flagged` \| `unverifiable` |
| created_at | TIMESTAMPTZ default now() | |
| updated_at | TIMESTAMPTZ | |

Indexes: `(worker_id, shift_date)`, `(platform, shift_date)`, `(verification_status)`.

### `earnings.verifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| shift_id | UUID FK → earnings.shifts.id | |
| worker_id | UUID | copy for quick lookup |
| verifier_id | UUID NULLABLE | set when reviewed |
| screenshot_path | TEXT NOT NULL | e.g. `uploads/<uuid>.png` |
| status | TEXT NOT NULL | `pending_review` \| `confirmed` \| `flagged` \| `unverifiable` |
| reviewer_note | TEXT | |
| submitted_at | TIMESTAMPTZ default now() | |
| reviewed_at | TIMESTAMPTZ | |

Trigger / app code: updating `verifications.status` mirrors to `shifts.verification_status`.

---

## Schema: `grievance`

### `grievance.grievances`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| worker_id | UUID NOT NULL | |
| anonymous | BOOLEAN default true | |
| platform | TEXT NOT NULL | |
| category | TEXT NOT NULL | `commission_change` \| `sudden_deactivation` \| `unpaid_earnings` \| `rate_drop` \| `other` |
| description | TEXT NOT NULL | |
| status | TEXT NOT NULL default 'open' | `open` \| `escalated` \| `resolved` |
| tags | TEXT[] default '{}' | |
| cluster_id | TEXT | computed on demand or cached |
| posted_at | TIMESTAMPTZ default now() | |
| updated_at | TIMESTAMPTZ | |

### `grievance.grievance_comments`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| grievance_id | UUID FK | |
| author_id | UUID | advocate only |
| body | TEXT NOT NULL | |
| created_at | TIMESTAMPTZ default now() | |

---

## Schema: `analytics` (materialised views / cached aggregates — optional)

For hackathon speed, analytics service just reads from `earnings.shifts` and `grievance.grievances` directly. If we have time:

### `analytics.city_medians_daily` (materialised view)
```sql
CREATE MATERIALIZED VIEW analytics.city_medians_daily AS
SELECT
  u.city_zone,
  u.category,
  date_trunc('week', s.shift_date) AS week,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY s.net_received / NULLIF(s.hours_worked,0)) AS median_hourly_rate,
  COUNT(DISTINCT s.worker_id) AS sample_size
FROM earnings.shifts s
JOIN auth.users u ON u.id = s.worker_id
WHERE s.verification_status IN ('confirmed','unverified')  -- decide policy
GROUP BY u.city_zone, u.category, date_trunc('week', s.shift_date)
HAVING COUNT(DISTINCT s.worker_id) >= 5;  -- k-anonymity baked in
```

Refresh on demand (cron or hit endpoint).

---

## Key invariants (write as DB constraints or app-level checks)

1. `net_received = gross_earned - platform_deductions` (allow 1 PKR tolerance for rounding).
2. `hours_worked > 0` and `<= 24`.
3. A `shift` can only be PATCHed/DELETEd while `verification_status = 'unverified'`.
4. `verifications.verifier_id` must belong to a user with `role='verifier'` at review time.
5. `grievances.anonymous=true` ⇒ API never returns `worker_id` (or returns masked `w_<first 6 chars>`).

---

## Seed-data targets (from architecture doc §7)

| Entity | Min count | Notes |
|---|---|---|
| Workers | 50 | across 3+ city zones, 3+ categories |
| Verifiers | 3 | |
| Advocates | 2 | |
| Platforms (string values) | 4 | Careem, InDrive, Foodpanda, Bykea |
| Shifts | ~3000 | 3 months × ~60 shifts/worker |
| Verifications | ~40% of shifts | mix of confirmed / flagged / pending |
| Grievances | 15–25 | distributed across platforms, with some duplicates per (platform, category) so clustering works |
| Vulnerability flagged workers | 3–5 | manually engineered with >20% MoM drop |

Seed script location: `scripts/seed.py` (Python + faker, uses `psycopg2` to write across all 3 schemas in one run).
