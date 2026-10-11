"""Immutable model definitions and snapshots; no HTTP or database dependencies."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID

from truckworks.domain.enums import RunStatus, StationStatus


@dataclass(frozen=True, slots=True)
class StationDefinition:
    id: str
    name: str
    process_seconds: float
    capacity: int
    input_buffer_capacity: int
    description: str
    input: str
    output: str


@dataclass(frozen=True, slots=True)
class ChassisDimensions:
    length: int
    width: int
    height: int


@dataclass(frozen=True, slots=True)
class ProductionConfig:
    initial_material_count: int
    defect_probability: float
    random_seed: int
    good_storage_capacity: int
    rejected_storage_capacity: int
    chassis_dimensions_mm: ChassisDimensions


@dataclass(frozen=True, slots=True)
class ProductionCounts:
    good_count: int = 0
    rejected_count: int = 0
    in_process_count: int = 0
    waiting_count: int = 0


@dataclass(frozen=True, slots=True)
class StationSnapshot:
    definition: StationDefinition
    status: StationStatus = StationStatus.IDLE
    current_part_id: UUID | None = None
    queued_part_ids: tuple[UUID, ...] = ()
    remaining_process_seconds: float = 0.0
    reserved_part_ids: tuple[UUID, ...] = ()
    status_before_fault: StationStatus | None = None


@dataclass(frozen=True, slots=True)
class PartSnapshot:
    id: UUID
    stage: str = "RAW"
    phase: str = "PROCESSING"
    quality: str = "UNINSPECTED"
    station_id: str | None = None
    storage_location: str | None = None
    production_number: int = 1


@dataclass(frozen=True, slots=True)
class TransferSnapshot:
    part_id: UUID
    from_station_id: str
    to_station_id: str
    started_at_seconds: float
    duration_seconds: float
    progress: float = 0.0


@dataclass(frozen=True, slots=True)
class FactorySnapshot:
    schema_version: str
    model_version: str
    line_id: str
    run_id: UUID
    run_status: RunStatus
    created_at: datetime
    state_version: int
    last_event_sequence: int
    simulation_time_seconds: float
    configuration: ProductionConfig
    material_remaining: int
    counts: ProductionCounts
    stations: tuple[StationSnapshot, ...]
    scenario: str = "single_station"
    part: PartSnapshot | None = None
    transfer: TransferSnapshot | None = None
    can_resume: bool = False
    parts: tuple[PartSnapshot, ...] = ()
    transfers: tuple[TransferSnapshot, ...] = ()


@dataclass(frozen=True, slots=True)
class ProductionEvent:
    run_id: UUID
    sequence: int
    simulation_time_seconds: float
    station_id: str
    part_id: UUID | None
    kind: str
    message: str
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))
