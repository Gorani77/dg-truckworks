import asyncio
import logging
from datetime import UTC, datetime
from time import monotonic
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query, Request, Response
from openai import APIConnectionError, APIStatusError, APITimeoutError
from sqlalchemy.exc import SQLAlchemyError

from truckworks.agents.tools import ReadContext, ToolInput, ToolName, ToolNotFound, ToolResult, execute_tool
from truckworks.api.dependencies import SimulationRunnerDependency, VisitorDependency
from truckworks.agents.workflow import AnalysisFailure, AnalysisQuestion, AnalysisResult, ToolTrace, analyze
from truckworks.agents.usage import UsageLedger

router = APIRouter(prefix="/analysis", tags=["analysis tools"])
logger = logging.getLogger(__name__)


@router.get("/status", summary="분석 설정 상태 (모델 연결 확인 아님)")
async def analysis_status(request: Request, response: Response, visitor: VisitorDependency) -> dict:
    response.headers["Cache-Control"] = "no-store"
    return dict(enabled=request.app.state.openai_client is not None,
                model=request.app.state.settings.openai_model,
                busy=request.app.state.analysis_lock.locked(),
                history_enabled=request.app.state.analysis_history is not None,
                history_pending=sum(item.get("owner_id") == visitor.owner_id
                    for item in request.app.state.analysis_history.pending.values()) if request.app.state.analysis_history else 0,
                history_error=request.app.state.analysis_history.last_error if request.app.state.analysis_history else None)


@router.get("/history", summary="저장된 분석 목록 (과거 관측)")
async def analysis_history_list(request: Request, response: Response, visitor: VisitorDependency,
                                run_id: UUID | None = None, limit: int = Query(20, ge=1, le=100),
                                offset: int = Query(0, ge=0)) -> list[dict]:
    response.headers["Cache-Control"] = "no-store"
    history = request.app.state.analysis_history
    if history is None:
        raise HTTPException(503, "분석 이력 저장이 비활성화돼 있습니다. DB 설정을 확인하세요.")
    try:
        return await history.list(visitor.owner_id, run_id, limit, offset)
    except (SQLAlchemyError, OSError) as error:
        raise HTTPException(503, "분석 이력을 읽지 못했습니다. DB 연결·마이그레이션을 확인하세요.") from error


@router.get("/history/{analysis_id}", summary="저장된 분석 상세와 확인된 사용량")
async def analysis_history_detail(analysis_id: UUID, request: Request, response: Response,
                                  visitor: VisitorDependency) -> dict:
    response.headers["Cache-Control"] = "no-store"
    history = request.app.state.analysis_history
    if history is None:
        raise HTTPException(503, "분석 이력 저장이 비활성화돼 있습니다. DB 설정을 확인하세요.")
    try:
        result = await history.detail(visitor.owner_id, analysis_id)
    except (SQLAlchemyError, OSError) as error:
        raise HTTPException(503, "분석 이력을 읽지 못했습니다. DB 연결·마이그레이션을 확인하세요.") from error
    if result is None:
        raise HTTPException(404, "저장된 분석이 없습니다. 저장 대기 상태도 확인하세요.")
    return result


