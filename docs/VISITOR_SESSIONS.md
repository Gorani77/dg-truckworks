# 방문자별 공장과 이력 분리

2026-10-10 (Asia/Seoul). 사용자 선택: 공유 공장 대신 방문자별 공장 분리. 코드·세 번째 마이그레이션·문서 작성 완료, 사용자 적용/실행 확인 대기다. 테스트·빌드·린트·설치·DB 변경·서버 실행·HTTP·브라우저 검증·유료 모델 호출은 수행하지 않았다.

## 현재 동작 설계

화면이 처음 열리면 `POST /api/session`을 준비하고 같은 방문자의 생산 엔진을 선택한다. 서버가 발급한 256비트 임의 토큰을 `truckworks_visitor` HttpOnly·SameSite=Lax·Path=/api 쿠키로 전달한다. React나 응답 JSON에 토큰을 넣지 않으며 URL에도 전달하지 않는다. 현재 로컬 HTTP에서는 Secure=false, HTTPS 요청 또는 `TRUCKWORKS_SESSION_COOKIE_SECURE=true`에서는 Secure=true다. 공개 HTTPS에서는 해당 설정과 실제 화면 origin 설정을 맞춘다.

서버는 토큰의 SHA-256 소유자 지문으로 VisitorRegistry에서 runner를 찾는다. 새 방문자는 독립된 READY·소재20개 공장을 받는다. 기존 run_id는 실행 충돌 방지용이고 방문자 식별자와 다르다. 초기화는 실행 ID만 바꾸며 방문자와 과거 이력 소유권은 유지한다. GET/POST/읽기 도구·질문 분석·WebSocket이 같은 방문자 runner를 사용한다.

같은 브라우저 프로필의 같은 호스트 쿠키를 공유하는 탭은 같은 공장을 본다. 일반 창과 별도의 시크릿 창, 다른 브라우저 프로필은 다른 공장이다. 서로 다른 시크릿 창이 같은 시크릿 세션을 공유할 수 있으므로 독립 방문자 확인에는 일반 창+시크릿 창 또는 다른 브라우저를 사용한다. localhost와 127.0.0.1도 서로 다른 쿠키 호스트이므로 평소에는 한 주소를 일관되게 사용한다.

프론트엔드는 세션 준비 Promise를 공유하고, Web Locks가 있으면 같은 origin의 여러 탭에서 최초 쿠키 준비를 직렬화한다. 미지원 환경에서는 탭 내부 준비 공유만 적용되므로 첫 방문을 여러 탭에서 동시에 시작하는 경우 새로고침으로 쿠키 기준을 맞춰야 할 수 있다. WebSocket 연결 전에 준비를 기다리고, 끊김 후 재접속 전 세션을 다시 준비한다. 실패한 생산/분석 POST를 자동 재전송하지 않는다.

## 이력의 소유권

- `0003_visitor_ownership`이 production_runs·analysis_attempts에 nullable owner_id와 인덱스를 추가한다. 원문 쿠키가 아닌 지문만 저장한다. 부품/이벤트는 부모 실행 소유자로 조회 범위를 제한한다.
- 생산 목록·상세·부품·이벤트와 분석 목록·상세에 소유자 조건을 적용한다. 다른 방문자 ID를 알더라도 상세는 404다. 현재 공장 명령에 다른 실행 ID를 넣으면 기존 409다.
- 저장 대기 건수도 내 소유자 기준으로 계산한다. DB 오류 안내와 분석 실행 잠금/10초 간격은 기존 서버 공통 장치를 유지한다. 공장 분리가 분석 동시성 확대를 뜻하지 않는다.
- 기존 공유 공장 기록은 owner_id=NULL로 DB에 보존한다. 소유자를 추측해 배정하지 않으며 방문자 화면에는 나오지 않는다. 기록 삭제·이전 기록의 임의 소유권 변경은 하지 않는다.
- 서버 재시작 시 진행 엔진은 새 실행으로 시작한다. 쿠키가 유지돼 있으면 같은 지문의 저장된 과거 이력은 다시 조회한다. DB 과거 상태로 생산을 재개하는 기능은 없다.
- 쿠키가 사라지면 새 방문자가 된다. 이전 기록은 DB에 남지만 새 쿠키로 접근할 수 없다. 계정 로그인·기기 간 이력 이동·분실 세션 복구는 구현하지 않았다.

