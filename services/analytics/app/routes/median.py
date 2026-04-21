from fastapi import APIRouter, Depends, Query, Response
from typing import Optional

from ..db import fetch_one
from ..lib.auth import require_auth
from ..lib.errors import bad_request
from ..lib.kanon import is_sufficient
from ..config import config


router = APIRouter(prefix="/analytics", tags=["analytics"])


VALID_CATEGORIES = {"ride_hailing", "delivery", "freelance", "domestic"}


@router.get(
    "/median-hourly",
    summary="City-zone + category median hourly rate (k-anon enforced)",
)
def median_hourly(
    response: Response,
    category: str = Query(..., description="ride_hailing | delivery | freelance | domestic"),
    city_zone: str = Query(..., description="e.g. Gulberg"),
    _user: dict = Depends(require_auth),
):
    if category not in VALID_CATEGORIES:
        raise bad_request(
            "Unknown category",
            [{"field": "category", "message": f"must be one of {sorted(VALID_CATEGORIES)}"}],
        )

    sql = """
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
    """
    row = fetch_one(sql, (category, city_zone)) or {}
    sample_size = int(row.get("sample_size") or 0)

    # City medians are anonymised aggregates that move slowly; cache them
    # for a minute so repeated dashboard loads are instant.
    response.headers["Cache-Control"] = "private, max-age=60"

    if not is_sufficient(sample_size):
        return {
            "category": category,
            "city_zone": city_zone,
            "median_hourly_rate": None,
            "reason": "insufficient_sample",
            "sample_size": sample_size,
        }

    median = row.get("median_hourly_rate")
    median = float(median) if median is not None else None
    return {
        "category": category,
        "city_zone": city_zone,
        "median_hourly_rate": round(median, 2) if median is not None else None,
        "sample_size": sample_size,
        "k_anonymity_min": config.k_anonymity_min,
    }
