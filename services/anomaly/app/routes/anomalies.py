from fastapi import APIRouter, Depends

from ..controllers import anomalies_controller
from ..lib.jwt_guard import require_auth
from ..validators.detect_schema import DetectRequest, DetectResponse


router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("/health")
def health():
    return anomalies_controller.health()


@router.post(
    "/detect",
    response_model=DetectResponse,
    summary="Detect earnings anomalies in a worker's shift log",
    description=(
        "Stateless. Give us a list of shifts (and optionally a city median "
        "hourly rate) and we return plain-language flags for unusual "
        "deductions, month-on-month income drops, and below-median hourly "
        "rate. See `method` in the response for the exact thresholds."
    ),
)
def detect(payload: DetectRequest, user: dict = Depends(require_auth)):
    return anomalies_controller.detect(payload, user)
