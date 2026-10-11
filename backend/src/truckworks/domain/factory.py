"""Construct a ready factory once per server application lifespan."""

from datetime import UTC, datetime
from uuid import uuid4

from truckworks.domain.definitions import LINE_ID, MODEL_VERSION, PRODUCTION_CONFIG, STATIONS
from truckworks.domain.enums import RunStatus
from truckworks.domain.models import FactorySnapshot, ProductionCounts, StationSnapshot


def create_initial_factory() -> FactorySnapshot:
    return FactorySnapshot(
        schema_version="6",
        model_version=MODEL_VERSION,
        line_id=LINE_ID,
        run_id=uuid4(),
        run_status=RunStatus.READY,
        created_at=datetime.now(UTC),
        state_version=0,
        last_event_sequence=0,
        simulation_time_seconds=0.0,
        configuration=PRODUCTION_CONFIG,
        material_remaining=PRODUCTION_CONFIG.initial_material_count,
        counts=ProductionCounts(),
        stations=tuple(StationSnapshot(definition=station) for station in STATIONS),
    )
