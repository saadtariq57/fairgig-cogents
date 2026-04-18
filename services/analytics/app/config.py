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


class Config:
    port = _int("PORT", 8005)
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    database_url = os.getenv("DATABASE_URL", "")

    jwt_secret = os.getenv("JWT_SECRET", "dev-secret")
    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    # analytics always wants a real caller; no anonymous mode
    auth_required = os.getenv("AUTH_REQUIRED", "true").lower() == "true"

    # privacy
    k_anonymity_min = _int("K_ANONYMITY_MIN", 5)

    # peer service
    grievance_service_url = os.getenv(
        "GRIEVANCE_SERVICE_URL", "http://localhost:8004"
    )
    internal_api_key = os.getenv("INTERNAL_API_KEY", "change-me-too")


config = Config()
