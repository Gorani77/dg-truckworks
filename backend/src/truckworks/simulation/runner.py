"""Pace SimPy with the event loop without blocking HTTP requests."""

import asyncio
from contextlib import suppress
from uuid import UUID
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from truckworks.persistence.writer import HistoryWriter

from truckworks.domain.enums import RunStatus
from truckworks.domain.models import FactorySnapshot, ProductionEvent
from truckworks.simulation.single_station import SingleStationSimulation
from truckworks.simulation.single_station import SimulationConflict
from truckworks.simulation.single_part import SinglePartSimulation
from truckworks.simulation.batch import BatchSimulation

FactoryFrame = tuple[FactorySnapshot, tuple[ProductionEvent, ...]]


class SimulationRunner:
    def __init__(self, history: "HistoryWriter | None" = None, *, owner_id: str | None = None) -> None:
        self.engine = SingleStationSimulation()
        self.owner_id = owner_id
        self._task: asyncio.Task[None] | None = None
        self._clock_started_at = 0.0
        self._simulation_started_at = 0.0
        self._history = history
        self._last_history_key: tuple | None = None
        self._last_history_time = 0.0
        self._subscribers: set[asyncio.Queue[FactoryFrame]] = set()

    def subscribe(self) -> asyncio.Queue[FactoryFrame]:
        queue: asyncio.Queue[FactoryFrame] = asyncio.Queue(maxsize=1)
        self._subscribers.add(queue)
        queue.put_nowait((self.engine.snapshot, self.engine.events))
        return queue

    def unsubscribe(self, queue: asyncio.Queue[FactoryFrame]) -> None:
        self._subscribers.discard(queue)

    def _publish(self) -> None:
        # Snapshot and cumulative events are captured without yielding. A slow
        # subscriber can skip intermediate frames without losing event history.
        frame = (self.engine.snapshot, self.engine.events)
        for queue in self._subscribers:
            if queue.full():
                queue.get_nowait()
            queue.put_nowait(frame)

    def capture_history(self, *, force: bool = False, closed_reason: str | None = None) -> None:
        self._publish()
        if self._history is None:
            return
        snapshot = self.engine.snapshot
        key = (snapshot.run_id, snapshot.last_event_sequence, snapshot.run_status)
        now = asyncio.get_running_loop().time()
        if force or key != self._last_history_key or now - self._last_history_time >= 1:
            self._history.offer(snapshot, self.engine.events, closed_reason, owner_id=self.owner_id)
            self._last_history_key, self._last_history_time = key, now

    def _require_run(self, expected_run_id: UUID) -> None:
        if expected_run_id != self.engine.snapshot.run_id:
            raise SimulationConflict("실행 ID가 달라졌습니다. 현재 상태를 다시 조회하세요.")

    def _anchor_clock(self) -> None:
        self._clock_started_at = asyncio.get_running_loop().time()
        self._simulation_started_at = self.engine.snapshot.simulation_time_seconds

    def _advance(self) -> None:
        elapsed = asyncio.get_running_loop().time() - self._clock_started_at
        self.engine.advance_to(self._simulation_started_at + elapsed)
        self.capture_history()

    def start(self, expected_run_id: UUID, *, full_line: bool = False, batch: bool = False) -> FactorySnapshot:
        if expected_run_id != self.engine.snapshot.run_id or self.engine.snapshot.run_status != RunStatus.READY:
            raise SimulationConflict("이미 시작했거나 실행 ID가 달라졌습니다. 현재 상태를 다시 조회하세요.")
        if batch:
            self.engine = BatchSimulation(self.engine.snapshot)
        elif full_line:
            self.engine = SinglePartSimulation(self.engine.snapshot)
        snapshot = self.engine.start(expected_run_id)
        self._anchor_clock()
        self._task = asyncio.create_task(self._run(self.engine))
        self.capture_history(force=True)
        return snapshot

    def pause(self, expected_run_id: UUID) -> FactorySnapshot:
        self._require_run(expected_run_id)
        if self.engine.snapshot.run_status == RunStatus.RUNNING:
            self._advance()
        snapshot = self.engine.pause()
        self.capture_history(force=True)
        return snapshot

    def resume(self, expected_run_id: UUID) -> FactorySnapshot:
        self._require_run(expected_run_id)
        snapshot = self.engine.resume()
        self._anchor_clock()
        self.capture_history(force=True)
        return snapshot

    def reset(self, expected_run_id: UUID) -> FactorySnapshot:
        self._require_run(expected_run_id)
        if self.engine.snapshot.run_status == RunStatus.RUNNING:
            self._advance()
        self.capture_history(force=True, closed_reason="RESET")
        if self._task is not None:
            self._task.cancel()
            self._task = None
        self.engine = SingleStationSimulation()
        self.capture_history(force=True)
        return self.engine.snapshot

    def fault(self, expected_run_id: UUID, station_id: str) -> FactorySnapshot:
        self._require_run(expected_run_id)
        if self.engine.snapshot.run_status == RunStatus.RUNNING:
            self._advance()
        snapshot = self.engine.fault(station_id)
        self.capture_history(force=True)
        return snapshot

    def repair(self, expected_run_id: UUID, station_id: str) -> FactorySnapshot:
        self._require_run(expected_run_id)
        if self.engine.snapshot.run_status == RunStatus.RUNNING:
            self._advance()
        snapshot = self.engine.repair(station_id)
        self.capture_history(force=True)
        return snapshot

    async def _run(self, engine: SingleStationSimulation) -> None:
        # Commands are synchronous on this event loop: no await separates their
        # run-ID check, state change and clock update. Keep the old task bound to
        # its engine so reset cannot advance the new run from an old clock.
        while engine is self.engine and (
            engine.snapshot.run_status == RunStatus.RUNNING or engine.snapshot.can_resume
        ):
            await asyncio.sleep(0.1)
            if engine is self.engine and engine.snapshot.run_status == RunStatus.RUNNING:
                self._advance()

    async def close(self, *, closed_reason: str = "SERVER_STOP") -> None:
        if self._task is not None:
            self._task.cancel()
            with suppress(asyncio.CancelledError):
                await self._task
        self.capture_history(force=True, closed_reason=closed_reason)
