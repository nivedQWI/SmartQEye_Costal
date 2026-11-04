from typing import List
from pydantic import BaseModel, Field

class ContextEvaluationRequest(BaseModel):
    zone_id: str
    hour: int = Field(ge=0, le=23)
    behaviours: List[str] = Field(default_factory=list)
    dwell_seconds: int = Field(default=0, ge=0)
    nearby_contacts: int = Field(default=0, ge=0)
    contact_id: str = "CONTACT-001"

class TrackPoint(BaseModel):
    t: float = Field(ge=0)
    heading_deg: float
    shoreline_distance_m: float = Field(ge=0)
    speed_kmh: float = Field(ge=0)
    nearby_contacts: int = Field(default=0, ge=0)

class AutomatedTrackRequest(BaseModel):
    zone_id: str
    hour: int = Field(ge=0, le=23)
    contact_id: str
    points: List[TrackPoint]

class ObservationEvaluationRequest(BaseModel):
    zone_id: str
    hour: int = Field(ge=0, le=23)
    contact_id: str
    sensor: str
    observations: List[str] = Field(default_factory=list)