@router.post("/questions", response_model=AnalysisResult, summary="현재 실행 읽기 전용 자연어 분석")
async def question(command: AnalysisQuestion, request: Request, response: Response,
                   runner: SimulationRunnerDependency, visitor: VisitorDependency) -> AnalysisResult:
    response.headers["Cache-Control"] = "no-store"
    if not command.question.strip():
        raise HTTPException(422, "질문을 입력하세요.")
    client = request.app.state.openai_client
    if client is None:
        raise HTTPException(503, "서버 OpenAI API 키가 설정되지 않았습니다.")
    if command.expected_run_id != runner.engine.snapshot.run_id:
        raise HTTPException(409, "실행이 바뀌었습니다. 현재 상태를 다시 조회하세요.")
    if command.station_id is not None and not any(
        item.definition.id == command.station_id for item in runner.engine.snapshot.stations):
        raise HTTPException(404, "선택한 설비가 없습니다.")
    lock = request.app.state.analysis_lock
    if lock.locked() or monotonic() < request.app.state.analysis_next_allowed:
        raise HTTPException(429, "다른 분석이 진행 중이거나 요청 간격이 짧습니다. 잠시 후 다시 요청하세요.")
    async with lock:
        request.app.state.analysis_next_allowed = monotonic() + 10
        context = ReadContext(runner.engine.snapshot, runner.engine.events)
        analysis_id = uuid4()
        started = monotonic()
        ledger = UsageLedger()
        traces: list[ToolTrace] = []
        history = request.app.state.analysis_history
        model = request.app.state.settings.openai_model
        record = dict(analysis_id=str(analysis_id), owner_id=visitor.owner_id, run_id=str(context.snapshot.run_id),
            created_at=datetime.now(UTC).isoformat(), finished_at=None, status="RUNNING", revision=0,
            question=command.question.strip(), model=model, state_version=context.snapshot.state_version,
            last_event_sequence=context.snapshot.last_event_sequence,
            simulation_time_seconds=context.snapshot.simulation_time_seconds,
            selected_station_id=command.station_id, usage={**ledger.summary(model), "usage_complete": False}, error=None,
            result=None, tools=[], elapsed_seconds=0.0)
        if history:
            history.offer(record)
        result = None
        status = "FAILED"
        safe_error = "분석을 완료하지 못했습니다."
        try:
            try:
                async with asyncio.timeout(35):
                    result = await analyze(client, model, command, context, analysis_id, ledger, traces)
            except (TimeoutError, APITimeoutError) as error:
                raise HTTPException(504, "분석 시간이 초과됐습니다. 질문을 줄여 다시 요청하세요. 비용은 발생했을 수 있습니다.") from error
            except APIConnectionError as error:
                raise HTTPException(502, "OpenAI에 연결하지 못했습니다. 네트워크를 확인하고 다시 요청하세요.") from error
            except APIStatusError as error:
                if error.status_code in (401, 403):
                    message = "서버 OpenAI 키·프로젝트·모델 접근 권한을 확인하세요."
                elif error.status_code == 429:
                    message = "OpenAI 사용 한도 또는 결제 상태를 확인한 뒤 다시 요청하세요."
                else:
                    message = "OpenAI 요청이 실패했습니다. 모델 설정을 확인하고 다시 요청하세요."
                raise HTTPException(502, message) from error
            except AnalysisFailure as error:
                raise HTTPException(502, str(error)) from error
            if runner.engine.snapshot.run_id != context.snapshot.run_id:
                raise HTTPException(409, "분석 중 실행이 초기화됐습니다. 새 실행을 다시 조회하세요. API 비용은 발생했을 수 있습니다.")
            status = "SUCCEEDED"
            safe_error = None
            response.headers["X-Analysis-ID"] = str(analysis_id)
            response.headers["X-Analysis-History"] = "queued" if history else "disabled"
            return result
        except HTTPException as error:
            status = "STALE" if error.status_code == 409 else "TIMED_OUT" if error.status_code == 504 else "FAILED"
            safe_error = str(error.detail)
            error.headers = {**(error.headers or {}), "X-Analysis-ID": str(analysis_id),
                             "X-Analysis-History": "queued" if history else "disabled"}
            raise
        except asyncio.CancelledError:
            status = "CANCELLED"
            safe_error = "서버 분석 작업이 취소됐습니다. 원격 사용량은 모두 확인하지 못했을 수 있습니다."
            raise
        except Exception as error:
            safe_error = "분석 처리 중 오류가 발생했습니다. 다시 요청하세요."
            raise HTTPException(502, safe_error, headers={"X-Analysis-ID": str(analysis_id),
                "X-Analysis-History": "queued" if history else "disabled"}) from error
        finally:
            record.update(status=status, revision=1, finished_at=datetime.now(UTC).isoformat(),
                usage=ledger.summary(model), error=safe_error, elapsed_seconds=monotonic() - started,
                result=result.model_dump(mode="json") if result else None,
                tools=[trace.model_dump(mode="json") for trace in traces])
            if history:
                history.offer(record)
            logger.info("analysis id=%s model=%s run=%s status=%s calls=%s reported=%s inputs=%s outputs=%s",
                analysis_id, model, context.snapshot.run_id, status, ledger.model_calls,
                ledger.reported_calls, ledger.input_tokens, ledger.output_tokens)


@router.get("/tools/{tool_name}", response_model=ToolResult, summary="읽기 전용 현재 실행 조회 도구")
async def read_tool(tool_name: ToolName, expected_run_id: UUID,
                    runner: SimulationRunnerDependency, response: Response,
                    station_id: str | None = Query(None, min_length=1, max_length=64),
                    part_id: UUID | None = None, limit: int = Query(20, ge=1, le=100)) -> ToolResult:
    response.headers["Cache-Control"] = "no-store"
    # No await between snapshot and events: reset or timer cannot interleave.
    context = ReadContext(runner.engine.snapshot, runner.engine.events)
    inputs = ToolInput(expected_run_id=expected_run_id, station_id=station_id, part_id=part_id, limit=limit)
    try:
        return execute_tool(tool_name, inputs, context)
    except ToolNotFound as error:
        raise HTTPException(404, str(error)) from error
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    except RuntimeError as error:
        raise HTTPException(409, str(error)) from error
