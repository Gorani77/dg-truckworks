"""One material, one input station; no downstream processing yet."""

from collections.abc import Generator
from dataclasses import replace
from uuid import UUID, uuid4

import simpy

from truckworks.domain.enums import RunStatus, StationStatus
from truckworks.domain.factory import create_initial_factory
from truckworks.domain.models import FactorySnapshot, ProductionEvent
from truckworks.simulation.station_runtime import StationRuntime


class SimulationConflict(Exception):
    """The current run cannot accept this command."""


class SingleStationSimulation:
    def __init__(self, snapshot: FactorySnapshot | None = None) -> None:
        self.snapshot = snapshot if snapshot is not None else create_initial_factory()
        self.events: tuple[ProductionEvent, ...] = ()
        self._environment = simpy.Environment()
        self._duration = self.snapshot.stations[0].definition.process_seconds
        self._station_runtimes = [StationRuntime(self._environment) for _ in self.snapshot.stations]

    def start(self, expected_run_id: UUID) -> FactorySnapshot:
        if expected_run_id != self.snapshot.run_id:
            raise SimulationConflict("실행 ID가 달라졌습니다. 현재 상태를 다시 조회하세요.")
        if self.snapshot.run_status != RunStatus.READY:
            raise SimulationConflict("이 실행에서는 이미 차체 1개 처리를 시작했습니다.")

        part_id = uuid4()
        self._environment.process(self._process_material(part_id))
        # Process initialization at t=0 before returning the start response.
        self._step_through(0.0)
        return self.snapshot

    def advance_to(self, elapsed_seconds: float) -> None:
        if self.snapshot.run_status != RunStatus.RUNNING:
            return
        target = max(elapsed_seconds, self.snapshot.simulation_time_seconds)
        # Include events exactly at the target (including the completion timeout).
        self._step_through(target)
        if self.snapshot.run_status == RunStatus.RUNNING:
            station = replace(
                self.snapshot.stations[0],
                remaining_process_seconds=self._station_runtimes[0].remaining_at(target),
            )
            self.snapshot = replace(
                self.snapshot,
                simulation_time_seconds=target,
                state_version=self.snapshot.state_version + 1,
                stations=(station, *self.snapshot.stations[1:]),
            )

    def _step_through(self, target: float) -> None:
        while self._environment.peek() <= target:
            self._environment.step()

    def _process_material(self, part_id: UUID) -> Generator[simpy.Event, object, None]:
        station = replace(
            self.snapshot.stations[0],
            status=StationStatus.PROCESSING,
            current_part_id=part_id,
            remaining_process_seconds=self._duration,
        )
        self.snapshot = replace(
            self.snapshot,
            run_status=RunStatus.RUNNING,
            material_remaining=self.snapshot.material_remaining - 1,
            counts=replace(self.snapshot.counts, in_process_count=1),
            state_version=self.snapshot.state_version + 1,
            stations=(station, *self.snapshot.stations[1:]),
        )
        self._record(part_id, "PROCESS_STARTED", "소재 1개 투입 처리를 시작했습니다.")
        yield from self._station_runtimes[0].process(self._duration)

        # Keep the processed material in this station until transfer is implemented.
        station = replace(
            self.snapshot.stations[0],
            status=StationStatus.BLOCKED,
            remaining_process_seconds=0.0,
        )
        self.snapshot = replace(
            self.snapshot,
            run_status=RunStatus.PAUSED,
            simulation_time_seconds=float(self._environment.now),
            state_version=self.snapshot.state_version + 1,
            stations=(station, *self.snapshot.stations[1:]),
        )
        self._record(part_id, "PROCESS_COMPLETED", "소재 투입 완료. 다음 공정 미연결로 설비에 보관합니다.")

    def pause(self) -> FactorySnapshot:
        if self.snapshot.run_status != RunStatus.RUNNING:
            raise SimulationConflict("실행 중인 작업만 일시정지할 수 있습니다.")
        self._align_command_clock()
        self._set_control_state(RunStatus.PAUSED, True, "RUN_PAUSED", "사용자가 실행을 일시정지했습니다.")
        return self.snapshot

    def resume(self) -> FactorySnapshot:
        if self.snapshot.run_status != RunStatus.PAUSED or not self.snapshot.can_resume:
            raise SimulationConflict("사용자가 일시정지한 작업만 재개할 수 있습니다.")
        self._set_control_state(RunStatus.RUNNING, False, "RUN_RESUMED", "남은 가공·이동 시간부터 실행을 재개했습니다.")
        self._step_through(self.snapshot.simulation_time_seconds)
        return self.snapshot

    def _station_index_for(self, station_id: str) -> int:
        for index, station in enumerate(self.snapshot.stations):
            if station.definition.id == station_id:
                return index
        raise SimulationConflict("존재하지 않는 설비입니다.")

    def _align_command_clock(self) -> None:
        # Display time may lie between discrete events. Apply commands at that
        # exact simulation time so elapsed work is deducted before interruption.
        if self.snapshot.run_status != RunStatus.RUNNING:
            return
        target = self.snapshot.simulation_time_seconds
        if target > self._environment.now:
            self._environment.timeout(target - float(self._environment.now))
        self._step_through(target)

    def fault(self, station_id: str) -> FactorySnapshot:
        index = self._station_index_for(station_id)
        if self.snapshot.run_status != RunStatus.RUNNING and not self.snapshot.can_resume:
            raise SimulationConflict("생산 중이거나 사용자가 일시정지한 실행에서만 고장을 발생시킬 수 있습니다.")
        station = self.snapshot.stations[index]
        if station.status == StationStatus.FAULTED:
            raise SimulationConflict("이미 고장 난 설비입니다.")
        self._align_command_clock()
        runtime = self._station_runtimes[index]
        remaining = runtime.remaining_at(self.snapshot.simulation_time_seconds)
        stations = list(self.snapshot.stations)
        stations[index] = replace(station, status=StationStatus.FAULTED,
            status_before_fault=station.status, remaining_process_seconds=remaining)
        self.snapshot = replace(self.snapshot, stations=tuple(stations), state_version=self.snapshot.state_version + 1)
        runtime.fault()
        self._record(station.current_part_id, "STATION_FAULTED", f"{station.definition.name} 수동 고장 발생",
                     station_id, self.snapshot.simulation_time_seconds)
        if self.snapshot.run_status == RunStatus.RUNNING:
            self._step_through(self.snapshot.simulation_time_seconds)
        return self.snapshot

    def repair(self, station_id: str) -> FactorySnapshot:
        index = self._station_index_for(station_id)
        station = self.snapshot.stations[index]
        if station.status != StationStatus.FAULTED:
            raise SimulationConflict("고장 난 설비만 복구할 수 있습니다.")
        self._align_command_clock()
        stations = list(self.snapshot.stations)
        stations[index] = replace(station, status=station.status_before_fault or StationStatus.IDLE,
                                   status_before_fault=None)
        self.snapshot = replace(self.snapshot, stations=tuple(stations), state_version=self.snapshot.state_version + 1)
        self._station_runtimes[index].repair()
        self._record(station.current_part_id, "STATION_RECOVERED", f"{station.definition.name} 복구, 남은 작업 이어가기",
                     station_id, self.snapshot.simulation_time_seconds)
        # While globally paused, clear the fault but defer worker wake-ups until
        # resume, including zero-time queue moves and new material consumption.
        if self.snapshot.run_status == RunStatus.RUNNING:
            self._step_through(self.snapshot.simulation_time_seconds)
        return self.snapshot

    def _set_control_state(self, status: RunStatus, can_resume: bool, kind: str, message: str) -> None:
        # Control events use the displayed simulation clock; env.now may still
        # point to the previous discrete event while a process is in progress.
        station = next((item for item in self.snapshot.stations if item.current_part_id is not None), None)
        part_id = self.snapshot.part.id if self.snapshot.part is not None else station.current_part_id if station else None
        if part_id is None:
            raise SimulationConflict("진행 중인 부품이 없습니다.")
        station_id = (
            self.snapshot.transfer.from_station_id if self.snapshot.transfer is not None
            else self.snapshot.part.station_id if self.snapshot.part is not None
            else station.definition.id if station else None
        )
        self.snapshot = replace(self.snapshot, run_status=status, can_resume=can_resume,
                                state_version=self.snapshot.state_version + 1)
        self._record(part_id, kind, message, station_id, self.snapshot.simulation_time_seconds)

    def _record(self, part_id: UUID | None, kind: str, message: str, station_id: str | None = None,
                simulation_time_seconds: float | None = None) -> None:
        sequence = self.snapshot.last_event_sequence + 1
        self.events = (*self.events, ProductionEvent(
            run_id=self.snapshot.run_id,
            sequence=sequence,
            simulation_time_seconds=float(self._environment.now) if simulation_time_seconds is None else simulation_time_seconds,
            station_id=station_id if station_id is not None else self.snapshot.stations[0].definition.id,
            part_id=part_id,
            kind=kind,
            message=message,
        ))
        self.snapshot = replace(self.snapshot, last_event_sequence=sequence)
