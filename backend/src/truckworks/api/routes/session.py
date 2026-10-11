from fastapi import APIRouter, HTTPException, Request, Response

from truckworks.api.visitors import COOKIE_NAME, allowed_origin, new_token, valid_token

router = APIRouter(tags=["visitor session"])


@router.post("/session", summary="익명 방문자 공장 연결 준비")
async def prepare_session(request: Request, response: Response) -> dict:
    if not allowed_origin(request):
        raise HTTPException(403, "허용되지 않은 화면 주소입니다.")
    token = request.cookies.get(COOKIE_NAME)
    if not valid_token(token):
        token = new_token()
    visitor = request.app.state.visitors.resolve(token)
    response.set_cookie(COOKIE_NAME, token, httponly=True, samesite="lax", path="/api",
                        secure=request.app.state.settings.session_cookie_secure or request.url.scheme == "https")
    response.headers["Cache-Control"] = "no-store"
    return {"mode": "visitor", "run_id": str(visitor.runner.engine.snapshot.run_id)}
