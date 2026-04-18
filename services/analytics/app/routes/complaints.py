import re
import httpx
from fastapi import APIRouter, Depends, Query
from typing import Optional

from ..config import config
from ..lib.auth import require_auth
from ..lib.errors import bad_request, internal


router = APIRouter(prefix="/analytics", tags=["analytics"])


# accepts e.g. 7d, 14d, 30d, 1d
_WINDOW_RE = re.compile(r"^(\d+)d$")


def _parse_window_days(raw: str) -> int:
    m = _WINDOW_RE.match((raw or "").strip())
    if not m:
        raise bad_request(
            "Invalid window",
            [{"field": "window", "message": "expected e.g. 7d, 14d, 30d"}],
        )
    days = int(m.group(1))
    if days <= 0 or days > 365:
        raise bad_request(
            "Window out of range",
            [{"field": "window", "message": "must be between 1d and 365d"}],
        )
    return days


@router.get(
    "/top-complaints",
    summary="Top grievance categories in a rolling window",
)
def top_complaints(
    window: str = Query("7d"),
    _user: dict = Depends(require_auth),
):
    days = _parse_window_days(window)

    # Call grievance service internal endpoint (x-internal-api-key auth).
    url = f"{config.grievance_service_url.rstrip('/')}/grievances/internal/top-complaints"
    headers = {"x-internal-api-key": config.internal_api_key}

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url, params={"days": days}, headers=headers)
    except httpx.HTTPError as e:
        raise internal(f"grievance service unreachable: {e}")

    if resp.status_code != 200:
        raise internal(
            f"grievance service returned {resp.status_code}: {resp.text[:200]}"
        )

    data = resp.json()
    items = data.get("items") or []

    # already sorted by the grievance side, but we resort defensively
    items = sorted(items, key=lambda r: r.get("count", 0), reverse=True)

    return {
        "window": window,
        "window_days": days,
        "items": items,
    }
