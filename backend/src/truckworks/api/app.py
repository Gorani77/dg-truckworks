"""ASGI app factory. Run with uvicorn's --factory option."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import asyncio

from openai import AsyncOpenAI

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine

from truckworks.api.router import router
from truckworks.api.visitors import VisitorRegistry
from truckworks.settings import Settings
from truckworks.persistence.repository import HistoryRepository
from truckworks.persistence.writer import HistoryWriter
from truckworks.persistence.analysis import AnalysisHistory


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = app.state.settings
    api_key = settings.openai_api_key.get_secret_value().strip() if settings.openai_api_key else ""
    client = AsyncOpenAI(api_key=api_key, base_url="https://api.openai.com/v1", timeout=20, max_retries=0) if api_key else None
    app.state.openai_client = client
    app.state.analysis_lock = asyncio.Lock()
    app.state.analysis_next_allowed = 0.0
    url = settings.database_url.get_secret_value().strip() if settings.database_url else ""
    engine = create_async_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 3}) if url else None
    repository = HistoryRepository(engine) if engine is not None else None
    writer = HistoryWriter(repository) if repository is not None else None
    app.state.history_repository = repository
    analysis_history = AnalysisHistory(repository, (api_key, url)) if repository else None
    app.state.analysis_history = analysis_history
    if analysis_history:
        analysis_history.start()
    app.state.history_writer = writer
    if writer is not None:
        writer.start()
    visitors = VisitorRegistry(writer, settings.visitor_idle_seconds)
    app.state.visitors = visitors
    visitors.start()
    try:
        yield
    finally:
        if client is not None:
            await client.close()
        await visitors.close()
        if analysis_history:
            await analysis_history.close()
        if writer is not None:
            await writer.close()
        if engine is not None:
            await engine.dispose()
        del app.state.visitors


def create_app() -> FastAPI:
    settings = Settings()
    app = FastAPI(
        title="TruckWorks API",
        description="모형 트럭 차체 생산라인의 상태 조회 API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Accept", "Content-Type"],
    )
    app.include_router(router)
    return app
