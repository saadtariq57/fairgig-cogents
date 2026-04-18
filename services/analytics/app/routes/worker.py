from fastapi import APIRouter, Depends, Path

from ..db import fetch_all, fetch_one
from ..lib.auth import require_auth
from ..lib.errors import forbidden, not_found
from ..lib.kanon import is_sufficient
from ..config import config


router = APIRouter(prefix="/analytics", tags=["analytics"])


def _get_user_row(worker_id: str):
    return fetch_one(
        'SELECT id, role::text AS role, city_zone, category::text AS category, name '
        'FROM "auth"."users" WHERE id = %s',
        (worker_id,),
    )


@router.get(
    "/worker/{worker_id}/summary",
    summary="Per-worker summary: trends + city median for comparison",
)
def worker_summary(
    worker_id: str = Path(...),
    user: dict = Depends(require_auth),
):
    role = user.get("role")
    caller_id = user.get("id")

    # auth: worker can only view own; advocate any
    if role == "worker":
        if str(caller_id) != str(worker_id):
            raise forbidden("Workers can only view their own summary")
    elif role == "advocate":
        pass
    else:
        raise forbidden("Role not allowed for this endpoint")

    target = _get_user_row(worker_id)
    if not target:
        raise not_found("Worker not found")

    # weekly net + hours + effective hourly rate
    weekly = fetch_all(
        """
        SELECT
          to_char(date_trunc('week', shift_date), 'IYYY-"W"IW') AS week,
          SUM(net_received) AS net,
          SUM(hours_worked) AS hours,
          CASE WHEN SUM(hours_worked) > 0
               THEN SUM(net_received) / SUM(hours_worked)
               ELSE NULL END AS effective_hourly_rate
        FROM "earnings"."shifts"
        WHERE worker_id = %s
        GROUP BY date_trunc('week', shift_date)
        ORDER BY date_trunc('week', shift_date) ASC
        """,
        (worker_id,),
    )

    # monthly net trend
    monthly = fetch_all(
        """
        SELECT
          to_char(date_trunc('month', shift_date), 'YYYY-MM') AS month,
          SUM(net_received) AS net,
          SUM(hours_worked) AS hours
        FROM "earnings"."shifts"
        WHERE worker_id = %s
        GROUP BY date_trunc('month', shift_date)
        ORDER BY date_trunc('month', shift_date) ASC
        """,
        (worker_id,),
    )

    # platform commission % over time (monthly, per platform)
    platform_series = fetch_all(
        """
        SELECT
          to_char(date_trunc('month', shift_date), 'YYYY-MM') AS month,
          platform,
          CASE WHEN SUM(gross_earned) > 0
               THEN SUM(platform_deductions) / SUM(gross_earned) * 100
               ELSE NULL END AS avg_commission_pct
        FROM "earnings"."shifts"
        WHERE worker_id = %s
        GROUP BY date_trunc('month', shift_date), platform
        ORDER BY date_trunc('month', shift_date) ASC, platform ASC
        """,
        (worker_id,),
    )

    # city median for the worker's bucket (reuse median-hourly logic inline;
    # k-anon enforced here too)
    city_median_payload = None
    if target["city_zone"] and target["category"]:
        row = fetch_one(
            """
            SELECT
              percentile_cont(0.5) WITHIN GROUP (
                ORDER BY (s.net_received / NULLIF(s.hours_worked, 0))
              ) AS median_hourly_rate,
              COUNT(DISTINCT s.worker_id) AS sample_size
            FROM "earnings"."shifts" s
            JOIN "auth"."users" u ON u.id = s.worker_id
            WHERE u.category::text = %s
              AND u.city_zone = %s
              AND s.hours_worked > 0
              AND s.verification_status::text IN ('confirmed', 'unverified')
            """,
            (target["category"], target["city_zone"]),
        ) or {}
        n = int(row.get("sample_size") or 0)
        if is_sufficient(n):
            median = row.get("median_hourly_rate")
            city_median_payload = {
                "category": target["category"],
                "city_zone": target["city_zone"],
                "median_hourly_rate": round(float(median), 2) if median is not None else None,
                "sample_size": n,
            }
        else:
            city_median_payload = {
                "category": target["category"],
                "city_zone": target["city_zone"],
                "median_hourly_rate": None,
                "reason": "insufficient_sample",
                "sample_size": n,
            }

    # shape rows
    def _weekly(r):
        net = float(r["net"] or 0)
        hours = float(r["hours"] or 0)
        rate = r["effective_hourly_rate"]
        return {
            "week": r["week"],
            "net": round(net, 2),
            "hours": round(hours, 2),
            "effective_hourly_rate": round(float(rate), 2) if rate is not None else None,
        }

    def _monthly(r):
        return {
            "month": r["month"],
            "net": round(float(r["net"] or 0), 2),
            "hours": round(float(r["hours"] or 0), 2),
        }

    def _platform(r):
        pct = r["avg_commission_pct"]
        return {
            "month": r["month"],
            "platform": r["platform"],
            "avg_commission_pct": round(float(pct), 2) if pct is not None else None,
        }

    return {
        "worker_id": worker_id,
        "city_zone": target["city_zone"],
        "category": target["category"],
        "weekly": [_weekly(r) for r in weekly],
        "monthly": [_monthly(r) for r in monthly],
        "platform_commission": [_platform(r) for r in platform_series],
        "city_median": city_median_payload,
    }
