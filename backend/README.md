# TruckWorks 백엔드

유휴 정책 추가: 사용자 선택으로 연결/API 요청 없는 공장을30분 뒤 정리한다. 열린 소켓/처리 중 요청은 유지하고 재방문은 새 실행이며 같은 쿠키의 DB 이력은 보존한다. 기본 TRUCKWORKS_VISITOR_IDLE_SECONDS=1800, 새 migration/의존성 없음. [IDLE_FACTORIES.md](C:/project/truckworks/docs/IDLE_FACTORIES.md)에 직접 확인 순서가 있다. 코드 작성 완료·사용자 확인 대기다.

최신 추가: 사용자 선택에 따라 방문자별 공장·생산/분석 이력 소유권을 연결했다. `POST /api/session` 쿠키 준비 후 HTTP/WS를 사용한다. DB 사용 시 서버 중단 후 `uv run alembic upgrade head`로 **0003_visitor_ownership**을 적용한다. 기존 공유 기록은 삭제하지 않고 소유자 미상으로 방문자 목록에서 제외한다. [VISITOR_SESSIONS.md](C:/project/truckworks/docs/VISITOR_SESSIONS.md) 참고. 코드·문서 작성 완료·사용자 적용/확인 대기다.

최신 추가(2026-10-10): `/api/factory/stream` WebSocket 상태/누적 이벤트·heartbeat와 화면 자동 재연결을 작성했다. `websockets` 의존성이 추가돼 `uv sync` 후 백엔드와 Vite를 재시작한다. [FACTORY_STREAM.md](C:/project/truckworks/docs/FACTORY_STREAM.md)에 사용자 확인 순서가 있다. 코드·문서 작성 완료·사용자 확인 대기이며 아래 초기 단계 설명보다 이 추가 사항을 우선한다.

2026-10-10 현재: PostgreSQL 생산 이력 저장과 실행·부품·이벤트 조회 API까지 작성했다. 현재 응답은 schema6이며 이벤트에 UTC 실제 발생 시각 `occurred_at`을 포함한다. 설치·DB 준비·마이그레이션·새 기능 확인은 사용자 대기다. 먼저 [이력 저장 준비 안내](C:/project/truckworks/docs/HISTORY_STORAGE.md)에 따라 루트 `.env`와 `backend/.env`를 준비하고 Docker DB 실행 → `uv sync` → `uv run alembic upgrade head` → 서버 재시작 순서로 진행한다. 아래 내용은 앞선 개발 단계의 설명도 포함한다.

현재 차체 1개 전체 공정 시작 API `/api/factory/single-part/start`와 이동·검사·적재 엔진도 작성했다. 구간당 이동 1초, 총 26초다. 현재 실행·응답·사용자 확인은 [전체 공정 안내](../docs/SINGLE_PART.md)를 따른다. 기존 ST-01 단독 API는 유지한다.

Python 3.12 이상, uv 기반의 src 패키지 구조다. FastAPI 상태 조회와 ST-01 소재 1개 처리용 SimPy 엔진·시작 명령·이벤트 조회를 작성했다. 프론트엔드 데이터 연결도 작성했으며 사용자 확인 대기다. DB·WebSocket·에이전트는 후속 작업이다.

## 구조

```text
backend/
├─ pyproject.toml
└─ src/truckworks/
   ├─ __init__.py
   ├─ settings.py   # 환경변수와 CORS 설정
   ├─ api/           # HTTP API와 실시간 통신
   ├─ domain/        # 부품·설비·생산 규칙
   ├─ simulation/    # 생산 엔진과 실행 제어
   ├─ agents/        # 분석 흐름과 조회 도구
   └─ persistence/   # DB 저장 처리
```

domain은 공정 정의·불변 상태 모델·초기 상태 생성을, api는 schemas·dependencies·routes·router·app으로 역할을 나눈다. simulation은 단독·1개·20개 엔진과 asyncio runner를 제공한다. persistence는 SQLAlchemy 모델·트랜잭션 저장/조회·비동기 저장 대기를 관리한다. agents는 초기 패키지 상태다.

## 사용자가 직접 설치·확인하는 방법

`C:\project\truckworks\backend`에서 실행한다.

```powershell
& "$env:APPDATA\Python\Scripts\uv.exe" sync
& "$env:APPDATA\Python\Scripts\uv.exe" run uvicorn truckworks.api.app:create_app --factory --reload --host 127.0.0.1 --port 8010
```

uv가 새 의존성을 설치하고 uv.lock을 갱신한 뒤 서버가 시작된다. uv가 PATH에 등록돼 있다면 위 전체 경로 대신 uv 명령을 사용해도 된다. 초기 패키지 설치·import와 이전 상태 조회 API는 사용자 확인 완료이며, 새 단일 설비 기능은 확인 대기다.

