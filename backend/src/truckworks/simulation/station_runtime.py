"""Interruptible station work and output-slot acquisition on one SimPy clock."""

from collections.abc import Generator

import simpy


class StationRuntime:
    def __init__(self, environment: simpy.Environment) -> None:
        self.environment = environment
        self.faulted = False
        self.changed = environment.event()
        self.repaired = environment.event()
        self.remaining = 0.0
        self.ends_at: float | None = None

    def remaining_at(self, seconds: float) -> float:
        return self.remaining if self.ends_at is None else max(0.0, self.ends_at - seconds)

    def fault(self) -> None:
        self.faulted = True
        self.changed.succeed()
        self.changed = self.environment.event()

    def repair(self) -> None:
        self.faulted = False
        self.repaired.succeed()
        self.repaired = self.environment.event()

    def wait_available(self) -> Generator[simpy.Event, object, None]:
        while self.faulted:
            yield self.repaired

    def process(self, seconds: float) -> Generator[simpy.Event, object, None]:
        self.remaining = seconds
        while self.remaining > 0:
            yield from self.wait_available()
            started_at = float(self.environment.now)
            self.ends_at = started_at + self.remaining
            # An abandoned timeout may fire later, but only this generator owns
            # completion. Once faulted it waits for repair before scheduling again.
            timeout = self.environment.timeout(self.remaining)
            completed = yield timeout | self.changed
            self.remaining = 0.0 if timeout in completed else max(
                0.0, self.remaining - (float(self.environment.now) - started_at))
            self.ends_at = None

    def acquire_output(self, slots: simpy.Container) -> Generator[simpy.Event, object, None]:
        while True:
            yield from self.wait_available()
            request = slots.get(1)
            completed = yield request | self.changed
            if not self.faulted and request in completed:
                return
            # A faulted station cannot quietly hold a downstream reservation.
            if request.triggered:
                slots.put(1)
            else:
                request.cancel()
