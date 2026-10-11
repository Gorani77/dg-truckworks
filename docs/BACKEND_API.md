# 백엔드 초기 상태 조회 API

유휴 정책 추가: 연결/요청 없는 공장은30분 후 다음30초 검사에서 종료한다. 사용 중 HTTP/WS는 유지하며 재방문 요청은 같은 쿠키 소유권의 새 실행을 받는다. 유휴 종료 뒤 이전 expected_run_id의 명령은409다. [IDLE_FACTORIES.md](C:/project/truckworks/docs/IDLE_FACTORIES.md) 참고. 사용자 확인 대기다.

최신 추가: 사용자 선택으로 방문자별 runner와 이력 소유권을 연결했다. health 외 공장/분석/이력 API와 WS는 먼저 POST /api/session으로 준비한 쿠키를 사용한다. 세션 없는 HTTP401·다른 방문자 이력 상세404·다른 실행 제어409다. [VISITOR_SESSIONS.md](C:/project/truckworks/docs/VISITOR_SESSIONS.md)에 Swagger/PowerShell 준비와 0003 migration 절차가 있다. 기존 공유 상태 설명보다 이 범위를 우선하며 사용자 적용/확인 대기다.

2026-10-10 추가: `WS /api/factory/stream`에서 protocol_version=1의 전체 상태+누적 이벤트와 5초 heartbeat를 보낸다. HTTP GET/제어 POST는 유지한다. Swagger HTTP 목록 대신 [FACTORY_STREAM.md](C:/project/truckworks/docs/FACTORY_STREAM.md)의 브라우저 WS 절차를 따른다. 사용자 설치/실행 확인 대기다.

> 현재 응답은 schema_version6·model_version chassis-line-v2다. schema5의 status_before_fault·nullable part_id에 이어 이벤트 UTC 실제 발생 시각 occurred_at을 추가했다. PostgreSQL 저장·별도 이력 조회 API는 [이력 저장 안내](C:/project/truckworks/docs/HISTORY_STORAGE.md)를 따른다. [차체1개](C:/project/truckworks/docs/SINGLE_PART.md), [실행 제어](C:/project/truckworks/docs/EXECUTION_CONTROLS.md), [20개 생산](C:/project/truckworks/docs/BATCH_PRODUCTION.md), [설비 고장·복구](C:/project/truckworks/docs/STATION_FAULTS.md)를 참고한다. 아래 초기 API 작성 시점의 설명은 후속 구현과 구분한다.

작성일: 2026-10-08 (Asia/Seoul)
상태: 초기 조회는 사용자 확인 완료. 단일 설비 기능 추가 후 사용자 확인 대기.

## 구현 범위

- FastAPI 앱 팩토리와 lifespan에서 관리하는 초기 공장 스냅샷.
- 공정 정의와 생산 설정, 상태 enum, 불변 dataclass 도메인 모델.
- Pydantic 응답 형식, GET 상태 조회, GET 서버 응답 확인.
- 환경변수와 로컬 프론트엔드 주소에 대한 CORS 설정.

2026-10-08 ST-01 소재 1개 처리용 SimPy 엔진, 시작 명령, 이벤트 조회를 추가했다. 사용법과 상태 전이는 [SINGLE_STATION.md](SINGLE_STATION.md)를 따른다. 아래 초기값 설명은 시작 명령 이전의 상태다. 화면 데이터 연결도 후속 작업에서 작성했으며 사용자 확인 대기다. WebSocket·DB·전체 생산라인은 아직 구현하지 않았다.

## 사용자 설치·실행

`C:\project\truckworks\backend`에서 실행한다. 현재 터미널에서는 uv의 전체 경로를 사용한다.

```powershell
& "$env:APPDATA\Python\Scripts\uv.exe" sync
& "$env:APPDATA\Python\Scripts\uv.exe" run uvicorn truckworks.api.app:create_app --factory --reload --host 127.0.0.1 --port 8010
```

첫 명령은 새로 선언한 FastAPI·Pydantic·pydantic-settings·Uvicorn을 설치하고 기존 uv.lock을 갱신한다. Codex는 설치나 잠금 파일 갱신을 실행하지 않았다. 두 번째 명령 후 서버 시작 완료 로그가 기대 결과다. 종료는 Ctrl+C다.

환경변수 없이 기본 설정으로 시작할 수 있다. 필요하면 backend/.env.example을 같은 폴더의 .env로 복사해 수정한다. .env는 backend를 작업 디렉터리로 실행할 때 읽는다.

## 주소와 응답

| 주소 | 기능 | 기대 결과 |
|---|---|---|
| http://127.0.0.1:8010/docs | API 문서 | 상태·health·이벤트 GET과 단일 설비 시작 POST 표시 |
| http://127.0.0.1:8010/api/health | 서버 응답 확인 | 200, {"status":"ok","service":"truckworks"} |
| http://127.0.0.1:8010/api/factory/state | 전체 공장 상태 | 200, 아래 초기 상태 (시작 명령 전) |

health는 HTTP API의 응답만 나타내며 DB·LLM·생산 엔진의 정상 동작을 의미하지 않는다.

### 상태 필드

| 필드 | 의미 / 초기값 |
|---|---|
| schema_version | 응답 형식 버전, "1" |
| model_version | 생산 모델 버전, "chassis-line-v1" |
| line_id | "LINE-01" |
| run_id | 서버 시작 시 만든 UUID |
| run_status | "READY" |
| created_at | 실행 생성 시점, UTC |
| state_version | 상태 버전, 0 |
| last_event_sequence | 마지막 이벤트 순서, 0. 시작 전에는 이벤트가 없음 |
| simulation_time_seconds | 시뮬레이션 시간, 0 |
| configuration | 소재 20개·불량 확률 0.05·시드 42·각 보관 용량 20개·차체 치수 180×60×12 mm |
| material_remaining | 아직 투입되지 않은 소재, 20 |
| counts | good_count·rejected_count·in_process_count·waiting_count 모두 0 |
| stations | ST-01부터 ST-05까지 공정 순서로 5개 |

