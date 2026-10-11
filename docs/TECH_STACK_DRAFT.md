# 기술 구성과 폴더 구조

작성일: 2026-10-07 (Asia/Seoul)
상태: 2026-10-07 사용자 선택으로 기술 구성·로컬 실행 방식·폴더 구조 확정. 설치·프로젝트 생성·실행 검증은 수행하지 않았다. 기존 참조를 유지하기 위해 파일명은 그대로 둔다.

기존 계획서 4장의 구성을 채택했다. 정확한 패키지 버전은 환경 구성 시 공식 지원 범위를 참고해 결정하고 잠금 파일에 기록한다. 이후 수정이 필요하면 이유와 선택지를 먼저 제시하고 사용자 선택 후 변경한다.

## 기술별 역할과 도입 시점

| 영역 | 채택 기술 | 이유와 역할 | 도입 시점 |
|---|---|---|---|
| 화면 | React + TypeScript + Vite | 관제 패널과 생산 제어 구현, 화면 데이터 타입 정의 | 단계 1 |
| 3D | Three.js + React Three Fiber + Drei | React 화면 안에 공장·차체·조명·카메라 구성 | 단계 1 기반, 단계 2 장면 연결 |
| 화면 스타일 | CSS Modules + 공통 디자인 토큰 | 기본 다크 관제 패널과 레이아웃, Pretendard 적용 | 단계 1부터 |
| API 서버 | Python + FastAPI | 생산 명령·상태 조회·에이전트 요청 처리 | 단계 1 |
| 데이터 형식 | Pydantic | 명령·응답·이벤트·도구 입력과 출력의 형식 정의 | 단계 1 |
| 생산 시뮬레이션 | SimPy | 공정 시간, 설비 점유와 대기열 처리 | 단계 2 |
| 실시간 통신 | HTTP + WebSocket | 명령과 초기 조회는 HTTP, 상태 변경 전달은 WebSocket | 단계 1 형식 정의, 단계 2 연결 |
| 데이터 저장 | PostgreSQL + SQLAlchemy + Alembic | 생산 이력 저장, Python DB 접근, 스키마 변경 관리 | 단계 1 DB 기반, 단계 3 이력 저장 |
| 에이전트 흐름 | LangGraph | 조회 도구 실행과 설명 생성 흐름, 이후 선택 대기 확장 | 단계 4 |
| 언어 모델 | 도구 호출 가능한 외부 API 한 종류 | 질문 해석과 근거를 포함한 설명 | 단계 4, 제공사·모델 별도 선택 |
| 환경 관리 | npm + uv | 프론트엔드와 Python 의존성·잠금 파일 관리 | 단계 1 |
| 로컬 DB 실행 | Docker Compose | PostgreSQL 실행 설정을 저장소에 기록 | 단계 1 |
| 3D 자산 | 코드로 기본 도형 구성, 필요 시 Blender | 초기에는 프레임과 설비를 코드로 제작하고 이후 개선 | 단계 2 이후 |

라이브러리를 채택하는 결정과 모든 기능을 한꺼번에 설치·구현하는 작업은 구분한다. 단계별 도입 순서는 기존 계획을 따른다.

2026-10-07 사용자 요청으로 기능별 컴포넌트·타입·데이터·훅을 분리하고 CSS Modules를 적용했다. 현재 파일 구조는 `FRONTEND_ARCHITECTURE.md`, 다크 테마와 Pretendard 기준은 `DESIGN.md`를 따른다.

## 실행 환경

- Node.js와 Python은 Windows에서 실행하고 PostgreSQL은 Docker Desktop의 WSL 2 기반 컨테이너에서 실행한다.
- 기존 후보인 Node.js 24 LTS와 Python 3.12 계열은 환경 구성 단계에서 지원 조건을 참고해 구체적인 버전을 고정한다. 이번 초안에서는 정확한 런타임·패키지 버전을 확정하지 않는다.
- 개발 전체를 WSL로 옮기는 선택은 현재 추천안에 포함하지 않는다. 필요해지면 변경 선택지를 먼저 제시한다.
- API와 시뮬레이션·에이전트는 하나의 Python 프로젝트 안에서 모듈로 나눈다. 실행 러너의 경계와 소유권은 별도 구현 명세에서 정한다.
- 생산 상태는 서버가 결정하고 화면은 상태를 표현한다. 에이전트는 읽기 전용 도구로 서버 데이터를 조회한다.

