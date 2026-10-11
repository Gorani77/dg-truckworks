# 프론트엔드 구조

## 2026-10-11 현재 화면 구조

사용자 승인으로 상시 패널 대시보드를 전체 화면 공장 탐색으로 변경했다. 서버 생산 상태의 책임은 유지하고 시점·선택·정보창·안내 체험을 별도 UI 상태로 관리한다. 코드 작성 완료·사용자 확인 대기다.

- `app/FactoryDashboard.tsx`: 기존 useFactoryConnection으로 서버 연결, 실행 ID별 SimulationExperience 수명 관리. 새 실행/연결 손실은 이전 분석과 안내 상태를 정리한다.
- `app/SimulationExperience.tsx`: 장면·HUD·선택·분석·안내·기록을 조합한다. 부품 추적 시 현재 부품 위치의 설비 맥락을 분석에 전달한다.
- `app/useSceneNavigation.ts`, `SimulationHud.tsx`, `SceneDrawer.tsx`, `experience.module.css`: 공간 선택, 화면 위 조작, Esc, 정보창 초점과 내부 스크롤. 정보창은 모달이 아니므로 장면/조작과 함께 사용할 수 있다.
- `scene/ImmersiveViewport.tsx`, `spatialNavigation.ts`: 지연 로딩·2D/오류 대체·명시적인 시점 종류. 기존 FactoryViewport는 이전 화면용 파일로 남아 있으며 현재 진입에서는 사용하지 않는다.
- `scene/SpatialCamera.tsx`: 시점/부품 좌표를 부드럽게 따라가는 직교 카메라. 수동 조작은 자동 추적을 멈추고 시점 초기화/새 선택으로 복귀. 감소된 모션은 즉시 전환. 생산 시간은 진행시키지 않는다.
- `scene/FactoryEnvironment.tsx`: 절개된 공장 바닥/벽·구역 표지·배경 선반·조립 전시 모형. 재고/조립 실적으로 취급하지 않는다.
- `scene/FactoryScene.tsx`, `StationModel.tsx`: 기존 생산/부품 모델과 새 환경·카메라 연결. 선택과 서버 고장 상태, 답변 관련 설비 강조를 구분한다. Html 표지는 화면 UI보다 낮은 층에 둔다.
- `features/factory/hooks/useGuidedTour.ts`, `components/GuidedExperience.tsx`: 순수 reducer가 실제 상태·분석 버전으로 체험 단계를 판정한다. 요청 중/실패는 수신 성공으로 간주하지 않는다.
- `features/factory/components/SceneSelection.tsx`: 선택 설비/부품/구역 정보와 조작. 기존 상세 컴포넌트를 재사용한다.
- `features/agent/SceneAgentPanel.tsx`: 상위 useAgentQuestion의 상태로 질문·답변·관련 설비·접힌 근거 표시. 기존 AgentPanel은 showQuestion=false로 수동 자료 조회를 재사용한다. AI 창 닫기는 요청 취소가 아니며 실행 수명 종료는 기존 abort 정리를 수행한다.
- 기존 ProductionControls·EventLog·HistoryPanel·AnalysisHistoryPanel은 요청한 정보창에서 사용한다. 과거 기록은 현재 장면 상태를 변경하지 않는다.

자료 흐름: WebSocket → useFactoryConnection → SimulationExperience → 3D/HUD. 사용자 선택 → useSceneNavigation → SpatialCamera/선택 정보창. 질문 → 기존 분석 API → useAgentQuestion → SceneAgentPanel + 실제 관련 설비 ID 강조. 확인 절차는 IMMERSIVE_EXPERIENCE.md를 따른다.

## 2026-10-11 ST-02 Blender 자산 연결

