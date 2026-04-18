from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date

from ..db import fetch_all
from ..lib.auth import require_auth
from ..lib.errors import bad_request
from ..lib.kanon import is_sufficient


router = APIRouter(prefix="/analytics", tags=["analytics"])


def _parse_date(name: str, raw: Optional[str]):
    if raw is None or raw == "":
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        raise bad_request(
            f"Invalid {name} date",
            [{"field": name, "message": "expected YYYY-MM-DD"}],
        )


@router.get(
    "/commission-trends",
    summary="Weekly avg commission % per platform",
)
def commission_trends(
    platform: Optional[str] = Query(None, description="e.g. Careem; omit for all"),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
    _user: dict = Depends(require_auth),
):
    d_from = _parse_date("from", from_)
    d_to = _parse_date("to", to)

    # commission % = platform_deductions / gross_earned * 100
    # weekly bucket via date_trunc('week', shift_date) and ISO week label
    where = ["s.gross_earned > 0"]
    params: list = []

    if platform:
        where.append("s.platform = %s")
        params.append(platform)
    if d_from:
        where.append("s.shift_date >= %s")
        params.append(d_from)
    if d_to:
        where.append("s.shift_date <= %s")
        params.append(d_to)

    where_sql = " AND ".join(where)

    sql = f"""
        SELECT
          to_char(date_trunc('week', s.shift_date), 'IYYY-"W"IW') AS week,
          s.platform AS platform,
          AVG(s.platform_deductions / s.gross_earned) * 100 AS avg_commission_pct,
          COUNT(DISTINCT s.worker_id) AS sample_size
        FROM "earnings"."shifts" s
        WHERE {where_sql}
        GROUP BY week, s.platform
        ORDER BY week ASC, s.platform ASC
    """
    rows = fetch_all(sql, params)

    # shape + drop buckets below k
    series = []
    for r in rows:
        n = int(r["sample_size"] or 0)
        entry = {
            "week": r["week"],
            "platform": r["platform"],
            "sample_size": n,
        }
        if is_sufficient(n):
            entry["avg_commission_pct"] = round(float(r["avg_commission_pct"]), 2)
        else:
            entry["avg_commission_pct"] = None
            entry["reason"] = "insufficient_sample"
        series.append(entry)

    return {
        "platform": platform,
        "from": from_,
        "to": to,
        "series": series,
    }
