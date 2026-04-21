from ..services import detector, narrator
from ..validators.detect_schema import DetectRequest


def detect(payload: DetectRequest, _user: dict):
    return detector.run_all(payload)


def narrate(payload: DetectRequest, _user: dict):
    detection = detector.run_all(payload)
    ai = narrator.narrate(detection)
    return {
        "worker_id": detection.get("worker_id"),
        "summary": detection.get("summary"),
        "flags": detection.get("flags", []),
        "method": detection.get("method", {}),
        "statement": ai["statement"],
        "ai_model": ai["model"],
        "ai_source": ai["source"],
    }


def health():
    return {"status": "ok", "service": "anomaly"}
