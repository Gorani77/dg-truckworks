from fastapi import APIRouter

from truckworks.api.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="API 서버 응답 확인")
def get_health() -> HealthResponse:
    return HealthResponse()
