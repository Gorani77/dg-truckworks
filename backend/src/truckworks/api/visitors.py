"""Anonymous browser ownership; live factories remain process-local."""

import asyncio
import hashlib
import logging
import re
from contextlib import suppress
from dataclasses import dataclass, field
from secrets import token_hex
from time import monotonic

from starlette.requests import HTTPConnection

from truckworks.persistence.writer import HistoryWriter
from truckworks.simulation.runner import SimulationRunner

COOKIE_NAME = "truckworks_visitor"


def valid_token(value: str | None) -> bool:
    return value is not None and re.fullmatch(r"[a-f0-9]{64}", value) is not None


def new_token() -> str:
    return token_hex(32)


def allowed_origin(connection: HTTPConnection) -> bool:
    origin = connection.headers.get("origin")
    if not origin:
        return True  # Non-browser API clients still need the session cookie.
    scheme = "https" if connection.url.scheme in ("https", "wss") else "http"
    same_origin = f"{scheme}://{connection.headers.get('host', '')}"
    return origin == same_origin or origin in connection.app.state.settings.cors_origins


@dataclass
class Visitor:
    owner_id: str
    runner: SimulationRunner
    last_activity: float = field(default_factory=monotonic)
    active_requests: int = 0


class VisitorRegistry:
    def __init__(self, history: HistoryWriter | None, idle_seconds: float = 1800) -> None:
        self.history = history
        self.visitors: dict[str, Visitor] = {}
        self.idle_seconds = idle_seconds
        self._maintenance: asyncio.Task[None] | None = None
        self._retiring: set[asyncio.Task[None]] = set()

    def start(self) -> None:
        self._maintenance = asyncio.create_task(self._collect_idle())

    def resolve(self, token: str) -> Visitor:
        # Only the one-way owner fingerprint is retained in memory/DB, never
        # the bearer cookie. No await separates lookup and factory creation.
        owner_id = hashlib.sha256(token.encode("ascii")).hexdigest()
        visitor = self.visitors.get(owner_id)
        if visitor is None:
            runner = SimulationRunner(self.history, owner_id=owner_id)
            visitor = Visitor(owner_id, runner)
            self.visitors[owner_id] = visitor
            runner.capture_history(force=True)
        visitor.last_activity = monotonic()
        return visitor

    async def _retire(self, visitor: Visitor) -> None:
        try:
            await visitor.runner.close(closed_reason="IDLE_EXPIRED")
        except Exception:
            logging.getLogger(__name__).error("유휴 공장 종료 처리에 실패했습니다.")
        finally:
            task = asyncio.current_task()
            if task is not None:
                self._retiring.discard(task)

    async def _collect_idle(self) -> None:
        while True:
            await asyncio.sleep(30)
            now = monotonic()
            for owner_id, visitor in tuple(self.visitors.items()):
                if visitor.active_requests or now - visitor.last_activity < self.idle_seconds:
                    continue
                # No await between checking leases and removing this engine.
                # A new visit can now create a new run with the same owner;
                # the old run closes independently under its own run UUID.
                del self.visitors[owner_id]
                self._retiring.add(asyncio.create_task(self._retire(visitor)))

    async def close(self) -> None:
        if self._maintenance:
            self._maintenance.cancel()
            with suppress(asyncio.CancelledError):
                await self._maintenance
        await asyncio.gather(*(visitor.runner.close() for visitor in self.visitors.values()),
                             *tuple(self._retiring))
        self.visitors.clear()