- `scene/equipment/ProcessEquipment.tsx`는 ST-02만 FormingCellAsset으로 연결하고 기존 FormingCell을 부분 로딩/실패 대체로 유지한다.
- `FormingCellAsset.tsx`는 앱 base 경로의 GLB를 useGLTF로 읽는다. 캐시된 원본을 직접 수정하지 않고 장면/재질을 복제한다. 이름이 고정된 CarriageX·SpindleSlide·ClampFront·ClampBack 노드와 Status_Lens 재질을 사용한다. 복제 재질만 정리하고 공유 지오메트리는 해제하지 않는다.
- `formingCellMotion.ts`가 서버 진행률을 가동 위치로 변환한다. 로컬 시계/애니메이션 완료가 생산 상태를 변경하지 않는다. 기존 holdProcessPose를 통해 가공 중 고장도 수신 포즈를 유지한다.
- `StationModel.tsx`는 새 모델에 포함된 ST-02 작업대/상태등과 기존 공통 모형의 중복을 피한다. 부품은 기존 PartModel, 대기열/이동/선택/AI 강조는 기존 경로를 유지한다.
- `FactoryLighting.tsx`는 직접 조명과 Environment/Lightformer로 로컬 반사 환경을 만든다. 색은 tokens.css→sceneConfig의 팔레트로 전달한다. 새 npm 패키지와 원격 HDR은 추가하지 않았다.
- 자산 제작 스크립트/편집 원본은 assets/source-models, 웹 배포 GLB는 frontend/public/models에 분리한다. Blender는 자산 생성 도구이며 앱 런타임 의존성이 아니다.

파일 생성/내보내기는 수행했고 앱 실행·빌드·시각 검증은 수행하지 않았다. FORMING_CELL_ASSET.md에 사용자 절차를 기록했다.

## 이전 구조 상세

2026-10-10 추가: `api/session.ts`가 익명 방문자 준비 Promise/Web Locks·쿠키 기반 visitorFetch를 맡고 모든 생산/분석/이력 요청에서 사용한다. WebSocket도 준비 후 연결한다. 같은 브라우저 프로필의 탭은 같은 공장이며 별도 프로필은 독립 공장이다. [VISITOR_SESSIONS.md](C:/project/truckworks/docs/VISITOR_SESSIONS.md) 참고. 코드 작성 완료·사용자 확인 대기다.

갱신일: 2026-10-08 (Asia/Seoul)

## 책임 분리

```text
src/
├─ App.tsx                           # 앱 진입
├─ main.tsx                          # React 마운트
├─ index.css                         # 전역 기본 스타일
├─ styles/tokens.css                 # 서체·색상·간격
├─ app/
│  ├─ AppHeader.tsx
│  ├─ FactoryDashboard.tsx           # 화면 조합과 선택 상태 전달
│  └─ dashboard.module.css
├─ components/
│  ├─ Panel.tsx / panel.module.css
│  └─ Button.tsx / button.module.css
├─ features/
│  ├─ factory/
│  │  ├─ types.ts
│  │  ├─ data/chassisLine.ts          # 모델 설정; 실시간 값 아님
│  │  ├─ hooks/useStationSelection.ts
│  │  ├─ factory.module.css
│  │  └─ components/
│  │     ├─ ProductionSummary.tsx
│  │     ├─ ProductionControls.tsx
│  │     ├─ StationList.tsx
│  │     ├─ StationDetails.tsx
│  │     └─ EventLog.tsx
│  └─ agent/
│     ├─ AgentPanel.tsx
│     └─ agent.module.css
└─ scene/
   ├─ FactoryViewport.tsx            # 작업 영역과 제품 사양
   ├─ FactoryLayoutPreview.tsx       # 2D 선택 화면·3D 로딩 및 실패 시 대체
   ├─ FactoryScene.tsx               # Canvas·카메라·조명·공장 배치
   ├─ StationModel.tsx               # 설비·실제 상태·소재 표시
   ├─ equipment/ProcessEquipment.tsx # 투입·가공·드릴·검사·분리 공정별 도형
   ├─ equipment/MechanicalParts.tsx  # 공통 상자·실린더 재질 표현
   ├─ sceneConfig.ts                 # 표시 단위·설비 간격·CSS 팔레트 읽기
   ├─ SceneBoundary.tsx              # 3D 표시 실패 시 대체
   └─ scene.module.css
```

## 확장 규칙

