# PostgreSQL 생산 이력 저장과 조회

방문자 분리 추가(2026-10-10): 0003_visitor_ownership까지 `uv run alembic upgrade head`가 필요하다. 목록/상세·부품/이벤트는 내 쿠키의 소유자 범위만 조회한다. 기존 공유 기록은 owner_id=NULL로 DB에 보존하고 방문자 목록에서는 제외한다. [VISITOR_SESSIONS.md](C:/project/truckworks/docs/VISITOR_SESSIONS.md)를 함께 따른다. 사용자 적용/확인 대기다.

작성일: 2026-10-10 (Asia/Seoul)  
상태: DB 구성·마이그레이션·저장/조회 API·이력 화면 코드 작성 완료, 사용자 설치·실행 확인 대기. 테스트·빌드·린트·설치·Docker 실행·마이그레이션·서버 실행·HTTP 요청·브라우저 검증을 수행하지 않았다.

## 이번 범위

기존 확정 계획의 PostgreSQL + SQLAlchemy + Alembic을 도입했다. Windows의 Python/React와 Docker DB 구성을 유지한다. 저장 구현에 이어 과거 실행·부품·이벤트를 조회하는 화면까지 연결했다. 현재 관제는 메모리의 활성 시뮬레이션을 표시하고 이력 화면은 DB에 커밋된 기록을 표시한다.

저장 대상은 실행별 마지막 스냅샷·설정·모델/응답 버전·시드·부품별 마지막 상태·누적 생산 이벤트다. 초기화 전 실행은 RESET, 정상 서버 종료 때 활성 실행은 SERVER_STOP이라는 별도 보관 이유를 기록한다. 이 표식은 생산 완료 상태와 다르다. RUNNING 상태로 서버를 종료했다고 COMPLETED로 바꾸지 않는다.

서버 재시작은 새 활성 run_id로 시작한다. 이전 기록 조회와 SimPy 프로세스 복원은 다르며, 과거 실행 이어하기·애니메이션 재생·명령 재적용은 구현하지 않았다. DB에 저장되기 전 서버가 강제 종료된 기록까지 복구하는 기능도 없다.

## 사용자가 준비할 순서

1. Docker Desktop이 준비되지 않았다면 지금 DB 작업에 필요한 시점에 준비하고 실행한다. 전체 환경을 다시 설치하거나 사전 버전 확인을 수행할 필요는 없다.
2. `C:\project\truckworks\.env.example`을 참고해 같은 폴더의 `.env`에 DB 사용자·이름·직접 정한 비밀번호·포트를 설정한다. 기존 `.env`가 있다면 필요한 키만 추가한다. 예시 비밀번호는 교체한다.
3. `C:\project\truckworks`에서 DB를 실행한다.

```powershell
docker compose up -d db
```

4. `C:\project\truckworks\backend\.env.example`을 참고해 backend의 `.env`에 연결 주소를 설정한다. root의 `.env`와 backend의 `.env`는 서로 다른 용도다. 사용자·비밀번호·DB 이름·포트는 같은 DB를 가리켜야 한다. URL에 특수문자가 있으면 URL 인코딩한다. 실제 비밀번호는 학습/진행 문서에 기록하지 않는다.

```dotenv
TRUCKWORKS_DATABASE_URL=postgresql+psycopg://truckworks:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:5432/truckworks
```

5. `C:\project\truckworks\backend`에서 새 의존성을 설치하고 스키마를 적용한다. PATH에 uv가 있다면 `uv`로 줄여도 된다. 실제 잠금 버전은 이 설치 때 uv.lock에 반영된다.

```powershell
& "$env:APPDATA\Python\Scripts\uv.exe" sync
& "$env:APPDATA\Python\Scripts\uv.exe" run alembic upgrade head
```

6. 같은 backend 폴더에서 서버를 실행하고 프론트엔드를 새로고침한다.

```powershell
& "$env:APPDATA\Python\Scripts\uv.exe" run uvicorn truckworks.api.app:create_app --factory --reload --host 127.0.0.1 --port 8010
```

URL을 설정하지 않으면 기존 라이브 시뮬레이션은 사용할 수 있고 이력 저장은 비활성으로 표시한다. 이는 다른 DB로 대체하는 방식이 아니다. 새 Python 의존성은 API 모듈에서도 사용하므로 URL 설정 여부와 관계없이 이번 uv sync는 필요하다. 서버가 자동으로 테이블을 만들거나 마이그레이션을 실행하지 않는다.

