"""History tables; the live SimPy engine is not reconstructed from these rows."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class RunRecord(Base):
    __tablename__ = "production_runs"

    run_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    owner_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scenario: Mapped[str] = mapped_column(String(32))
    run_status: Mapped[str] = mapped_column(String(32))
    state_version: Mapped[int] = mapped_column(Integer)
    last_event_sequence: Mapped[int] = mapped_column(Integer)
    closed_reason: Mapped[str | None] = mapped_column(String(32), nullable=True)
    snapshot: Mapped[dict] = mapped_column(JSONB)


class EventRecord(Base):
    __tablename__ = "production_events"

    run_id: Mapped[UUID] = mapped_column(ForeignKey("production_runs.run_id"), primary_key=True)
    sequence: Mapped[int] = mapped_column(Integer, primary_key=True)
    simulation_time_seconds: Mapped[float] = mapped_column(Float)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    station_id: Mapped[str] = mapped_column(String(32))
    part_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True, index=True)
    kind: Mapped[str] = mapped_column(String(64))
    message: Mapped[str] = mapped_column(String(512))


class PartRecord(Base):
    __tablename__ = "production_parts"

    run_id: Mapped[UUID] = mapped_column(ForeignKey("production_runs.run_id"), primary_key=True)
    part_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    production_number: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSONB)


class AnalysisRecord(Base):
    __tablename__ = "analysis_attempts"

    analysis_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    owner_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    # Independent of the production writer's commit order.
    run_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(32))
    revision: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSONB)
