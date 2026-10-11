from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.exc import SQLAlchemyError

from truckworks.api.schemas.factory import PartResponse, ProductionEventResponse
from truckworks.api.schemas.history import RunHistoryResponse, RunSummaryResponse, StorageStatusResponse
from truckworks.persistence.repository import HistoryRepository
from truckworks.api.dependencies import VisitorDependency

router = APIRouter(prefix="/history", tags=["history"])


async def repository(request: Request, response: Response) -> AsyncIterator[HistoryRepository]:
    response.headers["Cache-Control"] = "no-store"
    repo = request.app.state.history_repository
    if repo is None:
        raise HTTPException(503, "이력 저장이 비활성화돼 있습니다. DB 설정과 실행 안내를 확인하세요.")
    try:
        yield repo
    except (SQLAlchemyError, OSError) as error:
        # Do not expose database URLs, passwords, SQL or driver diagnostics.
        raise HTTPException(503, "DB 이력을 조회하지 못했습니다. 연결·마이그레이션을 확인하세요.") from error


HistoryDependency = Annotated[HistoryRepository, Depends(repository)]


@router.get("/status", response_model=StorageStatusResponse, summary="이력 저장 상태")
async def storage_status(request: Request, response: Response, visitor: VisitorDependency) -> StorageStatusResponse:
    response.headers["Cache-Control"] = "no-store"
    writer = request.app.state.history_writer
    return StorageStatusResponse(enabled=writer is not None,
        pending_runs=sum(item.owner_id == visitor.owner_id for item in writer.pending.values()) if writer else 0,
        error=writer.last_error if writer else None)


@router.get("/runs", response_model=list[RunSummaryResponse], summary="저장된 실행 목록")
async def runs(repo: HistoryDependency, visitor: VisitorDependency, limit: int = Query(20, ge=1, le=100),
               offset: int = Query(0, ge=0)) -> list[dict]:
    return await repo.runs(visitor.owner_id, limit, offset)


@router.get("/runs/{run_id}", response_model=RunHistoryResponse, summary="저장된 마지막 상태")
async def run(run_id: UUID, repo: HistoryDependency, visitor: VisitorDependency) -> dict:
    result = await repo.run(visitor.owner_id, run_id)
    if result is None:
        raise HTTPException(404, "저장된 실행이 없습니다. 저장 대기 상태도 확인하세요.")
    return result


@router.get("/runs/{run_id}/parts", response_model=list[PartResponse], summary="실행의 부품별 마지막 상태")
async def parts(run_id: UUID, repo: HistoryDependency, visitor: VisitorDependency) -> list[dict]:
    if await repo.run(visitor.owner_id, run_id) is None:
        raise HTTPException(404, "저장된 실행이 없습니다.")
    return await repo.parts(visitor.owner_id, run_id)


@router.get("/runs/{run_id}/events", response_model=list[ProductionEventResponse], summary="실행·부품별 이벤트 이력")
async def events(run_id: UUID, repo: HistoryDependency, visitor: VisitorDependency,
                 after_sequence: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
                 part_id: UUID | None = None) -> list[dict]:
    if await repo.run(visitor.owner_id, run_id) is None:
        raise HTTPException(404, "저장된 실행이 없습니다.")
    return await repo.events(visitor.owner_id, run_id, after_sequence, limit, part_id)
