import os
from dotenv import load_dotenv

load_dotenv()


def _int(name, default):
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _float(name, default):
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


class Config:
    port = _int("PORT", 8003)
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    jwt_secret = os.getenv("JWT_SECRET", "dev-secret")
    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    # judges may hit us without a real login in the demo
    auth_required = os.getenv("AUTH_REQUIRED", "false").lower() == "true"

    # detection knobs
    z_threshold = _float("ANOMALY_Z_THRESHOLD", 2.0)
    mom_drop_threshold = _float("ANOMALY_MOM_DROP_THRESHOLD", 0.20)
    hourly_floor_ratio = _float("ANOMALY_HOURLY_FLOOR_RATIO", 0.60)
    min_shifts_for_zscore = _int("ANOMALY_MIN_SHIFTS_FOR_ZSCORE", 5)


config = Config()

PLATFORMS = ["Careem", "InDrive", "Foodpanda", "Bykea", "Uber", "Other"]
SEVERITIES = ["low", "medium", "high"]
