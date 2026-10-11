# 단일 설비 · 차체 1개 처리

> 이 문서는 유지되는 ST-01 단독 API 안내다. 현재 화면의 시작 버튼은 후속 구현인 [차체 1개 전체 공정](SINGLE_PART.md)을 호출한다. 각 서버 실행에서는 하나의 시나리오만 시작할 수 있다.

작성일: 2026-10-08 (Asia/Seoul)  
상태: 백엔드 코드 작성 완료, 사용자 설치·실행 확인 대기.

## 이번 범위

첫 공정 ST-01 소재 투입에서 소재 1개를 2초 동안 처리한다. 전체 차체 생산 완료가 아니라 5개 공정 중 첫 공정만 수행한다. 모델 설정인 초기 소재 20개·각 공정 처리시간은 유지한다.

- 시작: READY → RUNNING, ST-01 IDLE → PROCESSING, 소재 20 → 19, 처리 중 수량 0 → 1.
- 처리: 약 실제 0.1초 간격으로 경과 시간을 반영한다. GET 조회는 시간을 진행시키지 않는다.
- 2초 완료: RUNNING → PAUSED, ST-01 PROCESSING → BLOCKED, 남은 처리시간 0. 부품 ID는 유지한다.
- BLOCKED는 다음 공정으로 전달할 경로가 아직 구현되지 않아 완료 부품을 현재 설비에 보관한다는 의미다. 실제 대기열 포화에 따른 막힘 규칙 전체를 구현한 것은 아니다.
- PAUSED는 이번 단일 처리 범위 끝에서 자동으로 시계를 멈춘 상태다. 사용자 일시정지·재개 명령은 아직 없다.
- 완료 부품도 생산라인 안에 있으므로 in_process_count는 1을 유지한다. waiting_count는 입력 대기열만 세므로 0이다. 양품·불량은 검사·적재 전이므로 모두 0이다. 소재 19 + 라인 내부 부품 1 = 초기 20이다.
- ST-02~05는 IDLE이다. 불량 판정, 다음 공정 이동, 20개 연속 생산, 초기화 명령은 후속 작업이다.

## 사용자 설치·실행

실행 중인 백엔드를 Ctrl+C로 종료한 다음 `C:\project\truckworks\backend`에서 실행한다. 새 SimPy 의존성이 추가됐으므로 먼저 sync한다.

```powershell
& "$env:APPDATA\Python\Scripts\uv.exe" sync
& "$env:APPDATA\Python\Scripts\uv.exe" run uvicorn truckworks.api.app:create_app --factory --reload --host 127.0.0.1 --port 8010
```

의존성 설치와 uv.lock 갱신은 사용자가 수행한다. 단일 서버 프로세스의 메모리 상태이며 서버 재시작·reload 시 새 실행이 생성된다. 여러 worker를 사용하지 않는다.

## API 문서에서 확인

1. `http://127.0.0.1:8010/docs`를 연다.
2. `GET /api/factory/state`를 실행해 READY·소재 20·모든 설비 IDLE을 확인하고 run_id를 복사한다.
3. `POST /api/factory/single-station/start`의 Try it out에서 다음 본문의 값을 실제 run_id로 바꿔 실행한다.

```json
{"expected_run_id": "여기에 GET 응답의 run_id"}
```

4. 시작 응답은 RUNNING·소재 19·in_process_count 1, ST-01 PROCESSING·current_part_id 존재·남은 시간 2다.
5. `GET /api/factory/state`를 다시 실행한다. 처리 중이라면 남은 시간이 줄어든다. 2초가 지난 뒤에는 PAUSED·시뮬레이션 시간 2·ST-01 BLOCKED·남은 시간 0이다. 수동 조작 시간이 걸리면 중간 상태를 놓치고 완료 상태를 보는 것이 정상이다.
6. `GET /api/factory/events`는 PROCESS_STARTED(t=0), PROCESS_COMPLETED(t=2) 두 이벤트를 반환한다. sequence는 1·2이며 run_id·part_id는 두 이벤트에서 같다. last_event_sequence는 2다.
7. 같은 시작 명령을 다시 보내면 처리 중·완료 후 모두 409다. 소재는 19, 부품은 1개, 이벤트는 2개를 유지한다.
8. 시작 전 다른 유효 UUID를 보내면 409이고 READY·소재 20을 유지해야 한다. 잘못된 UUID 형식이나 누락 필드는 422다.
9. 서버 재시작 후에는 새 run_id·READY·소재 20·빈 이벤트 목록으로 돌아간다. 이전 run_id로 시작하면 409다.

재전송을 성공 응답으로 재현하는 명령 ID 기반 멱등성은 아직 구현하지 않았다. 이번 단계에서는 READY일 때 한 번만 시작하도록 거절 규칙을 둔다.

이 백엔드 구현 직후에는 프론트엔드가 연결 전 상태였다. 2026-10-08 후속 작업에서 상태·시작 명령·이벤트 화면 연결 코드를 작성했으며, 백엔드와 화면 연결 모두 사용자 확인 대기다. 현재 화면 확인 절차는 [FACTORY_CONNECTION.md](FACTORY_CONNECTION.md)를 따른다.

## 코드 읽기

`api/routes/factory.py` → `api/dependencies.py` → `simulation/runner.py` → `simulation/single_station.py` → `domain/models.py` 순서로 읽는다.

- 앱 lifespan이 runner를 만들고 종료 시 실행 task를 취소·회수한다.
- 시작 API는 실행 ID와 READY 상태를 검사하고 SimPy 프로세스를 등록한다.
- 엔진은 t=0의 시작 이벤트를 처리해 스냅샷을 교체한다. timeout(2) 이후 완료 이벤트를 처리한다.
- runner는 asyncio의 단조 시계로 실제 경과 시간을 읽고 엔진에 전달한다. SimPy와 HTTP 처리를 같은 이벤트 루프에서 순차적으로 수행한다.
- 엔진은 목표 시간 이하의 이벤트를 step으로 처리해 정확히 2초의 완료 이벤트도 포함한다. 진행 중 남은 시간은 실제 경과 시간으로 계산한다. 이벤트 사이에는 SimPy now와 화면용 경과 시간이 다를 수 있다.
- 상태는 불변 dataclass 스냅샷으로 교체하고 HTTP 응답은 기존 Pydantic 스키마로 변환한다.

참고: [SimPy 기본 개념](https://simpy.readthedocs.io/en/stable/simpy_intro/basic_concepts.html), [Environment·step·peek](https://simpy.readthedocs.io/en/stable/api_reference/simpy.core.html).

Codex는 설치·테스트·빌드·린트·서버 실행·HTTP 요청·브라우저 검증을 수행하지 않았다.
