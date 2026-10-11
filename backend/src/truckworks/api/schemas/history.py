from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from truckworks.api.schemas.factory import ProductionCountsResponse


class StorageStatusResponse(BaseModel):
    enabled: bool
    pending_runs: int
    error: str | None


class RunSummaryResponse(BaseModel):
    run_id: UUID
    created_at: datetime
    updated_at: datetime
    scenario: str
    run_status: str
    closed_reason: str | None
    simulation_time_seconds: float
    counts: ProductionCountsResponse
    last_event_sequence: int


class RunHistoryResponse(BaseModel):
    run_id: UUID
    created_at: datetime
    updated_at: datetime
    closed_reason: str | None
    # Keep historical schema versions readable without converting them to the
    # current live response model or pretending to restore engine state.
    snapshot: dict[str, Any]
