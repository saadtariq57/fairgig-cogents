from fastapi import APIRouter, Depends, Query
from typing import Optional

from ..db import fetch_all, fetch_one
from ..lib.auth import require_auth
from ..lib.kanon import is_sufficient


router = APIRouter(prefix="/analytics", tags=["analytics"])


# per-worker monthly net income buckets, in PKR
BUCKETS = [
    (0,      20000,  "0-20k"),
    (20000,  40000,  "20-40k"),
    (40000,  60000,  "40-60k"),
    (60000,  80000,  "60-80k"),
    (80000,  100000, "80-100k"),
    (100000, None,   "100k+"),
]


@router.get(
    "/income-distribution",
    summary="Monthly net-income histogram (workers per bucket)",
)
def income_distribution(
    city_zone: Optional[str] = Query(None),
    _user: dict = Depends(require_auth),
):
    # First: total distinct workers overall in the filter (for k-anon gate)
    where = ["s.hours_worked > 0"]
    params: list = []

    if city_zone:
        where.append("u.city_zone = %s")
        params.append(city_zone)

    where_sql = " AND ".join(where)

    # each worker's most recent full calendar month of net income
    base_sql = f"""
        WITH monthly AS (
          SELECT
            s.worker_id,
            date_trunc('month', s.shift_date) AS month,
            SUM(s.net_received) AS net
          FROM "earnings"."shifts" s
          JOIN "auth"."users" u ON u.id = s.worker_id
          WHERE {where_sql}
          GROUP BY s.worker_id, date_trunc('month', s.shift_date)
        ),
        latest AS (
          SELECT DISTINCT ON (worker_id)
            worker_id, month, net
          FROM monthly
          ORDER BY worker_id, month DESC
        )
        SELECT worker_id, net FROM latest
    """

    rows = fetch_all(base_sql, params)
    total_workers = len(rows)

    if not is_sufficient(total_workers):
        return {
            "city_zone": city_zone,
            "buckets": [],
            "total_workers": total_workers,
            "reason": "insufficient_sample",
        }

    # bucket them in python (simple + clear, small N)
    counts = [0 for _ in BUCKETS]
    for r in rows:
        net = float(r["net"] or 0)
        for i, (lo, hi, _label) in enumerate(BUCKETS):
            if net >= lo and (hi is None or net < hi):
                counts[i] += 1
                break

    buckets_out = []
    for (lo, hi, label), c in zip(BUCKETS, counts):
        buckets_out.append({
            "label": label,
            "min": lo,
            "max": hi,
            "count": c,
        })

    return {
        "city_zone": city_zone,
        "total_workers": total_workers,
        "buckets": buckets_out,
    }
