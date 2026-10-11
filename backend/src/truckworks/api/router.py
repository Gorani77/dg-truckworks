from fastapi import APIRouter

from truckworks.api.routes import analysis, factory, health, history, session

router = APIRouter(prefix="/api")
router.include_router(health.router)
router.include_router(session.router)
router.include_router(factory.router)
router.include_router(history.router)
router.include_router(analysis.router)