- 공정 설정과 타입을 화면에서 분리한다. 서버 상태가 생기면 정적 공정 정의와 별도 타입으로 관리한다.
- 선택 상태는 `useStationSelection`에서 관리하고 공정 목록·장면·상세에 같은 선택을 전달한다. 존재하지 않는 ID는 선택하지 않는다.
- 공장·에이전트 기능은 서로의 UI 내부를 직접 수정하지 않고 화면 조합 계층에서 연결한다.
- 반복되는 공통 UI만 추출한다. 범용 동적 대시보드 엔진이나 외부 전역 상태 라이브러리는 현재 필요하지 않다.
- CSS Modules로 스타일을 격리하고 공통 디자인 값만 전역 토큰으로 둔다.
- HTTP 제어/조회와 응답 타입은 `api/factory.ts`, WebSocket URL·메시지 형식은 `api/factoryStream.ts`에 둔다. `useFactoryConnection`은 상태+누적 이벤트 수신·연결 끊김 안내·자동 재연결과 HTTP 생산 제어를 관리한다. 화면 상태는 스트림에서만 갱신해 늦은 HTTP 응답의 역전을 막는다. 연결 해제 시 현재 데이터와 제어를 비활성화하며 재접속 때 전체 상태를 수신한다.
- 기본 3D는 scene/에서 구성하고 기존 선택 상태·공정 정의를 재사용한다. 서버 상태는 props로 받아 표시하며 3D에서 생산 규칙·시간을 결정하지 않는다. SVG 배치도는 2D 전환·로딩·표시 실패 시 대체로 유지한다.

테스트·빌드·린트·브라우저 검증은 수행하지 않았다. 사용자 확인 절차는 `UI_CHECK_GUIDE.md`를 따른다.

2026-10-08: `api/factory.ts`, `features/factory/hooks/useFactoryConnection.ts`, `features/factory/presentation.ts`를 추가했다. 대시보드는 서버 상태를 현황·제어·상세·이벤트로 전달한다. 서버 정의를 수신하기 전에는 정적 모델 미리보기를 유지하며 라이브 수치를 만들지 않는다. 연결 변경은 사용자 확인 대기이며 절차는 `FACTORY_CONNECTION.md`에 있다.

2026-10-08 후속 작업: 기본 3D 장면과 상태 표시 코드를 작성했다. FactoryViewport에서 지연 로딩하고 대시보드의 현재 stationStates를 전달한다. 설치·사용자 확인은 대기 상태이며 새 절차는 FACTORY_3D.md를 따른다.

2026-10-08 A안 선택 후: StationModel은 선택·상태·실제 소재를 관리하고 ProcessEquipment는 ID에 맞는 설비 외형을 조합한다. 상자·실린더의 반복되는 재질과 그림자는 MechanicalParts에 둔다. 공정 외형을 분리했으며 시뮬레이션 로직은 장면으로 옮기지 않았다.

2026-10-08 전체 공정 연결: API에 part·transfer 타입과 전체 시작 요청을 추가했다. 차체 추적은 features/factory/components/PartDetails.tsx, 서버 상태에 따른 위치 계산은 scene/partPosition.ts, 실제 부품의 형상과 위치 보간은 scene/PartModel.tsx가 담당한다. 전체 시나리오에서는 실제 부품을 한 번만 렌더링하고 StationModel의 기존 단독 소재를 숨긴다. 시뮬레이션 시간과 품질 판정은 서버 책임이다.

2026-10-10 연속 생산 연결: API schema4에 parts/transfers·생산 번호를 추가했다. FactoryDashboard는 기존1개 필드와 batch 목록을 화면용 목록으로 연결한다. ProductionControls의 시나리오 선택, PartTracking의 차체 선택, StationDetails의 입력 대기/예약/FIFO, EventLog의 차체 번호를 각 기능 컴포넌트에 둔다. FactoryScene은 부품별 PartModel을 렌더링하고 partPosition은 QUEUED·STORED의 도식적 쌓기 좌표를 계산한다. 수량·시계·예약/FIFO·품질 규칙은 백엔드 책임이다. 코드 작성 완료·사용자 확인 대기이며 절차는 BATCH_PRODUCTION.md에 있다.