새 일일 횟수·지출·접근 횟수 제한은 추가하지 않았다. 쿠키는 각자의 공장과 이력을 구분하기 위한 익명 소유권이다. 후속 사용자 선택으로 연결/요청 없는 공장을30분 뒤 정리하도록 작성했다. 열린 소켓/처리 중인 요청은 유지하고 재방문은 새 실행이며 같은 쿠키의 DB 이력은 남는다. [IDLE_FACTORIES.md](C:/project/truckworks/docs/IDLE_FACTORIES.md)에 자세한 정책과 사용자 확인 순서가 있다. 다중 worker/서버 간 공유는 없으며 기존 단일 worker 구성을 사용한다.

## 사용자가 직접 적용·확인하는 순서

1. DB 사용 중이면 기존 백엔드를 중단하고 `C:\project\truckworks\backend`에서 `uv run alembic upgrade head`로 세 번째 migration을 적용한다. 아직 DB를 준비하지 않았다면 기존 HISTORY_STORAGE.md 준비 절차 뒤 실행한다. 이번 작업 자체에는 새 의존성이 없지만 이전 WebSocket/OpenAI 의존성을 설치하지 않았다면 먼저 `uv sync`가 필요하다.
2. 기존 명령으로 백엔드와 프론트엔드를 시작하고 화면을 새로고침한다. 로그인 입력 없이 `내 공장 · 생산 관제`가 보이고 Network에서 POST /api/session 후 WebSocket 상태를 받아야 한다. health는 세션 준비 없이 계속 조회 가능하다.
3. 일반 창 A와 시크릿 창 B에서 같은 프론트엔드 주소를 연다. 처음부터 run_id가 달라야 한다. A에서 20개 생산을 시작해도 B는 READY·소재20개여야 한다.
4. A의 고장·정지·재개·초기화가 B의 상태/이벤트/실행 ID를 바꾸면 안 된다. B에서도 별도로 생산을 시작한다. 각자의 이동·수량·이벤트가 각자의 실행과 맞아야 한다.
5. A 브라우저에서 새 탭을 열면 A와 같은 실행이어야 한다. A의 새로고침/WS 재연결도 서버가 살아 있다면 같은 실행을 받아야 한다.
6. DB 사용 시 A/B 각각 생산/초기화 뒤 이력 새로고침을 한다. 내 실행만 목록에 나와야 한다. 분석 이력도 실제 질문을 직접 요청한 방문자에게만 표시돼야 한다. 실제 모델 요청은 비용이 발생하며 원치 않으면 읽기 도구 조회만 확인해도 된다.
7. A의 저장 run_id·analysis_id를 B의 API 상세 URL에 대입하면 404여야 한다. 생산 부품/이벤트 상세도 404다. A의 run_id를 B의 제어 expected_run_id로 넣으면 409여야 한다. 식별자 값은 비밀키/쿠키와 다르다. 쿠키 원문을 복사하거나 공유하지 않는다.
8. 서버 재시작 뒤 각자 새 실행을 받되 같은 쿠키의 DB 이력은 유지돼야 한다. 이전 공유 공장 기록은 사라진 것이 아니라 방문자 목록에서 제외된 것이다.
9. 세션 없이 상태 API를 호출하면 401이다. Swagger에서는 먼저 POST /api/session을 실행한 뒤 상태/제어 API를 사용한다. PowerShell은 아래처럼 WebRequestSession을 재사용한다.

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8010/api/session -SessionVariable truckworksSession
Invoke-RestMethod -Uri http://127.0.0.1:8010/api/factory/state -WebSession $truckworksSession
```

쿠키 속성은 브라우저에서 HttpOnly·SameSite·Path만 확인하고 원문 토큰을 로그/스크린샷에 남기지 않는다. 공개 시 프록시가 쿠키·WebSocket 업그레이드와 올바른 HTTPS 정보를 전달해야 한다. 허용하지 않은 Origin의 생산 POST/WS는 거절하도록 작성했다.

구현 참고: [FastAPI 쿠키 응답](https://fastapi.tiangolo.com/advanced/response-cookies/), [FastAPI WebSocket 의존성](https://fastapi.tiangolo.com/advanced/websockets/), [Web Locks 명세](https://w3c.github.io/web-locks/).
