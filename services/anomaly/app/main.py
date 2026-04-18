import os
from typing import Literal
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="FairGig Anomaly", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "anomaly"}


class Shift(BaseModel):
    date: str
    platform: str
    hours_worked: float
    gross_earned: float
    platform_deductions: float
    net_received: float


class Baseline(BaseModel):
    city_median_hourly_rate: float | None = None
    worker_rolling_avg_monthly_net: float | None = None


class DetectRequest(BaseModel):
    worker_id: str | None = None
    shifts: list[Shift] = Field(default_factory=list)
    baseline: Baseline | None = None


class Finding(BaseModel):
    kind: Literal[
        "z_score_deduction",
        "month_on_month_drop",
        "below_median_hourly_rate",
    ]
    severity: Literal["info", "warning", "critical"]
    explanation: str
    evidence: dict = Field(default_factory=dict)


class DetectResponse(BaseModel):
    worker_id: str | None = None
    findings: list[Finding] = Field(default_factory=list)


@app.post("/anomalies/detect", response_model=DetectResponse)
def detect(req: DetectRequest) -> DetectResponse:
    return DetectResponse(worker_id=req.worker_id, findings=[])
