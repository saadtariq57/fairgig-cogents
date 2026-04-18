from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import config
from .lib.errors import AppError, as_payload, bad_request
from .routes.anomalies import router as anomalies_router


app = FastAPI(
    title="FairGig Anomaly Service",
    version="1.0.0",
    description=(
        "Stateless anomaly detection over a worker's shift log. "
        "See `POST /anomalies/detect`."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.exception_handler(AppError)
async def handle_app_error(_req: Request, exc: AppError):
    return JSONResponse(status_code=exc.status, content=as_payload(exc))


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_req: Request, exc: RequestValidationError):
    # shape pydantic errors into the contract's VALIDATION_ERROR form
    details = []
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", []) if p != "body"]
        details.append({
            "field": ".".join(loc) if loc else "body",
            "message": err.get("msg", "invalid"),
        })
    err = bad_request("Invalid request payload", details)
    return JSONResponse(status_code=err.status, content=as_payload(err))


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(_req: Request, exc: StarletteHTTPException):
    # reshape FastAPI's default {"detail": "..."} into our contract's shape
    code_map = {401: "UNAUTHENTICATED", 403: "FORBIDDEN", 404: "NOT_FOUND"}
    code = code_map.get(exc.status_code, "INTERNAL")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": message}},
    )


@app.exception_handler(Exception)
async def handle_unexpected(_req: Request, exc: Exception):
    print(f"[anomaly] unhandled: {exc!r}")
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL", "message": "Something went wrong"}},
    )


@app.get("/health")
def root_health():
    return {"status": "ok", "service": "anomaly"}


app.include_router(anomalies_router)