## 폴더 구조

```text
truckworks/
├─ AGENTS.md
├─ PROJECT_PLAN.md
├─ frontend/
│  ├─ src/
│  │  ├─ app/                 # 화면 시작점·전체 레이아웃
│  │  ├─ features/factory/    # 생산 제어·설비 상세·생산 현황
│  │  ├─ features/agent/      # 질문·설명·도구 근거 표시
│  │  ├─ scene/              # 공장·설비·차체 3D 표현
│  │  ├─ components/         # 공통 화면 요소
│  │  └─ api/                # HTTP·WebSocket 연결
│  └─ public/models/         # 이후 배포용 모델 파일
├─ backend/
│  ├─ pyproject.toml
│  └─ src/truckworks/
│     ├─ api/                # 명령·조회·실시간 연결
│     ├─ domain/             # 부품·설비·생산 규칙
│     ├─ simulation/         # SimPy 엔진·실행 제어
│     ├─ agents/             # 분석 흐름·조회 도구
│     ├─ persistence/        # DB 모델·저장 처리
│     └─ settings.py         # 환경변수 설정
├─ assets/
│  ├─ source-models/         # 편집용 원본 자산
│  └─ design/                # 화면·장면 디자인 자료
├─ docs/                     # 진행 기록·명세·사용자 실행 안내
├─ compose.yaml             # 로컬 DB 실행 설정
├─ .env.example             # 비밀값 없는 환경변수 예시
└─ .gitignore
```

이 구조는 기존 계획서의 안을 그대로 사용한다. 개발 폴더와 설정 파일은 아직 생성하지 않았다.

## 다음 작업

기술 구성, npm·uv, Windows 앱 실행 + Docker DB, 위 폴더 구조를 채택했다. 다음은 단계 1의 프로젝트 기반 구성이다. 세부 모델 치수와 공정 상태 전이·화면 배치 명세도 구현할 작업에 맞춰 구체화하되 제안과 확정을 구분한다.

테스트·빌드·린트·브라우저 검증은 사용자에게 실행 절차와 기대 결과를 안내한다.

## 공식 참고 자료

- [Vite 시작 안내](https://vite.dev/guide/)
- [React Three Fiber 설치 및 React 호환 조합](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Drei](https://drei.docs.pmnd.rs/)
- [FastAPI WebSocket](https://fastapi.tiangolo.com/advanced/websockets/)
- [SimPy 개요](https://simpy.readthedocs.io/en/stable/)
- [LangGraph 개요](https://docs.langchain.com/oss/python/langgraph/overview)

## 2026-10-10 구현 상태 보충

위 초기 기술 구성은 유지한다. 이후 React 관제·SimPy 생산 및 제어·고장/복구를 작성했고, 이번에 compose.yaml의 PostgreSQL 17, SQLAlchemy asyncio·psycopg·Alembic, 실행/부품/이벤트 저장과 이력 API·화면을 작성했다. 이는 구성 파일과 코드 작성 상태이며 설치·DB 실행·마이그레이션·사용자 확인 완료를 뜻하지 않는다. 준비 절차는 HISTORY_STORAGE.md를 따른다. 잠금 파일의 정확한 의존성 버전은 사용자의 uv sync 시 반영된다. WebSocket·분석 에이전트는 아직 연결 전이며 LLM 제공사·모델은 미정이다.

## 2026-10-10 OpenAI 모델 결정

사용자가 OpenAI API와 저렴한 모델 선택을 위임해 기본 gpt-5.6-luna를 선택했다. 공식 openai SDK의 Responses API와 기존 채택 LangGraph를 연결하는 코드를 작성했다. 의존성 설치·정확한 잠금 버전 반영·실제 모델 접근/품질은 사용자 확인 대기다. 키는 서버 로컬 환경변수로만 관리하며 문서에 값은 기록하지 않는다. OPENAI_AGENT.md 참고.
