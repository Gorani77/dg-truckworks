# TruckWorks

모형 트럭의 차체 생산을 3D로 관찰하고, 읽기 전용 AI 에이전트가 공장 상태와 이벤트를 근거로 설명하는 생산 시뮬레이터입니다.

**2026-10-12 현재: 로컬 개발 및 프론트 선배포 준비 중입니다.** 생산·분석·이력·실시간 연결·방문자별 공장·유휴 정리 코드는 작성했으며 후속 기능의 사용자 실행 확인은 대기 중입니다. 프론트·백엔드·문서·모델 자산을 [단일 GitHub 저장소](https://github.com/Gorani77/dg-truckworks)에서 함께 관리합니다. 호스팅 서비스·공개 데모 URL·도메인 연결·시연 영상은 아직 준비하지 않았습니다. 프론트 배포 시 루트는 `frontend`, 빌드 명령은 `npm run build`, 결과 폴더는 `dist`입니다. 현재 Vite의 `/api` 프록시는 개발 서버용이므로 실제 배포에는 별도의 백엔드 연결 구성이 필요합니다.

화면은 전체 화면 공장 탐색 방식으로 개편했습니다. 공장 전체에서 차체 생산라인과 설비로 이동하고, 부품을 따라가며 생산·고장·AI 분석·복구를 체험하는 코드를 작성했습니다. AI 답변의 관련 설비는 장면에 강조하고 상세/기록은 필요할 때 엽니다. 조립 구역은 확장 예정 전시 모형입니다. 새 화면은 **사용자 확인 대기**이며 [조작·확인 안내](docs/IMMERSIVE_EXPERIENCE.md)를 따릅니다.

## 무엇을 만드는가

ST-02 형상 가공기는 Blender 전용 모델로 제작해 편집 원본과 웹용 GLB를 생성했습니다. 새 모델·가동·조명 연결은 사용자 확인 대기입니다. [대표 모델 확인 안내](docs/FORMING_CELL_ASSET.md)를 참고하세요. Blender는 모델 편집/재생성에만 필요하며 웹 앱 실행에는 필요하지 않습니다.

후속으로 ST-02의 시각 품질에 대한 사용자 긍정 피드백을 받고 소재 투입·구멍 가공·품질 검사·분리 적재도 Blender 모델로 제작했습니다. 이제 다섯 공정 모두 전용 자산을 사용하며 새 네 설비의 가동·시각 확인은 대기입니다. [네 설비 확인 안내](docs/EQUIPMENT_ASSETS.md)와 [작업 재개 기록](docs/MODELING_CHECKPOINT.md)을 참고하세요. ST-02 외형 피드백을 전체 동작 검증 완료로 확대하지 않습니다.

첫 공개 목표는 차체 생산라인과 장애 원인을 설명하는 분석 에이전트입니다. 차체 소재 투입 → 형상 가공 → 구멍 가공 → 품질 검사 → 양품 적재/불량 분리의 다섯 공정을 다룹니다. 완성된 트럭 조립과 트레일러 생산은 후속 계획입니다.

프레임 차체는180 × 60 × 12mm이며 전체를 하나의 생산 부품으로 취급합니다. 공정별2·8·6·4·2초, 구간 이동1초, 초기 소재20개, 입력 대기와 이동 예약 합계3개, 고정 시드의 불량률5%는 프로젝트에서 정한 시뮬레이션 가정입니다. 실제 공장 측정 데이터나 정밀 절삭 물리 모델은 아닙니다.

## 작성한 기능

아래는 코드 작성 범위이며 모두 실행 검증 완료라는 뜻은 아닙니다. 확인 상태는 [진행 기록](docs/PROGRESS.md)에 구분해 관리합니다.

| 영역 | 작성한 내용 |
|---|---|
| 생산 | ST-01 단독 처리, 차체1개 전체 공정, 소재20개 FIFO 연속 생산 |
| 운영 | 시작·일시정지·재개·초기화, 선택 설비 고장·복구, 잔여 작업 보존 |
| 관제 | 공정별 코드 기반3D 모델, 상태·부품 이동·수량·이벤트·부품 선택 |
| 실시간 | WebSocket 상태+누적 이벤트 수신, heartbeat, 자동 재연결 |
| 분석 | OpenAI·LangGraph 읽기 도구 선택과 근거 설명, 관측 버전·도구·토큰·추정 비용 |
| 이력 | PostgreSQL 생산/분석 기록, 과거 실행·부품·이벤트·질문/답변 조회 |
| 방문자 | 익명 브라우저 쿠키별 공장과 이력 소유권, 같은 프로필의 탭 공유 |
| 수명 | 연결/요청 없는 공장30분 정리, 사용 중 보호, 재방문 새 실행 |

## 구성과 데이터 흐름

React·TypeScript·Vite와 React Three Fiber·Three.js·Drei가 관제/3D를 표현하고, FastAPI의 방문자별 SimPy 엔진이 생산 상태를 소유합니다. 제어는 HTTP POST, 상태와 이벤트 수신은 WebSocket을 사용합니다. 저장은 SQLAlchemy·Alembic·PostgreSQL로 분리합니다.

에이전트는 한 시점의 공장 스냅샷과 이벤트를 고정해 읽습니다. 공장 현황을 읽고 모델이 허용된 조회 도구를 선택하면 서버가 실행해 결과를 전달하고, 모델이 근거 설명을 생성합니다. 공장·설비·최근 이벤트·대기/예약·부품 이력5종만 제공하며 생산 제어 도구는 없습니다. 존재하는 인용인지 검사하지만 설명의 인과관계나 품질까지 보장하는 것은 아닙니다.

```text
frontend/src/app/              화면 조합
frontend/src/features/factory/ 생산 제어·현황·이력
frontend/src/features/agent/   분석 질문·도구·이력
frontend/src/scene/            3D 공장 표현
frontend/src/api/              세션·HTTP·WebSocket
backend/src/truckworks/api/    요청·세션·실시간 전달
backend/src/truckworks/domain/ 생산 정의·불변 상태
backend/src/truckworks/simulation/ SimPy 엔진·실행 수명
backend/src/truckworks/agents/ 읽기 도구·LangGraph·사용량
backend/src/truckworks/persistence/ 비동기 저장·조회
backend/migrations/           DB 변경 이력
docs/                         결정·개발 순서·사용자 안내
```

## 사용자가 직접 로컬 실행하기

기존 프로젝트를 대상으로 한 안내입니다. Python3.12 이상과 uv, 프론트엔드의 npm 환경을 사용합니다. Codex는 설치·테스트·빌드·린트·실행 확인을 수행하지 않았습니다. 이미 실행 중인 서버가 있으면 같은 포트에 중복 실행하지 않습니다.

1. DB 없이 생산 화면부터 볼 수 있습니다. DB 이력까지 사용하려면 [DB 준비](docs/HISTORY_STORAGE.md)에 따라 루트 `.env`와 `backend/.env`를 준비하고 루트에서 `docker compose up -d db`를 직접 실행합니다. DB 암호/URL은 예시 그대로 사용하지 않습니다.
2. `C:\project\truckworks\backend`에서 아래를 실행합니다. uv가 PATH에 없으면 [백엔드 안내](backend/README.md)의 uv.exe 경로를 사용합니다.

```powershell
uv sync
# DB를 설정한 경우에만 적용. 현재 head는 0003_visitor_ownership입니다.
uv run alembic upgrade head
uv run uvicorn truckworks.api.app:create_app --factory --reload --host 127.0.0.1 --port 8010
```

3. 별도 터미널의 `C:\project\truckworks\frontend`에서 실행합니다. 의존성을 처음 준비하는 경우에는 먼저 `npm ci`를 수행합니다.

```powershell
npm run dev
```

4. Vite가 안내하는 주소를 엽니다. 기본 포트는5173입니다. 개발 프록시가8010의 HTTP/WS를 전달하고 화면이 방문자 쿠키를 자동 준비합니다. 같은 프로필의 탭은 같은 공장입니다. 독립 방문자는 일반창+시크릿창 또는 다른 프로필로 구분합니다.
5. 자연어 분석은 [OpenAI 설정 안내](docs/OPENAI_AGENT.md)를 따릅니다. 키는 서버 환경변수로만 설정하며 브라우저 입력은 없습니다. 질문 요청은 원격 API 비용이 발생합니다. 수동 읽기 도구는 OpenAI를 호출하지 않습니다. 키를 설정하지 않으면 자연어 분석을 사용할 수 없지만 생산과 수동 조회는 사용할 수 있도록 작성했습니다.

직접 API를 조회할 때는 health 외 공장/분석/이력 요청 전에 `POST /api/session`의 쿠키를 준비합니다. Swagger·PowerShell 방법은 [방문자 안내](docs/VISITOR_SESSIONS.md)에 있습니다.

## 데모와 개발 자료

- [로컬 시연 순서·촬영 대본·확인 결과 양식](docs/DEMO_GUIDE.md)
- [포트폴리오 소개 초안](docs/PORTFOLIO.md)
- [프로젝트 계획](PROJECT_PLAN.md), [현재 진행 상태](docs/PROGRESS.md)
- [개발 순서대로 배우는 학습 노트](docs/INTERVIEW_STUDY.md)
- [WebSocket](docs/FACTORY_STREAM.md), [방문자 분리](docs/VISITOR_SESSIONS.md), [유휴 공장](docs/IDLE_FACTORIES.md)
- [생산 이력](docs/HISTORY_STORAGE.md), [분석 이력](docs/ANALYSIS_HISTORY.md)

## 현재 한계와 다음 범위

라이브 엔진은 단일 서버 프로세스의 메모리에 있습니다. 서버 재시작이나 유휴 정리 후에는 새 실행을 시작하며 DB 이력으로 엔진을 복원하지 않습니다. 비동기 저장 대기는 메모리이므로 강제 종료 시 미저장 기록 손실 가능성이 있습니다. 다중 worker/인스턴스 동기화, 계정/기기 간 이력 이동, 자동 복구·생산 최적화는 아직 없습니다.

추가 일일 횟수·지출·접근 횟수 제한은 사용자 결정으로 도입하지 않았습니다. 기존 모델/도구 호출 수·시간·서버 공통 분석 동시성/간격 장치는 유지합니다. 답변 추정 비용은 실제 청구 확인과 다르고, 수신하지 못한 사용량을0으로 확정하지 않습니다. 성능·정확도 측정값과 신규 기능 사용자 확인 결과는 아직 공개 실적으로 제시하지 않습니다.

다음은 사용자 확인과 실제 화면 시연 자료를 준비한 뒤 호스팅·운영 예산·공개 범위를 선택하는 작업입니다. 이후 바퀴·차축·운전석 공급과 견인차 조립으로 확장할 계획입니다.

## 공장 전체 Blender 외형 확장 (2026-10-11)

기존 설비5종에 더해 건축/바닥/배관/안전 시설, 선반/카트, 전시 트럭/작업대, 컨베이어/받침/대기 팔레트, 생산 차체3단계의 자산10종을 생성하고 연결 코드를 작성했다. 편집 원본은 assets/source-models/factory-world, 배포 GLB는 frontend/public/models에 있다. 시각·동작·성능은 사용자 확인 대기다. [전체 자산 안내](docs/FACTORY_WORLD_ASSETS.md)와 [이어갈 지점](docs/MODELING_CHECKPOINT.md)을 참고한다. 전시 트럭은 신규 조립 기능이나 실제 생산 재고가 아니다.

## 전체 UI 개편 (2026-10-11)

모델링 이후 HUD·설비/구역 표지·생산 조작·상세/AI/설정·기록/소개/안내 체험·로딩/오류/2D UI의 디자인과 정보 위계를 다시 작성했다. 서버 기능과 모델은 유지했다. 코드 작성 완료·사용자 시각/동작 확인 대기이며 [UI 개편 확인 안내](docs/UI_REDESIGN.md)를 따른다. 테스트·빌드·린트·브라우저 검증은 실행하지 않았다.
