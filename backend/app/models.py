from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

Direction = Literal["outbound", "return"]
# Mapped to 49 CFR 37.131(f) in michigan-accessible-transit-problem-statement.md §2.3.
IncidentType = Literal[
    "late_pickup",
    "no_show",
    "trip_denied",
    "excessive_length",
    "long_hold",
    "wrong_vehicle",
    "driver_conduct",
    "other",
]


class TripIn(BaseModel):
    rider_id: str = Field(min_length=1, max_length=64)
    provider_id: str
    direction: Direction
    incident_type: IncidentType | None = None  # None = the ride was fine
    minutes_late: int | None = Field(None, ge=0, le=1440)
    notes: str | None = Field(None, max_length=1000)
    trip_date: date = Field(default_factory=date.today)
    logged_via: Literal["tap", "voice", "caregiver"] = "tap"


class Trip(TripIn):
    id: str
    logged_at: datetime


class Extraction(BaseModel):
    """What Granite pulls out of a spoken description. See extract.PROMPT."""

    provider: str | None = None
    direction: Direction | None = None
    incident_types: list[IncidentType] = Field(min_length=1)
    minutes_late: int | None = Field(None, ge=0, le=1440)
    date_mentioned: str | None = None
    summary: str


class ExtractRequest(BaseModel):
    transcript: str = Field(min_length=1, max_length=2000)


class ComplaintRequest(BaseModel):
    rider_id: str
    trip_ids: list[str] = Field(min_length=1, max_length=20)
