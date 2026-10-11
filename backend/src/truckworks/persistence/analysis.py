"""Sanitized analysis history, asynchronous writes, no provider error bodies."""

import asyncio
import copy
import logging
import re
from contextlib import suppress
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError

from truckworks.persistence.models import AnalysisRecord
from truckworks.persistence.repository import HistoryRepository


def redact(value: object, secrets: tuple[str, ...]) -> object:
    if isinstance(value, str):
        for secret in secrets:
            if secret:
                value = value.replace(secret, "[REDACTED]")
        value = re.sub(r"sk-[A-Za-z0-9_-]{12,}", "[REDACTED]", value)
        value = re.sub(r"(?i)Bearer\s+\S+", "Bearer [REDACTED]", value)
        value = re.sub(r"(?i)(truckworks_visitor\s*=\s*)[a-f0-9]{64}", r"\1[REDACTED]", value)
        value = re.sub(r"(?i)((?:api[_-]?key|password|secret|access[_-]?token)\s*[:=]\s*)[^\s,;]+",
                       r"\1[REDACTED]", value)
        value = re.sub(r"(?i)(?:postgres(?:ql)?(?:\+psycopg)?|https?)://[^\s/@]+:[^\s/@]+@",
                       "[REDACTED]@", value)
        return value
    if isinstance(value, dict):
        return {key: "[REDACTED]" if re.search(r"(?i)(api.?key|password|secret|authorization|access.?token)", key)
                else redact(item, secrets) for key, item in value.items()}
    if isinstance(value, list):
        return [redact(item, secrets) for item in value]
    return value


class AnalysisHistory:
    def __init__(self, repository: HistoryRepository, secrets: tuple[str, ...]) -> None:
        self.sessions = repository.sessions
        self.secrets = secrets
        self.pending: dict[UUID, dict] = {}
        self.last_error: str | None = None
        self.wake = asyncio.Event()
        self.task: asyncio.Task | None = None

    def start(self) -> None:
        self.task = asyncio.create_task(self._write())

    def offer(self, data: dict) -> None:
        safe = redact(copy.deepcopy(data), self.secrets)
        self.pending[UUID(safe["analysis_id"])] = safe
        self.wake.set()

    async def _write(self) -> None:
        while True:
            await self.wake.wait()
            while self.pending:
                analysis_id, data = next(iter(self.pending.items()))
                try:
                    async with self.sessions.begin() as session:
                        statement = insert(AnalysisRecord).values(analysis_id=analysis_id,
                            owner_id=data["owner_id"], run_id=UUID(data["run_id"]), created_at=datetime.fromisoformat(data["created_at"]),
                            status=data["status"], revision=data["revision"], data=data)
                        await session.execute(statement.on_conflict_do_update(
                            index_elements=[AnalysisRecord.analysis_id],
                            set_={"status": statement.excluded.status, "revision": statement.excluded.revision,
                                  "data": statement.excluded.data},
                            where=(AnalysisRecord.revision <= statement.excluded.revision)
                                  & (AnalysisRecord.owner_id == statement.excluded.owner_id)))
                except (SQLAlchemyError, OSError):
                    self.last_error = "분석 이력을 저장하지 못했습니다. DB 연결·마이그레이션을 확인하세요. 재시도합니다."
                    await asyncio.sleep(2)
                    continue
                self.last_error = None
                if self.pending.get(analysis_id) is data:
                    del self.pending[analysis_id]
            self.wake.clear()

    async def list(self, owner_id: str, run_id: UUID | None, limit: int, offset: int) -> list[dict]:
        statement = select(AnalysisRecord).where(AnalysisRecord.owner_id == owner_id).order_by(
            AnalysisRecord.created_at.desc(), AnalysisRecord.analysis_id.desc())
        if run_id is not None:
            statement = statement.where(AnalysisRecord.run_id == run_id)
        async with self.sessions() as session:
            rows = (await session.scalars(statement.limit(limit).offset(offset))).all()
            fields = ("analysis_id", "run_id", "created_at", "finished_at", "status", "question", "model",
                      "state_version", "usage", "error", "elapsed_seconds")
            return [{key: row.data.get(key) for key in fields} for row in rows]

    async def detail(self, owner_id: str, analysis_id: UUID) -> dict | None:
        async with self.sessions() as session:
            row = await session.get(AnalysisRecord, analysis_id)
            if row is None or row.owner_id != owner_id:
                return None
            return {key: value for key, value in row.data.items() if key != "owner_id"}

    async def close(self) -> None:
        try:
            async with asyncio.timeout(5):
                while self.pending:
                    await asyncio.sleep(0.05)
        except TimeoutError:
            logging.getLogger(__name__).warning("분석 이력 저장 대기가 남은 상태로 종료합니다.")
        finally:
            if self.task:
                self.task.cancel()
                with suppress(asyncio.CancelledError):
                    await self.task
