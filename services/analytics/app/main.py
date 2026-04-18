from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import config
from .db import get_conn
from .lib.errors import AppError, as_payload, bad_request
from .routes.median import router as median_router
from .routes.commission import router as commission_router
from .routes.income import router as income_router
from .routes.complaints import router as complaints_router
from .routes.vulnerability import router as vulnerability_router
from .routes.worker import router as worker_router


app = FastAPI(
    title="FairGig Analytics Service",
    version="1.0.0",
    description=(
        "Aggregate analytics across earnings + grievance data with a "
        "baked-in k-anonymity privacy floor (k=5). All endpoints are "
        "read-only. See `/docs`."
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
    details = []
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", []) if p not in ("body", "query")]
        details.append({
            "field": ".".join(loc) if loc else "body",
            "message": err.get("msg", "invalid"),
        })
    err = bad_request("Invalid request", details)
    return JSONResponse(status_code=err.status, content=as_payload(err))


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(_req: Request, exc: StarletteHTTPException):
    code_map = {401: "UNAUTHENTICATED", 403: "FORBIDDEN", 404: "NOT_FOUND"}
    code = code_map.get(exc.status_code, "INTERNAL")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": message}},
    )


@app.exception_handler(Exception)
async def handle_unexpected(_req: Request, exc: Exception):
    print(f"[analytics] unhandled: {exc!r}")
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL", "message": "Something went wrong"}},
    )


@app.get("/health")
def health():
    try:
        with get_conn() as c, c.cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            cur.fetchone()
        return {"status": "ok", "service": "analytics", "db": "reachable"}
    except Exception as e:
        return {
            "status": "degraded",
            "service": "analytics",
            "db": "unreachable",
            "error": str(e),
        }


app.include_router(median_router)
app.include_router(commission_router)
app.include_router(income_router)
app.include_router(complaints_router)
app.include_router(vulnerability_router)
app.include_router(worker_router)
