"""Coalesce per-run snapshots without dropping their cumulative event stream."""

import asyncio
import logging
from contextlib import suppress
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError

from truckworks.domain.models import FactorySnapshot, ProductionEvent
from truckworks.persistence.repository import HistoryRepository


@dataclass(frozen=True)
class PendingHistory:
    snapshot: FactorySnapshot
    events: tuple[ProductionEvent, ...]
    closed_reason: str | None
    owner_id: str | None


class HistoryWriter:
    def __init__(self, repository: HistoryRepository) -> None:
        self.repository = repository
        self.pending: dict[UUID, PendingHistory] = {}
        self.last_error: str | None = None
        self._wake = asyncio.Event()
        self._task: asyncio.Task[None] | None = None

    def start(self) -> None:
        self._task = asyncio.create_task(self._run())

    def offer(self, snapshot: FactorySnapshot, events: tuple[ProductionEvent, ...],
              closed_reason: str | None = None, *, owner_id: str | None = None) -> None:
        previous = self.pending.get(snapshot.run_id)
        self.pending[snapshot.run_id] = PendingHistory(snapshot, events,
            closed_reason or (previous.closed_reason if previous else None), owner_id)
        self._wake.set()

    async def _run(self) -> None:
        while True:
            await self._wake.wait()
            while self.pending:
                run_id, item = next(iter(self.pending.items()))
                try:
                    await self.repository.save(item.snapshot, item.events, item.closed_reason, owner_id=item.owner_id)
                except (SQLAlchemyError, OSError):
                    self.last_error = "DB 이력을 저장하지 못했습니다. 연결·마이그레이션을 확인하세요. 저장을 재시도합니다."
                    await asyncio.sleep(2)
                    continue
                self.last_error = None
                # New data may arrive while the transaction is awaiting I/O.
                if self.pending.get(run_id) is item:
                    del self.pending[run_id]
            self._wake.clear()

    async def close(self) -> None:
        try:
            async with asyncio.timeout(5):
                while self.pending:
                    await asyncio.sleep(0.05)
        except TimeoutError:
            logging.getLogger(__name__).warning("DB 저장 대기 이력이 남은 상태로 서버를 종료합니다.")
        finally:
            if self._task is not None:
                self._task.cancel()
                with suppress(asyncio.CancelledError):
                    await self._task
