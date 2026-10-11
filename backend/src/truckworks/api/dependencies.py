"""Application-owned state injected into endpoint handlers."""

from typing import Annotated
from collections.abc import AsyncIterator
from time import monotonic

from fastapi import Depends, HTTPException, WebSocketException
from starlette.requests import HTTPConnection

from truckworks.domain.models import FactorySnapshot
from truckworks.simulation.runner import SimulationRunner
from truckworks.api.visitors import COOKIE_NAME, Visitor, allowed_origin, valid_token


async def get_visitor(connection: HTTPConnection) -> AsyncIterator[Visitor]:
    token = connection.cookies.get(COOKIE_NAME)
    is_websocket = connection.scope["type"] == "websocket"
    if (is_websocket or connection.scope.get("method") not in ("GET", "HEAD")) and not allowed_origin(connection):
        if is_websocket:
            raise WebSocketException(1008, "허용되지 않은 화면 주소입니다.")
        raise HTTPException(403, "허용되지 않은 화면 주소입니다.")
    if not valid_token(token):
        if is_websocket:
            raise WebSocketException(1008, "방문자 세션 준비가 필요합니다.")
        raise HTTPException(401, "방문자 세션 준비가 필요합니다. POST /api/session 후 다시 요청하세요.")
    visitor = connection.app.state.visitors.resolve(token)
    visitor.active_requests += 1
    try:
        yield visitor
    finally:
        visitor.active_requests -= 1
        visitor.last_activity = monotonic()


VisitorDependency = Annotated[Visitor, Depends(get_visitor)]


async def get_simulation_runner(visitor: VisitorDependency) -> SimulationRunner:
    return visitor.runner


SimulationRunnerDependency = Annotated[SimulationRunner, Depends(get_simulation_runner)]


async def get_factory_snapshot(runner: SimulationRunnerDependency) -> FactorySnapshot:
    return runner.engine.snapshot


FactorySnapshotDependency = Annotated[FactorySnapshot, Depends(get_factory_snapshot)]
