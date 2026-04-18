class AppError(Exception):
    def __init__(self, status, code, message, details=None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = details


def bad_request(message, details=None):
    return AppError(400, "VALIDATION_ERROR", message, details)


def unauthorized(message="Unauthenticated"):
    return AppError(401, "UNAUTHENTICATED", message)


def forbidden(message="Wrong role"):
    return AppError(403, "FORBIDDEN", message)


def not_found(message="Not found"):
    return AppError(404, "NOT_FOUND", message)


def internal(message="Something went wrong"):
    return AppError(500, "INTERNAL", message)


def as_payload(err: AppError):
    body = {"code": err.code, "message": err.message}
    if err.details is not None:
        body["details"] = err.details
    return {"error": body}
