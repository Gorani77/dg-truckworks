"""Async PostgreSQL history writes, atomic snapshots and idempotent events."""

import json
from dataclasses import asdict
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from truckworks.domain.models import FactorySnapshot, PartSnapshot, ProductionEvent
from truckworks.persistence.models import EventRecord, PartRecord, RunRecord


def json_data(value: object) -> dict:
    def encode(item: object) -> str:
        if isinstance(item, UUID):
            return str(item)
        if isinstance(item, datetime):
            return item.isoformat()
        raise TypeError(f"Unsupported history value: {type(item).__name__}")
    return json.loads(json.dumps(asdict(value), default=encode))


def snapshot_parts(snapshot: FactorySnapshot) -> tuple[PartSnapshot, ...]:
    if snapshot.parts:
        return snapshot.parts
    if snapshot.part is not None:
        return (snapshot.part,)
    # The legacy ST-01 engine holds its part only in the station snapshot.
    for station in snapshot.stations:
        if station.current_part_id is not None:
            blocked = station.status == "BLOCKED" or station.status_before_fault == "BLOCKED"
            return (PartSnapshot(id=station.current_part_id, station_id=station.definition.id,
                                phase="BLOCKED" if blocked else "PROCESSING"),)
    return ()


class HistoryRepository:
    def __init__(self, engine: AsyncEngine) -> None:
        self.engine = engine
        self.sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def save(self, snapshot: FactorySnapshot, events: tuple[ProductionEvent, ...],
                   closed_reason: str | None = None, *, owner_id: str | None = None) -> None:
        async with self.sessions.begin() as session:
            previous = await session.get(RunRecord, snapshot.run_id)
            if previous is not None and previous.owner_id != owner_id:
                raise ValueError("생산 이력 소유자가 일치하지 않습니다.")
            if previous is not None and previous.state_version > snapshot.state_version:
                return
            last_sequence = previous.last_event_sequence if previous is not None else 0
            statement = insert(RunRecord).values(
                run_id=snapshot.run_id, owner_id=owner_id, created_at=snapshot.created_at,
                updated_at=datetime.now(UTC), scenario=snapshot.scenario, run_status=snapshot.run_status.value,
                state_version=snapshot.state_version, last_event_sequence=snapshot.last_event_sequence,
                closed_reason=closed_reason or (previous.closed_reason if previous else None),
                snapshot=json_data(snapshot))
            await session.execute(statement.on_conflict_do_update(
                index_elements=[RunRecord.run_id],
                set_={key: getattr(statement.excluded, key) for key in (
                    "updated_at", "scenario", "run_status", "state_version", "last_event_sequence", "closed_reason", "snapshot")},
                where=RunRecord.state_version <= statement.excluded.state_version))
            new_events = [asdict(event) for event in events if event.sequence > last_sequence]
            if new_events:
                await session.execute(insert(EventRecord).values(new_events).on_conflict_do_nothing(
                    index_elements=[EventRecord.run_id, EventRecord.sequence]))
            parts = snapshot_parts(snapshot)
            if parts:
                statement = insert(PartRecord).values([dict(run_id=snapshot.run_id, part_id=part.id,
                    production_number=part.production_number, data=json_data(part)) for part in parts])
                await session.execute(statement.on_conflict_do_update(
                    index_elements=[PartRecord.run_id, PartRecord.part_id],
                    set_={"production_number": statement.excluded.production_number, "data": statement.excluded.data}))

    async def runs(self, owner_id: str, limit: int, offset: int) -> list[dict]:
        async with self.sessions() as session:
            records = (await session.scalars(select(RunRecord).where(RunRecord.owner_id == owner_id).order_by(
                RunRecord.created_at.desc(), RunRecord.run_id.desc()).limit(limit).offset(offset))).all()
            return [dict(run_id=row.run_id, created_at=row.created_at, updated_at=row.updated_at,
                scenario=row.scenario, run_status=row.run_status, closed_reason=row.closed_reason,
                simulation_time_seconds=row.snapshot["simulation_time_seconds"],
                counts=row.snapshot["counts"], last_event_sequence=row.last_event_sequence) for row in records]

    async def run(self, owner_id: str, run_id: UUID) -> dict | None:
        async with self.sessions() as session:
            row = await session.get(RunRecord, run_id)
            if row is None or row.owner_id != owner_id:
                return None
            return dict(run_id=row.run_id, created_at=row.created_at, updated_at=row.updated_at,
                        closed_reason=row.closed_reason, snapshot=row.snapshot)

    async def parts(self, owner_id: str, run_id: UUID) -> list[dict]:
        async with self.sessions() as session:
            return list((await session.scalars(select(PartRecord.data).join(RunRecord).where(
                PartRecord.run_id == run_id, RunRecord.owner_id == owner_id)
                .order_by(PartRecord.production_number))).all())

    async def events(self, owner_id: str, run_id: UUID, after_sequence: int, limit: int, part_id: UUID | None) -> list[dict]:
        statement = select(EventRecord).join(RunRecord).where(
            EventRecord.run_id == run_id, RunRecord.owner_id == owner_id, EventRecord.sequence > after_sequence)
        if part_id is not None:
            statement = statement.where(EventRecord.part_id == part_id)
        async with self.sessions() as session:
            records = (await session.scalars(statement.order_by(EventRecord.sequence).limit(limit))).all()
            return [dict(run_id=row.run_id, sequence=row.sequence,
                simulation_time_seconds=row.simulation_time_seconds, occurred_at=row.occurred_at,
                station_id=row.station_id, part_id=row.part_id, kind=row.kind, message=row.message) for row in records]