## 저장 동작과 실제 한계

러너는 명령·이벤트 변화 때와 실행 중 약1초마다 불변 스냅샷/누적 이벤트를 저장 작업자에게 전달한다. DB 대기로 생산 시계를 막지 않도록 비동기 작업자가 저장한다. 같은 실행의 대기 상태는 최신 것으로 합치되 누적 이벤트를 함께 유지하고 다른 run_id는 별도 보관한다. **명령 성공 응답은 DB 커밋 완료를 뜻하지 않는다.**

실행 스냅샷·신규 이벤트·부품 상태를 한 트랜잭션에 저장한다. 이벤트 기본 키는 `(run_id, sequence)`여서 같은 기록을 다시 전달해도 행을 중복 삽입하지 않는다. 상태 버전으로 오래된 스냅샷의 덮어쓰기를 막는다. 현재 구조는 기존 단일 API worker·단일 활성 러너 전제다.

DB 오류는 일반 메시지와 저장 대기 실행 수로 표시하고 재시도한다. SQL·연결 비밀번호를 API 오류 응답에 노출하지 않는다. 미저장 대기열은 서버 메모리이므로 DB 장애 중 강제 종료하면 대기 기록은 유실될 수 있다. 정상 종료는 최대5초 저장 대기를 기다리고 남으면 일반 경고를 남긴다. DB에 이미 커밋한 기록은 유지한다. 강제 종료 후 종료 표식이 없는 RUNNING 기록은 마지막 저장 상태이며 지금 실행 중이라는 의미가 아니다.

Docker named volume에 DB를 보관한다. 일반적인 컨테이너 재시작 후 기록이 남아야 한다. DB 볼륨을 지우면 기록도 사라지므로 이 안내에서는 볼륨 삭제 명령을 사용하지 않는다. DB 장애 상태에서 반복 초기화하면 미저장 실행이 메모리에 쌓일 수 있으므로 저장 상태를 확인한다.

현재 schema_version은6이며 이벤트의 `occurred_at`은 생성 시점의 UTC 실제 시각이다. `simulation_time_seconds`와 별도다. DB의 updated_at은 마지막 저장 시각이며 이벤트 발생 시각이 아니다. 상태 전체 프레임을 매번 저장하는 타임라인이 아니라 마지막 상태와 이벤트 로그를 보관한다.

## 조회 API

`http://127.0.0.1:8010/docs`에서 history 그룹을 사용한다. 모두 읽기 전용이며 현재 시뮬레이션을 변경하지 않는다.

| 경로 | 내용 |
|---|---|
| GET /api/history/status | 저장 활성 여부·대기 실행 수·최근 저장 오류 |
| GET /api/history/runs?limit=20&offset=0 | 최신 생성 순 실행 목록. limit 최대100 |
| GET /api/history/runs/{run_id} | 마지막 스냅샷·버전·설정·보관 이유 |
| GET /api/history/runs/{run_id}/parts | 부품별 마지막 상태, 생산 번호 순 |
| GET /api/history/runs/{run_id}/events?after_sequence=0&limit=100 | 순번 증가 순 이벤트. limit 최대500 |
| 같은 events 경로에 &part_id={UUID} 추가 | 해당 부품이 기록된 이벤트만 조회 |

저장 비활성/DB 조회 실패는503, 아직 저장되지 않았거나 없는 실행은404, 잘못된 UUID/페이지 범위는422다. status의 enabled는 설정 활성 여부이며 연결 성공을 보증하지 않는다. pending_runs는 저장 중 실행도 포함하며0은 그 조회 시점에 대기 작업이 없다는 뜻이다.

단독 ST-01은 기존 엔진이 설비 안에만 부품 ID를 보관하므로 그 필드에서 RAW·PROCESSING/BLOCKED의 부품 기록을 구성한다. 전체1개/20개는 실제 PartSnapshot을 저장한다. 부품 없는 설비 고장 이벤트의 part_id=null은 그대로 보존한다.

## 화면에서 직접 확인할 항목과 기대 결과