2026-10-10 설비 고장·복구 연결: schema5의 status_before_fault·nullable 이벤트 part_id와 설비별 fault/repair 요청을 api/factory.ts에 뒀다. useFactoryConnection은 선택 설비 명령과 기존 조회 중단/재개를 관리하며 ProductionControls는 수신 상태로 버튼을 활성화한다. StationDetails·PartTracking/PartDetails·EventLog는 고장 전 맥락·차체 중단·부품 없는 이벤트를 표시한다. StationModel은 고장 색과 마지막 가공 위치를 표시한다. 고장/복구·잔여시간·FIFO/예약은 백엔드 StationRuntime과 엔진 책임이다. 코드 작성 완료·사용자 확인 대기이며 STATION_FAULTS.md를 따른다.

2026-10-10 생산 이력 연결: api/history.ts는 저장 상태·실행·부품·이벤트 조회 타입과 HTTP 처리를, useProductionHistory는 별도 선택 상태·취소·수동 조회·페이지/필터를 관리한다. HistoryPanel과 history.module.css에 생산 이력 영역을 두고 FactoryDashboard에서 조합한다. 선택 스냅샷에서 부품을 구성하고 이벤트 순번을 해당 저장 상태까지만 제한해 진행 중 실행의 서로 다른 저장 시점을 섞지 않는다. EventLog의 실제 발생 시각 열은 이력에서만 활성화한다. 현재 관제 상태·명령·3D 상태를 이력 선택으로 변경하지 않는다. 코드 작성 완료·사용자 확인 대기이며 HISTORY_STORAGE.md를 따른다.

2026-10-10 현재 실행 분석 도구: features/agent/AgentPanel.tsx는 수동 조회·결과/근거 표시, useAnalysisTools.ts는 독립 요청/취소/오류 상태, api/analysis.ts는 타입과 GET 요청을 맡는다. FactoryDashboard는 현재 실행·선택 설비·실제 부품 ID만 전달한다. 실행 ID를 React key로 사용해 초기화 시 이전 결과와 요청을 정리한다. 관측 결과를 live 공장 상태에 덮지 않으며 자연어 입력은 LLM 연결 전까지 비활성이다. ANALYSIS_TOOLS.md 참고. 코드 작성 완료·사용자 확인 대기다.

2026-10-10 OpenAI 분석 연결: AgentQuestion.tsx는 질문 입력·답변/근거·사용량 표시, useAgentQuestion.ts는 질문 요청/시간 제한/취소/오류 상태를 담당한다. AgentPanel에서 수동 도구 조회와 조합하고 관련 설비 선택은 FactoryDashboard의 기존 selectStation에 전달한다. 키는 프론트엔드에 넣지 않고 질문·실행·선택 설비 ID만 서버로 전송한다. 실행 ID 변경 시 기존 패널 key의 정리 동작을 재사용한다. 코드 작성 완료·사용자 실제 호출 확인 대기이며 OPENAI_AGENT.md를 따른다.

2026-10-10 분석 이력: api/analysisHistory.ts의 자료/HTTP → useAnalysisHistory의 요청 취소/페이지/선택 → AnalysisHistoryPanel의 과거 질문/답변/사용량 표시 → FactoryDashboard 조합으로 연결했다. 현재 실행 필터와 이전 실행 포함을 구분하고 실행 변경 시 key로 이전 조회를 정리한다. 과거 자료는 현재 공장 state에 적용하지 않는다. AgentAnswer 공통 API 타입은 api/analysis.ts로 이동해 API가 훅에 의존하지 않도록 했다. ANALYSIS_HISTORY.md 참고. 코드 작성 완료·사용자 확인 대기다.

## 2026-10-11 — 나머지 네 설비 자산 연결

ST-01/03/04/05는 EquipmentAsset.tsx를 공통 로더로 사용한다. equipmentMotion.ts는 설비별 자산/가동 노드와 서버 진행률의 포즈 변환을 정의한다. 원본 캐시를 복제하고 이름별 기준 위치/회전을 보관해 누적 이동을 막는다. 숨길 검사 띠는 visible로 제어하고 고장 상태등은 별도로 표시한다. 개별 Suspense/SceneBoundary로 로딩/실패를 설비 단위로 대체한다.