브라우저에서 http://127.0.0.1:8010/docs 를 열면 API 문서가, http://127.0.0.1:8010/api/factory/state 에서는 시작 전 READY·소재 20개·공정 5개가 표시되는 것이 기대 결과다. 환경변수 없이 실행 가능하며 선택적 설정 예시는 .env.example에 있다.

새 단일 설비 기능의 시작 본문·처리 완료·중복 시작 거절·이벤트 확인은 [단일 설비 안내](../docs/SINGLE_STATION.md)를 따른다.

차체1개는 [전체 공정 안내](C:/project/truckworks/docs/SINGLE_PART.md), 일시정지·재개·초기화는 [실행 제어 안내](C:/project/truckworks/docs/EXECUTION_CONTROLS.md), 소재20개 FIFO·예약·출력 막힘은 [연속 생산 안내](C:/project/truckworks/docs/BATCH_PRODUCTION.md)를 따른다. 현재 상태 응답은 schema4이며 parts/transfers·생산 번호를 포함한다. 새 기능은 코드 작성 완료·사용자 확인 대기다.

후속 [설비 고장·복구](C:/project/truckworks/docs/STATION_FAULTS.md)를 추가해 현재 응답은 schema5다. POST /api/factory/stations/{station_id}/fault·repair는 expected_run_id로 현재 실행을 확인한다. 다른 설비·이동은 계속 진행하고 고장 설비는 부품·잔여시간을 보존한다. 새 기능 사용자 확인 대기다.

상세 응답 필드·반복 조회·재시작·CORS 확인 절차는 [API 안내](../docs/BACKEND_API.md)를 따른다. Codex는 설치·실행·테스트·빌드·린트·HTTP 검증을 수행하지 않았다.

## 패키지 설정

uv는 의존성과 환경을 관리하고 Hatchling은 src/truckworks를 설치 가능한 패키지로 구성한다. 의존성은 FastAPI·Pydantic·pydantic-settings·Uvicorn·SimPy·SQLAlchemy·psycopg·Alembic이다. DB URL을 설정하지 않아도 새 패키지 설치는 필요하다. 정확한 해석 버전은 사용자의 다음 uv sync에서 잠금 파일에 반영된다. DB URL 미설정 시 이력 저장만 비활성화되며 공장 관제는 계속 사용할 수 있다.

- [uv 빌드 시스템 안내](https://docs.astral.sh/uv/concepts/projects/config/#build-systems)
- [Hatch 패키지 경로 설정](https://hatch.pypa.io/latest/config/build/#packages)

## 읽기 전용 분석 도구 (2026-10-10)

현재 실행의 공장·설비·최근 이벤트·대기/예약·부품 이력 GET 도구를 agents/tools.py와 api/routes/analysis.py에 작성했다. DB 없이 현재 메모리를 읽고 실행·버전·순번·관측 시각을 반환한다. 별도 의존성이나 마이그레이션은 없다. [도구 안내](C:/project/truckworks/docs/ANALYSIS_TOOLS.md)에 사용자 확인 절차를 기록했다. LLM·LangGraph 분석은 아직 연결 전이며 코드 작성 완료·사용자 확인 대기다.

## OpenAI 분석 설정 (2026-10-10)

사용자 OpenAI 선택·비용 우선 모델 선택 위임에 따라 gpt-5.6-luna와 공식 openai SDK·LangGraph 그래프 연결을 작성했다. backend/.env의 TRUCKWORKS_OPENAI_API_KEY·TRUCKWORKS_OPENAI_MODEL을 서버에서만 사용한다. 새 의존성이 있으므로 uv sync 후 서버를 재시작한다. 실제 API 호출과 설치 검증은 수행하지 않았다. [OPENAI_AGENT.md](C:/project/truckworks/docs/OPENAI_AGENT.md)에 사용자 준비·확인 절차와 비용/실패 제한을 기록했다.

## 분석 이력 저장/조회 추가 (2026-10-10)

0002_analysis_history migration과 분석 접수/성공/실패/시간 초과/실행 변경/취소 기록을 추가했다. backend에서 uv run alembic upgrade head 후 서버를 재시작한다. GET /api/analysis/history·/history/{analysis_id}와 저장 상태 필드는 [ANALYSIS_HISTORY.md](C:/project/truckworks/docs/ANALYSIS_HISTORY.md)를 따른다. 실제 적용/호출은 사용자 확인 대기이며 테스트·실행은 수행하지 않았다.
