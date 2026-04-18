from ..services import detector
from ..validators.detect_schema import DetectRequest


def detect(payload: DetectRequest, _user: dict):
    return detector.run_all(payload)


def health():
    return {"status": "ok", "service": "anomaly"}
