"""One chassis traverses five stations with four one-second transfers."""

from collections.abc import Generator
from dataclasses import replace
from random import Random
from uuid import UUID

import simpy

from truckworks.domain.enums import RunStatus, StationStatus
from truckworks.domain.models import FactorySnapshot, PartSnapshot, StationSnapshot, TransferSnapshot
from truckworks.simulation.single_station import SingleStationSimulation

TRANSFER_SECONDS = 1.0


class SinglePartSimulation(SingleStationSimulation):
    def __init__(self, snapshot: FactorySnapshot) -> None:
        super().__init__(snapshot)
        self._duration = sum(station.definition.process_seconds for station in snapshot.stations) + (
            len(snapshot.stations) - 1
        ) * TRANSFER_SECONDS
        self._station_index = 0
        # Decide once at start; reveal only when inspection finishes.
        self._rejected = Random(snapshot.configuration.random_seed).random() < snapshot.configuration.defect_probability

    def advance_to(self, elapsed_seconds: float) -> None:
        if self.snapshot.run_status != RunStatus.RUNNING:
            return
        target = max(elapsed_seconds, self.snapshot.simulation_time_seconds)
        self._step_through(target)
        if self.snapshot.run_status != RunStatus.RUNNING:
            return
        if self.snapshot.transfer is not None:
            transfer = self.snapshot.transfer
            self._publish(
                simulation_time_seconds=target,
                transfer=replace(transfer, progress=min(1.0, max(0.0,
                    (target - transfer.started_at_seconds) / transfer.duration_seconds))),
            )
        else:
            self._publish(
                simulation_time_seconds=target,
                stations=self._station_updates(self._station_index,
                    remaining_process_seconds=self._station_runtimes[self._station_index].remaining_at(target)),
            )

    def _publish(self, **changes: object) -> None:
        self.snapshot = replace(self.snapshot, state_version=self.snapshot.state_version + 1, **changes)

    def _station_updates(self, index: int, **changes: object) -> tuple[StationSnapshot, ...]:
        stations = list(self.snapshot.stations)
        stations[index] = replace(stations[index], **changes)
        return tuple(stations)

    def _process_material(self, part_id: UUID) -> Generator[simpy.Event, object, None]:
        part = PartSnapshot(id=part_id)
        self._publish(
            scenario="single_part", run_status=RunStatus.RUNNING,
            material_remaining=self.snapshot.material_remaining - 1,
            counts=replace(self.snapshot.counts, in_process_count=1), part=part,
        )
        for index, station in enumerate(self.snapshot.stations):
            self._station_index = index
            definition = station.definition
            runtime = self._station_runtimes[index]
            # A pre-faulted destination accepts the reserved arrival but cannot
            # begin processing until repaired; retain its place in the input.
            if runtime.faulted:
                part = replace(part, phase="QUEUED", station_id=definition.id)
                self._publish(part=part, transfer=None,
                    simulation_time_seconds=float(self._environment.now),
                    counts=replace(self.snapshot.counts, waiting_count=1),
                    stations=self._station_updates(index, reserved_part_ids=(), queued_part_ids=(part_id,)))
                yield from runtime.wait_available()
            part = replace(part, phase="PROCESSING", station_id=definition.id)
            self._publish(
                part=part, transfer=None,
                counts=replace(self.snapshot.counts, waiting_count=0),
                simulation_time_seconds=float(self._environment.now),
                stations=self._station_updates(index, status=StationStatus.PROCESSING,
                    current_part_id=part_id, reserved_part_ids=(), queued_part_ids=(),
                    remaining_process_seconds=definition.process_seconds),
            )
            self._record(part_id, "PROCESS_STARTED", f"{definition.name} 시작", definition.id)
            yield from runtime.process(definition.process_seconds)

            if definition.id == "ST-02":
                part = replace(part, stage="FRAME")
            elif definition.id == "ST-03":
                part = replace(part, stage="DRILLED")
            elif definition.id == "ST-04":
                part = replace(part, quality="REJECTED" if self._rejected else "GOOD")
                self._record(part_id, "QUALITY_INSPECTED",
                    "검사 완료: 불량" if self._rejected else "검사 완료: 양품", definition.id)
            self._publish(part=part, simulation_time_seconds=float(self._environment.now),
                stations=self._station_updates(index, status=StationStatus.IDLE,
                    current_part_id=None, remaining_process_seconds=0.0))
            self._record(part_id, "PROCESS_COMPLETED", f"{definition.name} 완료", definition.id)

            if index < len(self.snapshot.stations) - 1:
                next_definition = self.snapshot.stations[index + 1].definition
                # A single part reserves its downstream input slot before departure.
                part = replace(part, phase="TRANSFERRING", station_id=None)
                self._publish(part=part,
                    stations=self._station_updates(index + 1, reserved_part_ids=(part_id,)),
                    transfer=TransferSnapshot(part_id=part_id, from_station_id=definition.id,
                        to_station_id=next_definition.id, started_at_seconds=float(self._environment.now),
                        duration_seconds=TRANSFER_SECONDS))
                self._record(part_id, "TRANSFER_STARTED", f"{definition.id} → {next_definition.id} 이동 시작", definition.id)
                yield self._environment.timeout(TRANSFER_SECONDS)
                self._record(part_id, "TRANSFER_COMPLETED", f"{next_definition.id} 도착", next_definition.id)

        part = replace(part, phase="STORED", station_id=None,
            storage_location="REJECTED_STORAGE" if self._rejected else "GOOD_STORAGE")
        self._publish(part=part, transfer=None, run_status=RunStatus.COMPLETED,
            simulation_time_seconds=float(self._environment.now),
            counts=replace(self.snapshot.counts, in_process_count=0,
                good_count=0 if self._rejected else 1, rejected_count=1 if self._rejected else 0))
        self._record(part_id, "PART_STORED", "불량 보관 완료" if self._rejected else "양품 보관 완료", "ST-05")
        self._record(part_id, "RUN_COMPLETED", "차체 1개 생산 시나리오 완료", "ST-05")