1. 관제 아래 `생산 이력`에서 새로고침한다. URL 미설정이면 비활성 안내, 설정 후 정상 저장되면 실행 목록과 대기 상태가 표시돼야 한다. DB가 꺼졌거나 마이그레이션이 없으면 오류를 표시하며 빈 기록을 성공처럼 표시하면 안 된다.
2. 차체1개를 생산하고 이벤트 저장 대기가 해소된 뒤 이력을 새로고침해 실행을 선택한다. 마지막 시각26초·양품/불량 합1·이벤트 순번1~21이 기본 기대 결과다. occurred_at 실제 시각과 시뮬레이션 시각이 별도 열로 표시돼야 한다.
3. 생산 초기화 후 새 실행을 만든다. 이전 실행이 RESET으로 남고 이전/새 이벤트가 서로 섞이지 않아야 한다. 활성 관제는 새 실행을 표시하며 이력 선택은 현재 생산을 제어하지 않는다.
4.20개 생산과 고장/복구·일시정지/재개를 수행하고 저장 후 부품 필터를 선택한다. 해당 부품의 상태·공정·이동·대기·품질/적재 이벤트가 순서대로 표시돼야 한다. 전체 이벤트에는 부품 없는 고장도 남아야 한다.
5. 이벤트100개 더 보기를 눌러 누락/중복 없이 이어지는지 확인한다. 부품 필터에서는 순번이 연속이 아닐 수 있다. 실행을 빠르게 바꿔도 이전 응답이 새 선택에 섞이면 안 된다.
6. 활성 실행의 이력을 선택한 뒤 생산이 계속돼도 조회한 마지막 상태의 last_event_sequence까지만 표시돼야 한다. 최신 상태는 이력 새로고침 후 다시 선택해 받는다. 부품 상태도 선택한 스냅샷에서 읽어 같은 시점을 유지한다.
7. 저장 대기 해소 후 정상 서버 종료·재시작과 DB 컨테이너 재시작을 직접 수행한다. 이전 실행/부품/이벤트가 남고 새 활성 UUID가 생성돼야 한다. 정상 서버 종료 시 마지막 활성 실행에 SERVER_STOP 표식이 기대 결과다. 과거 실행이 자동 재개되면 안 된다.
8. DB를 잠시 중단한 뒤 생산/초기화하고 서버를 유지한 채 DB를 다시 시작한다. 오류·대기 수를 표시하고 연결 복구 후 실행별 누적 이벤트를 재시도해 저장해야 한다. 같은 실행/순번이 중복되면 안 된다. 이는 코드상 기대 결과이며 확인 결과가 아니다.
9. 이력 API/화면 조회를 반복해도 라이브 소재·시각·명령 이벤트를 추가로 변경하면 안 된다. 라이브 시계는 자체 러너에 따라 진행한다.

이력 화면은 수동 조회이며 자동 실시간 관제로 표현하지 않는다. 한국 시간 표시는 브라우저에서 UTC 시각을 Asia/Seoul로 변환한 것이다. 특정 부품 필터는 해당 ID가 기록된 이벤트만 포함하며 전체 실행 제어의 part_id는 대표 부품 문맥이다.

## 관련 코드와 참고

- backend의 persistence/models.py·repository.py·writer.py: 테이블·트랜잭션/조회·저장 대기/재시도.
- backend/migrations와 alembic.ini·compose.yaml: 사용자가 실행할 DB/스키마 구성.
- simulation/runner.py·api/app.py·api/routes/history.py: 수집·수명·읽기 전용 API.
- frontend/api/history.ts·useProductionHistory.ts·HistoryPanel.tsx: 조회·취소/페이지·화면.

비동기 psycopg 접속은 [SQLAlchemy PostgreSQL 공식 문서](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#module-sqlalchemy.dialects.postgresql.psycopg), 비동기 엔진에서 마이그레이션 연결은 [Alembic 공식 안내](https://alembic.sqlalchemy.org/en/latest/cookbook.html#using-asyncio-with-alembic)를 참고했다. 로컬 DB 이미지 설정은 [공식 PostgreSQL 이미지](https://hub.docker.com/_/postgres)를 따른다.

다음은 사용자 결과 반영과 읽기 전용 분석 도구·에이전트다. LLM 제공사·모델은 아직 미정이며 사용자가 선택하지 않은 서비스를 확정하거나 API 키를 생성하지 않는다.
