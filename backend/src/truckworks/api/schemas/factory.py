"""Validated HTTP representation of the domain snapshot."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from truckworks.domain.enums import RunStatus, StationStatus


class SnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, frozen=True)


class StationDefinitionResponse(SnapshotResponse):
    id: str
    name: str
    process_seconds: float = Field(gt=0)
    capacity: int = Field(gt=0)
    input_buffer_capacity: int = Field(ge=0)
    description: str
    input: str
    output: str


class ChassisDimensionsResponse(SnapshotResponse):
    length: int = Field(gt=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)


class ProductionConfigResponse(SnapshotResponse):
    initial_material_count: int = Field(ge=0)
    defect_probability: float = Field(ge=0, le=1)
    random_seed: int
    good_storage_capacity: int = Field(ge=0)
    rejected_storage_capacity: int = Field(ge=0)
    chassis_dimensions_mm: ChassisDimensionsResponse


class ProductionCountsResponse(SnapshotResponse):
    good_count: int = Field(ge=0)
    rejected_count: int = Field(ge=0)
    in_process_count: int = Field(ge=0)
    waiting_count: int = Field(ge=0)


class StationResponse(SnapshotResponse):
    definition: StationDefinitionResponse
    status: StationStatus
    current_part_id: UUID | None
    queued_part_ids: tuple[UUID, ...]
    remaining_process_seconds: float = Field(ge=0)
    reserved_part_ids: tuple[UUID, ...]
    status_before_fault: StationStatus | None


class PartResponse(SnapshotResponse):
    id: UUID
    stage: str
    phase: str
    quality: str
    station_id: str | None
    storage_location: str | None
    production_number: int = Field(gt=0)


class TransferResponse(SnapshotResponse):
    part_id: UUID
    from_station_id: str
    to_station_id: str
    started_at_seconds: float = Field(ge=0)
    duration_seconds: float = Field(gt=0)
    progress: float = Field(ge=0, le=1)


class FactoryStateResponse(SnapshotResponse):
    schema_version: str
    model_version: str
    line_id: str
    run_id: UUID
    run_status: RunStatus
    created_at: datetime
    state_version: int = Field(ge=0)
    last_event_sequence: int = Field(ge=0)
    simulation_time_seconds: float = Field(ge=0)
    configuration: ProductionConfigResponse
    material_remaining: int = Field(ge=0)
    counts: ProductionCountsResponse
    stations: tuple[StationResponse, ...]
    scenario: str
    part: PartResponse | None
    transfer: TransferResponse | None
    can_resume: bool
    parts: tuple[PartResponse, ...]
    transfers: tuple[TransferResponse, ...]


class SingleStationStartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_run_id: UUID


class ProductionEventResponse(SnapshotResponse):
    run_id: UUID
    sequence: int = Field(gt=0)
    simulation_time_seconds: float = Field(ge=0)
    station_id: str
    part_id: UUID | None
    kind: str
    message: str
    occurred_at: datetime
