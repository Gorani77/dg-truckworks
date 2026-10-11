import asyncio

from fastapi import APIRouter, HTTPException, Response, WebSocket, WebSocketDisconnect

from truckworks.api.dependencies import FactorySnapshotDependency, SimulationRunnerDependency
from truckworks.api.schemas.factory import (
    FactoryStateResponse, ProductionEventResponse, SingleStationStartRequest,
)
from truckworks.simulation.single_station import SimulationConflict

router = APIRouter(prefix="/factory", tags=["factory"])


@router.websocket("/stream")
async def stream_factory(websocket: WebSocket, runner: SimulationRunnerDependency) -> None:
    await websocket.accept()
    queue = runner.subscribe()

    async def send_frames() -> None:
        while True:
            try:
                snapshot, events = await asyncio.wait_for(queue.get(), timeout=5)
                payload = {
                    "type": "factory_state", "protocol_version": 1,
                    "state": FactoryStateResponse.model_validate(snapshot).model_dump(mode="json"),
                    "events": [ProductionEventResponse.model_validate(event).model_dump(mode="json")
                               for event in events
                               if event.run_id == snapshot.run_id
                               and event.sequence <= snapshot.last_event_sequence],
                }
            except TimeoutError:
                payload = {"type": "heartbeat", "protocol_version": 1}
            await websocket.send_json(payload)

    async def wait_for_disconnect() -> None:
        # This stream accepts no production commands. Consume disconnects so
        # subscriptions are released even while the factory is paused.
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                return

    tasks = [asyncio.create_task(send_frames()), asyncio.create_task(wait_for_disconnect())]
    try:
        done, _ = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            task.result()
    except (WebSocketDisconnect, OSError):
        pass
    finally:
        runner.unsubscribe(queue)
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


@router.post("/stations/{station_id}/fault", response_model=FactoryStateResponse,
             summary="선택 설비 수동 고장", responses={409: {"description": "설비·상태·실행 ID 충돌"}})
async def fault_station(station_id: str, command: SingleStationStartRequest,
                        runner: SimulationRunnerDependency, response: Response) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.fault(command.expected_run_id, station_id)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)


@router.post("/stations/{station_id}/repair", response_model=FactoryStateResponse,
             summary="선택 설비 수동 복구", responses={409: {"description": "설비·상태·실행 ID 충돌"}})
async def repair_station(station_id: str, command: SingleStationStartRequest,
                         runner: SimulationRunnerDependency, response: Response) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.repair(command.expected_run_id, station_id)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)


@router.post("/batch/start", response_model=FactoryStateResponse, summary="소재 20개 연속 생산 시작",
             responses={409: {"description": "이미 시작했거나 실행 ID 불일치"}})
async def start_batch(command: SingleStationStartRequest, runner: SimulationRunnerDependency,
                      response: Response) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.start(command.expected_run_id, batch=True)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)


@router.get("/state", response_model=FactoryStateResponse, summary="공장 전체 상태 조회")
async def get_factory_state(
    snapshot: FactorySnapshotDependency,
    response: Response,
) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    return FactoryStateResponse.model_validate(snapshot)


@router.post("/pause", response_model=FactoryStateResponse, summary="가공·이동 일시정지",
             responses={409: {"description": "실행 중이 아니거나 실행 ID 불일치"}})
async def pause_factory(command: SingleStationStartRequest, runner: SimulationRunnerDependency,
                        response: Response) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.pause(command.expected_run_id)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)


@router.post("/resume", response_model=FactoryStateResponse, summary="남은 가공·이동 재개",
             responses={409: {"description": "재개 불가능한 상태이거나 실행 ID 불일치"}})
async def resume_factory(command: SingleStationStartRequest, runner: SimulationRunnerDependency,
                         response: Response) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.resume(command.expected_run_id)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)


@router.post("/reset", response_model=FactoryStateResponse, summary="새 실행 ID로 초기화",
             responses={409: {"description": "실행 ID 불일치"}})
async def reset_factory(command: SingleStationStartRequest, runner: SimulationRunnerDependency,
                        response: Response) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.reset(command.expected_run_id)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)


@router.post(
    "/single-station/start", response_model=FactoryStateResponse,
    summary="소재 투입 설비에서 차체 1개 처리 시작",
    responses={409: {"description": "이미 시작했거나 실행 ID 불일치"}},
)
async def start_single_station(
    command: SingleStationStartRequest,
    runner: SimulationRunnerDependency,
    response: Response,
) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.start(command.expected_run_id)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)


@router.get("/events", response_model=tuple[ProductionEventResponse, ...], summary="현재 실행 이벤트 조회")
async def get_factory_events(
    runner: SimulationRunnerDependency,
    response: Response,
) -> tuple[ProductionEventResponse, ...]:
    response.headers["Cache-Control"] = "no-store"
    return tuple(ProductionEventResponse.model_validate(event) for event in runner.engine.events)


@router.post("/single-part/start", response_model=FactoryStateResponse,
    summary="차체 1개 전체 공정 시작 (26초)",
    responses={409: {"description": "이미 시작했거나 실행 ID 불일치"}})
async def start_single_part(
    command: SingleStationStartRequest,
    runner: SimulationRunnerDependency,
    response: Response,
) -> FactoryStateResponse:
    response.headers["Cache-Control"] = "no-store"
    try:
        snapshot = runner.start(command.expected_run_id, full_line=True)
    except SimulationConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return FactoryStateResponse.model_validate(snapshot)