FactoryScene이 current_part_id에 일치하는 실제 부품 quality를 StationModel→ProcessEquipment→EquipmentAsset에 전달한다. ST-05는 이를 읽어 분기 가이드를 움직이며 임의 품질을 계산하지 않는다. 부품 경로는 기존 partPosition을 유지한다. ST-02의 FormingCellAsset은 변경하지 않는다. 공통 테이블/상태등은 이제 모델에 포함되므로 StationModel의 중복 모형을 제거했다. 새 설비 사용자 확인은 대기다.

## 2026-10-11 — 환경·인프라·제품 자산

scene/assets/WorldAsset.tsx는 새10종의 공통 로더다. 장면만 복제하고 정적 재질/지오메트리는 공유한다. Product_Metal만 부품별로 복제해 품질 색상이 다른 부품에 섞이지 않게 하며 소유한 복제 재질만 정리한다. 모델 이름을 경계 key로 써 가공 단계가 달라지면 해당 자산의 실패 경계도 새로 구성한다. Suspense는 기본 모형, 실패는 기본 모형과 안내로 부분 대체한다.

FactoryEnvironment는 공장 외곽/소재 구역/전시 구역과 기존 탐색을 연결한다. FactoryInfrastructure는 생산 바닥과 설비 사이 모듈 배치를 맡는다. StationModel은 받침/팔레트/단독 소재와 동적 상태 표시를 조합한다. ChassisAsset은 서버 단계별 파일/서버 치수 배율을 선택하고 PartModel은 기존 목표 위치 보간/선택/품질 전달을 맡는다. App.tsx나 서버 생산 로직으로 모델 책임을 옮기지 않았다. 작성 완료·사용자 확인 대기이며 FACTORY_WORLD_ASSETS.md를 따른다.

## 2026-10-11 — UI 공통 요소와 기능별 표현

components/Icon은 의존성 없는 장식용 SVG 아이콘이며 접근 가능한 이름은 버튼의 텍스트/aria-label이 담당한다. Button은 default/primary/danger/ai 표현, Panel은 공통 내용 구조를 제공한다. 공통 토큰은 styles/tokens.css에 유지하고 기능별 CSS Modules에서 배치/상태를 정의한다.

SimulationHud는 activePanel을 받아 실제 열린 창의 메뉴 선택을 표시하고 같은 메뉴를 누르면 닫는다. SceneDrawer의 기존 제목 초점/복귀 수명은 유지한다. StationMarker는 기존 StationModel에서 표지 JSX만 분리한 표현 컴포넌트다. 서버 상태/진행률 props만 받아 표시하며 생산을 제어하지 않는다.

StationDetails는 주요 수치를 먼저 표시하고 기존 상세 자료를 details로 제공한다. ProductionControls의 1/20개 선택 버튼은 기존 로컬 selection과 비활성 조건을 유지한다. PartDetails/GuidedExperience의 단계 UI는 기존 단계 값을 사용한다. SceneAgentPanel은 기존 요청 훅/근거/비용 내용을 유지하고 구성만 변경한다. 이력 선택·필터·조회 훅/백엔드는 그대로다. 작성 완료·사용자 확인 대기, UI_REDESIGN.md 참고.

## 2026-10-11 — 완성형 공장 시각 구성

scene/factoryCampus.ts가 구역 데이터/좌표/모델/시점 범위/설비 설명을 관리한다. spatialNavigation의 FactoryZoneKind와 forecast 계획 위치를 통해 카메라/지도/드로어를 연결한다. FactoryEnvironment는 정적 모델만 배치하고 차체 생산 위치/상태는 기존 FactoryScene/PartModel에서 유지한다. features/factory/components의 CampusMenu와 FutureZoneDetails는 지도/예정 기능 안내를 담당하며 서버 호출을 하지 않는다. ImmersiveViewport의2D 목록도 같은 구역 데이터를 사용한다. WorldAssetName에 새8종을 추가했다. 실제 운행/예측 엔진은 후속 범위다.
