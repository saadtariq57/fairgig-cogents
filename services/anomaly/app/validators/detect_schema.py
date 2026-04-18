from datetime import date
from typing import List, Optional, Literal

from pydantic import BaseModel, Field, field_validator, ConfigDict


class ShiftIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    date: date
    platform: str = Field(min_length=1, max_length=64)
    hours_worked: float = Field(gt=0, le=24)
    gross_earned: float = Field(ge=0)
    platform_deductions: float = Field(ge=0)
    net_received: float = Field(ge=0)

    @field_validator("platform")
    @classmethod
    def _trim_platform(cls, v: str) -> str:
        return v.strip()


class DetectRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    worker_id: Optional[str] = None
    city_median_hourly_rate: Optional[float] = Field(default=None, gt=0)
    shifts: List[ShiftIn] = Field(...)

    @field_validator("shifts")
    @classmethod
    def _non_empty(cls, v: List[ShiftIn]) -> List[ShiftIn]:
        if len(v) == 0:
            raise ValueError("shifts must contain at least one entry")
        return v


class Flag(BaseModel):
    type: Literal[
        "unusual_deduction",
        "sudden_income_drop",
        "below_median_hourly",
    ]
    severity: Literal["low", "medium", "high"]
    explanation: str
    # one of these two will be present depending on flag type
    date: Optional[str] = None
    period: Optional[str] = None


class DetectResponse(BaseModel):
    worker_id: Optional[str]
    summary: str
    flags: List[Flag]
    method: dict
