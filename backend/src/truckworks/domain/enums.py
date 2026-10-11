"""Factory state vocabulary shared by the engine and API schemas."""

from enum import StrEnum


class RunStatus(StrEnum):
    READY = "READY"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"


class StationStatus(StrEnum):
    IDLE = "IDLE"
    PROCESSING = "PROCESSING"
    STARVED = "STARVED"
    BLOCKED = "BLOCKED"
    FAULTED = "FAULTED"
