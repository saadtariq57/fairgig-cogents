import jwt
from fastapi import Header
from typing import Optional

from ..config import config
from .errors import unauthorized, forbidden


def _extract_token(header_value: str) -> str:
    if not header_value:
        raise unauthorized("Missing bearer token")
    if not header_value.startswith("Bearer "):
        raise unauthorized("Authorization header must be 'Bearer <token>'")
    return header_value[7:].strip()


def _decode(token: str) -> dict:
    try:
        return jwt.decode(
            token, config.jwt_secret, algorithms=[config.jwt_algorithm]
        )
    except jwt.ExpiredSignatureError:
        raise unauthorized("Token expired")
    except jwt.InvalidTokenError:
        raise unauthorized("Invalid token")


def require_auth(authorization: Optional[str] = Header(default=None)) -> dict:
    """FastAPI dependency. Returns {id, role} from a valid JWT."""
    if not authorization:
        if not config.auth_required:
            return {"id": None, "role": "anonymous"}
        raise unauthorized("Missing bearer token")

    token = _extract_token(authorization)
    payload = _decode(token)
    return {"id": payload.get("sub"), "role": payload.get("role")}


def require_role(*allowed):
    """Factory that returns a dependency enforcing role membership."""
    def dependency(authorization: Optional[str] = Header(default=None)) -> dict:
        user = require_auth(authorization)
        if user.get("role") not in allowed:
            raise forbidden("Wrong role for this action")
        return user

    return dependency