각 stations 항목은 다음을 포함한다.

- definition: id·name·process_seconds·capacity·input_buffer_capacity·description·input·output.
- status: "IDLE".
- current_part_id: null.
- queued_part_ids: 빈 배열.
- remaining_process_seconds: 0.

공정별 process_seconds는 2·8·6·4·2, capacity는 모두 1, input_buffer_capacity는 모두 3이다. 검사 확률·시드는 모델 설정만 노출하며 아직 검사나 난수 결과를 생성하지 않는다. 대기 수량은 입력 대기 중인 부품 수이고 미투입 소재 20개를 포함하지 않는다.

## 사용자 확인 순서

1. 두 GET API가 200으로 응답하는지 확인한다.
2. 상태 필드·설비 수·처리시간·소재 수량이 위와 일치하는지 확인한다.
3. 시작 명령 전에 상태 API를 반복 요청해 run_id·created_at·state_version과 수량이 유지되는지 확인한다. 조회가 생산을 진행하거나 새 실행을 만들지 않아야 한다.
4. 서버를 완전히 재시작하면 run_id와 created_at이 바뀌고 초기 상태로 돌아오는지 확인한다. --reload 모드에서 소스 수정으로 프로세스가 재시작돼도 새 실행이 생성된다.
5. 원하면 CORS를 아래 명령으로 확인한다.

```powershell
$apiResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8010/api/factory/state' -Headers @{ Origin = 'http://localhost:5173' }
$apiResponse.Headers['Access-Control-Allow-Origin']
```

기대 결과: http://localhost:5173. 프론트엔드가 다른 포트에서 실행되면 TRUCKWORKS_CORS_ORIGINS를 JSON 배열로 설정하고 서버를 재시작한다. 프론트엔드 개발 서버는 /api를 8010 백엔드로 프록시한다. 화면 상태·시작·이벤트 확인은 FACTORY_CONNECTION.md를 따른다.

## 구조와 수명

- settings.py: API 설정만 관리한다. 공정 수치를 서버 설정과 섞지 않는다.
- domain/: 프레임워크 없이 정의·스냅샷·초기 상태 생성을 담당한다.
- api/schemas/: HTTP 응답 형식을 정의하고 도메인 객체를 검증·직렬화한다.
- api/dependencies.py: 앱이 소유한 runner와 엔진의 현재 스냅샷을 요청에 주입한다.
- api/routes/: 엔드포인트, api/router.py: 경로 조합, api/app.py: 앱 생성과 수명 관리.

초기 개발의 단일 활성 실행을 서버 프로세스 메모리에 보관한다. 시작 명령 전에는 상태가 변하지 않는다. 시작 후 단일 설비 runner가 상태를 갱신한다. 여러 worker를 실행하면 서로 다른 실행이 되므로 안내 명령은 단일 worker를 사용한다. 영속화와 방문자별 분리는 계획된 후속 작업이다.

## 참고한 공식 문서

- [FastAPI lifespan](https://fastapi.tiangolo.com/advanced/events/)
- [FastAPI 응답 모델](https://fastapi.tiangolo.com/tutorial/response-model/)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)

Codex는 테스트·빌드·린트·설치·서버 실행·HTTP 요청 검증을 수행하지 않았다.

## 후속 현재 실행 분석 도구 (2026-10-10)

GET /api/analysis/tools/{tool_name}에서 공장·설비·최근 이벤트·대기/예약·부품 이력을 읽는다. expected_run_id가 필수이며 각 결과에 관측 시각·실행·상태 버전·마지막 순번을 제공한다. 현재 메모리 조회이므로 DB 저장 성공과 별개다. 생산 명령이나 자연어 분석 기능은 포함하지 않는다. 입력·오류·사용자 절차는 [ANALYSIS_TOOLS.md](C:/project/truckworks/docs/ANALYSIS_TOOLS.md)를 따른다. 코드 작성 완료·사용자 확인 대기다.

## OpenAI 자연어 분석 (2026-10-10)

GET /api/analysis/status는 설정 상태만, POST /api/analysis/questions는 현재 실행의 자연어 질문 분석을 제공한다. 사용자 위임으로 gpt-5.6-luna를 선택했다. 모델 함수 호출과 LangGraph를 연결했으며 실제 호출·설치·답변 품질은 사용자 확인 대기다. 질문·응답·제한·오류 코드는 [OPENAI_AGENT.md](C:/project/truckworks/docs/OPENAI_AGENT.md)를 따른다. 키는 서버 로컬 환경변수에만 둔다. 기존 수동 도구 GET은 OpenAI를 호출하지 않는다.

## 분석 이력 API (2026-10-10)

GET /api/analysis/status에 history_enabled·history_pending·history_error를 추가했다. GET /api/analysis/history는 선택적 run_id·limit기본20/최대100·offset, GET /api/analysis/history/{analysis_id}는 과거 전체 관측/도구/답변·확인된 사용량을 제공한다. DB 미설정/오류503·없는 기록404·입력 오류422다. 접수한 질문 응답은 X-Analysis-ID와 저장 설정 시 X-Analysis-History=queued를 제공하며 큐 제출과 커밋을 구분한다. ANALYSIS_HISTORY.md 참고. 코드 작성 완료·사용자 적용/확인 대기다.
