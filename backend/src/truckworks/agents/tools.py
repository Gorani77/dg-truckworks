"""Read-only tools over one immutable live observation; no engine commands or SQL."""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from truckworks.api.schemas.factory import (
    FactoryStateResponse, PartResponse, ProductionEventResponse, StationResponse,
)
from truckworks.domain.models import FactorySnapshot, ProductionEvent

ToolName = Literal["get_factory_state", "get_station_status", "get_recent_events",
                   "get_buffer_status", "get_part_history"]


class ToolInput(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    expected_run_id: UUID
    station_id: str | None = Field(default=None, min_length=1, max_length=64)
    part_id: UUID | None = None
    limit: int = Field(default=20, ge=1, le=100)


class BufferStatus(BaseModel):
    station_id: str
    status: str
    input_capacity: int
    queued_part_ids: list[UUID]
    reserved_part_ids: list[UUID]
    available_input_slots: int
    current_part_id: UUID | None


class BufferData(BaseModel):
    material_remaining: int
    stations: list[BufferStatus]
    limitation: str = "대기·예약 현황입니다. 재고 부족이나 병목의 원인을 확정하지 않습니다."


class EventData(BaseModel):
    events: list[ProductionEventResponse]
    matched_count: int
    truncated: bool


class PartHistoryData(EventData):
    part_id: UUID
    part: PartResponse | None
    limitation: str = "현재 실행의 메모리 이력입니다. 단독 ST-01은 별도 부품 상태가 없어 part가 null일 수 있습니다."


class ToolResult(BaseModel):
    tool_name: ToolName
    source: Literal["live_memory"] = "live_memory"
    observed_at: datetime
    run_id: UUID
    state_version: int
    last_event_sequence: int
    simulation_time_seconds: float
    data: FactoryStateResponse | StationResponse | BufferData | PartHistoryData | EventData


class ToolNotFound(ValueError):
    pass


@dataclass(frozen=True)
class ReadContext:
    snapshot: FactorySnapshot
    events: tuple[ProductionEvent, ...]


def execute_tool(name: ToolName, inputs: ToolInput, context: ReadContext) -> ToolResult:
    """Bounded tool registry shared by HTTP and the future agent workflow."""
    snapshot = context.snapshot
    if inputs.expected_run_id != snapshot.run_id:
        raise RuntimeError("실행 ID가 바뀌었습니다. 현재 상태를 다시 조회하세요.")
    if name not in ("get_factory_state", "get_station_status", "get_recent_events",
                    "get_buffer_status", "get_part_history"):
        raise ValueError("허용되지 않은 조회 도구입니다.")
    station = next((item for item in snapshot.stations
                    if item.definition.id == inputs.station_id), None)
    if inputs.station_id is not None and station is None:
        raise ToolNotFound("해당 설비가 현재 실행에 없습니다.")
    if name == "get_station_status" and inputs.station_id is None:
        raise ValueError("station_id가 필요합니다.")
    if name == "get_part_history" and inputs.part_id is None:
        raise ValueError("part_id가 필요합니다.")
    if name in ("get_factory_state", "get_buffer_status") and inputs.part_id is not None:
        raise ValueError("이 도구는 part_id를 받지 않습니다.")
    if name == "get_factory_state" and inputs.station_id is not None:
        raise ValueError("공장 전체 조회에는 station_id를 지정하지 않습니다.")
    if name == "get_station_status" and inputs.part_id is not None:
        raise ValueError("설비 상태 조회에는 part_id를 지정하지 않습니다.")
    if name == "get_part_history" and inputs.station_id is not None:
        raise ValueError("부품 이력은 설비 필터 없이 조회합니다.")
    if name == "get_factory_state":
        data = FactoryStateResponse.model_validate(snapshot)
    elif name == "get_station_status":
        data = StationResponse.model_validate(station)
    elif name == "get_buffer_status":
        selected = (station,) if station is not None else snapshot.stations
        data = BufferData(material_remaining=snapshot.material_remaining, stations=[
            BufferStatus(station_id=item.definition.id, status=item.status,
                input_capacity=item.definition.input_buffer_capacity,
                queued_part_ids=list(item.queued_part_ids), reserved_part_ids=list(item.reserved_part_ids),
                available_input_slots=max(0, item.definition.input_buffer_capacity
                    - len(item.queued_part_ids) - len(item.reserved_part_ids)),
                current_part_id=item.current_part_id) for item in selected])
    else:
        matched = [event for event in context.events
            if event.run_id == snapshot.run_id and event.sequence <= snapshot.last_event_sequence
            and (inputs.station_id is None or event.station_id == inputs.station_id)
            and (inputs.part_id is None or event.part_id == inputs.part_id)]
        event_data = dict(events=[ProductionEventResponse.model_validate(event)
                                 for event in matched[-inputs.limit:]],
                          matched_count=len(matched), truncated=len(matched) > inputs.limit)
        if name == "get_part_history":
            parts = snapshot.parts or ((snapshot.part,) if snapshot.part is not None else ())
            part = next((item for item in parts if item.id == inputs.part_id), None)
            legacy_part = any(item.current_part_id == inputs.part_id for item in snapshot.stations)
            if part is None and not matched and not legacy_part:
                raise ToolNotFound("해당 부품이 현재 실행에 없습니다.")
            data = PartHistoryData(part_id=inputs.part_id,
                part=PartResponse.model_validate(part) if part else None, **event_data)
        else:
            data = EventData(**event_data)
    return ToolResult(tool_name=name, observed_at=datetime.now(UTC), run_id=snapshot.run_id,
        state_version=snapshot.state_version, last_event_sequence=snapshot.last_event_sequence,
        simulation_time_seconds=snapshot.simulation_time_seconds, data=data)
