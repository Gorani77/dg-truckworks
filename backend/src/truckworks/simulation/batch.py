"""Finite FIFO line: one worker per station, bounded reserved input slots."""

from collections.abc import Generator
from dataclasses import replace
from random import Random
from uuid import UUID, uuid4

import simpy

from truckworks.domain.enums import RunStatus, StationStatus
from truckworks.domain.models import FactorySnapshot, PartSnapshot, ProductionCounts, StationSnapshot, TransferSnapshot
from truckworks.simulation.single_part import TRANSFER_SECONDS
from truckworks.simulation.single_station import SingleStationSimulation, SimulationConflict


class BatchSimulation(SingleStationSimulation):
    def __init__(self, snapshot: FactorySnapshot) -> None:
        super().__init__(snapshot)
        self._parts: dict[UUID, PartSnapshot] = {}
        self._transfers: dict[UUID, TransferSnapshot] = {}
        self._inputs = [simpy.Store(self._environment) for _ in snapshot.stations]
        # A token covers both an in-flight reservation and an arrived queue item.
        self._slots = [simpy.Container(self._environment,
            capacity=station.definition.input_buffer_capacity,
            init=station.definition.input_buffer_capacity) for station in snapshot.stations]
        self._source: list[UUID] = []
        self._quality: dict[UUID, bool] = {}

    def start(self, expected_run_id: UUID) -> FactorySnapshot:
        if expected_run_id != self.snapshot.run_id or self.snapshot.run_status != RunStatus.READY:
            raise SimulationConflict("이미 시작했거나 실행 ID가 달라졌습니다.")
        random = Random(self.snapshot.configuration.random_seed)
        self._source = [uuid4() for _ in range(self.snapshot.material_remaining)]
        # Decide in production-number order, independently of worker scheduling.
        self._quality = {part_id: random.random() < self.snapshot.configuration.defect_probability
                         for part_id in self._source}
        self._publish(scenario="batch", run_status=RunStatus.RUNNING, part=None, transfer=None)
        for index in range(len(self.snapshot.stations)):
            self._environment.process(self._worker(index))
        self._step_through(0.0)
        return self.snapshot

    def _publish(self, *, stations: tuple[StationSnapshot, ...] | None = None, **changes: object) -> None:
        parts = tuple(self._parts.values())
        stations = self.snapshot.stations if stations is None else stations
        self.snapshot = replace(self.snapshot, state_version=self.snapshot.state_version + 1,
            parts=parts, transfers=tuple(self._transfers.values()), stations=stations,
            counts=ProductionCounts(
                good_count=sum(part.phase == "STORED" and part.quality == "GOOD" for part in parts),
                rejected_count=sum(part.phase == "STORED" and part.quality == "REJECTED" for part in parts),
                in_process_count=sum(part.phase != "STORED" for part in parts),
                waiting_count=sum(len(station.queued_part_ids) for station in stations),
            ), **changes)

    def _station_updates(self, index: int, **changes: object) -> tuple[StationSnapshot, ...]:
        stations = list(self.snapshot.stations)
        stations[index] = replace(stations[index], **changes)
        return tuple(stations)

    def advance_to(self, elapsed_seconds: float) -> None:
        if self.snapshot.run_status != RunStatus.RUNNING:
            return
        target = max(elapsed_seconds, self.snapshot.simulation_time_seconds)
        self._step_through(target)
        if self.snapshot.run_status != RunStatus.RUNNING:
            return
        stations = tuple(replace(station,
            remaining_process_seconds=self._station_runtimes[index].remaining_at(target))
            for index, station in enumerate(self.snapshot.stations))
        self._transfers = {part_id: replace(transfer, progress=min(1.0, max(0.0,
            (target - transfer.started_at_seconds) / transfer.duration_seconds)))
            for part_id, transfer in self._transfers.items()}
        self._publish(simulation_time_seconds=target, stations=stations)

    def _worker(self, index: int) -> Generator[simpy.Event, object, None]:
        definition = self.snapshot.stations[index].definition
        source_index = 0
        runtime = self._station_runtimes[index]
        while True:
            yield from runtime.wait_available()
            if index == 0:
                if source_index == len(self._source):
                    return
                part_id = self._source[source_index]
                source_index += 1
                self._parts[part_id] = PartSnapshot(id=part_id, production_number=source_index,
                                                   station_id=definition.id)
                self._publish(material_remaining=self.snapshot.material_remaining - 1)
                self._record(part_id, "MATERIAL_LOADED", f"차체 #{source_index} 소재 투입", definition.id)
            else:
                part_id = yield self._inputs[index].get()
                # Arrival during a fault stays in the visible FIFO input queue.
                yield from runtime.wait_available()
                # Free a queue slot when processing begins, not at arrival.
                self._slots[index].put(1)
                station = self.snapshot.stations[index]
                self._parts[part_id] = replace(self._parts[part_id], phase="PROCESSING")
                self._publish(stations=self._station_updates(index,
                    queued_part_ids=tuple(item for item in station.queued_part_ids if item != part_id)))
                self._record(part_id, "QUEUE_LEFT", "입력 대기 종료", definition.id)

            self._parts[part_id] = replace(self._parts[part_id], phase="PROCESSING", station_id=definition.id)
            self._publish(simulation_time_seconds=float(self._environment.now),
                stations=self._station_updates(index, status=StationStatus.PROCESSING,
                    current_part_id=part_id, remaining_process_seconds=definition.process_seconds))
            self._record(part_id, "PROCESS_STARTED", f"{definition.name} 시작", definition.id)
            yield from runtime.process(definition.process_seconds)
            part = self._parts[part_id]
            if definition.id == "ST-02":
                part = replace(part, stage="FRAME")
            elif definition.id == "ST-03":
                part = replace(part, stage="DRILLED")
            elif definition.id == "ST-04":
                part = replace(part, quality="REJECTED" if self._quality[part_id] else "GOOD")
                self._record(part_id, "QUALITY_INSPECTED",
                    "검사 완료: 불량" if self._quality[part_id] else "검사 완료: 양품", definition.id)
            self._parts[part_id] = part
            self._publish(simulation_time_seconds=float(self._environment.now),
                stations=self._station_updates(index, remaining_process_seconds=0.0))
            self._record(part_id, "PROCESS_COMPLETED", f"{definition.name} 완료", definition.id)

            if index == len(self.snapshot.stations) - 1:
                self._parts[part_id] = replace(part, phase="STORED", station_id=None,
                    storage_location="REJECTED_STORAGE" if part.quality == "REJECTED" else "GOOD_STORAGE")
                self._release_station(index)
                self._record(part_id, "PART_STORED", "불량 보관 완료" if part.quality == "REJECTED" else "양품 보관 완료", definition.id)
                if self.snapshot.material_remaining == 0 and self.snapshot.counts.in_process_count == 0:
                    self._publish(run_status=RunStatus.COMPLETED, can_resume=False,
                                  simulation_time_seconds=float(self._environment.now))
                    self._record(part_id, "RUN_COMPLETED", "소재 20개 전체 생산 완료", definition.id)
                    return
            else:
                blocked = self._slots[index + 1].level == 0
                if blocked:
                    self._parts[part_id] = replace(part, phase="BLOCKED")
                    self._publish(stations=self._station_updates(index, status=StationStatus.BLOCKED))
                    self._record(part_id, "OUTPUT_BLOCKED", "다음 입력 공간이 가득 차 출력 대기", definition.id)
                yield from runtime.acquire_output(self._slots[index + 1])
                if blocked:
                    self._record(part_id, "OUTPUT_UNBLOCKED", "다음 입력 공간 확보, 출력 대기 해제", definition.id)
                next_station = self.snapshot.stations[index + 1]
                self._parts[part_id] = replace(self._parts[part_id], phase="TRANSFERRING", station_id=None)
                self._transfers[part_id] = TransferSnapshot(part_id=part_id, from_station_id=definition.id,
                    to_station_id=next_station.definition.id, started_at_seconds=float(self._environment.now),
                    duration_seconds=TRANSFER_SECONDS)
                self._publish(stations=self._station_updates(index + 1,
                    reserved_part_ids=(*next_station.reserved_part_ids, part_id)))
                self._release_station(index)
                self._record(part_id, "TRANSFER_STARTED", f"{definition.id} → {next_station.definition.id} 이동 시작", definition.id)
                self._environment.process(self._arrive(part_id, index + 1))

    def _release_station(self, index: int) -> None:
        self._publish(stations=self._station_updates(index, status=StationStatus.IDLE,
            current_part_id=None, remaining_process_seconds=0.0))

    def _arrive(self, part_id: UUID, index: int) -> Generator[simpy.Event, object, None]:
        yield self._environment.timeout(TRANSFER_SECONDS)
        station = self.snapshot.stations[index]
        del self._transfers[part_id]
        self._parts[part_id] = replace(self._parts[part_id], phase="QUEUED", station_id=station.definition.id)
        self._publish(simulation_time_seconds=float(self._environment.now),
            stations=self._station_updates(index,
                reserved_part_ids=tuple(item for item in station.reserved_part_ids if item != part_id),
                queued_part_ids=(*station.queued_part_ids, part_id)))
        self._record(part_id, "TRANSFER_COMPLETED", f"{station.definition.id} 도착", station.definition.id)
        self._record(part_id, "QUEUE_ENTERED", "입력 대기 도착", station.definition.id)
        yield self._inputs[index].put(part_id)

    def _set_control_state(self, status: RunStatus, can_resume: bool, kind: str, message: str) -> None:
        # Control applies to the entire run; attach one active part as event context.
        part = next((part for part in self._parts.values() if part.phase != "STORED"), None)
        if part is None:
            raise SimulationConflict("진행 중인 부품이 없습니다.")
        transfer = self._transfers.get(part.id)
        station_id = transfer.from_station_id if transfer else part.station_id
        self._publish(run_status=status, can_resume=can_resume)
        self._record(part.id, kind, message, station_id, self.snapshot.simulation_time_seconds)
