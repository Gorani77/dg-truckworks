# Blender 설비 확장 이어가기

2026-10-11 (Asia/Seoul). 사용자가 ST-02의 시각 품질에 긍정적인 피드백을 주고 나머지 네 설비 제작을 승인했다. 이는 모든 가동/오류 검증 완료를 뜻하지 않는다.

## 확정 범위

ST-01 소재 투입, ST-03 구멍 가공, ST-04 품질 검사, ST-05 분리/적재를 같은 재질·모서리·부품 밀도의 Blender 자산으로 만든다. 기존 생산품 위치와 서버 진행률·품질 판정을 유지한다. 테스트·빌드·렌더·브라우저 검증은 사용자 담당이다. ST-02 원본과 모델은 유지한다.

## 체크포인트

| 단계 | 상태 |
|---|---|
| 사용자 ST-02 외형 피드백/네 설비 확장 승인 기록 | 작성 완료 |
| 네 설비 제작 스크립트와 공통 제작 함수 | 작성 완료: assets/source-models/equipment/common.py·create_equipment.py |
| 네 설비 .blend/.glb 생성 | 4개 모두 생성 프로세스 성공, 아래 개별 체크포인트 참조 |
| 공통 GLB 로드·가동 및 기존 장면 연결 | EquipmentAsset·equipmentMotion·ProcessEquipment·StationModel·FactoryScene 작성 완료 |
| 사용자 안내·계획·진행·학습 기록 마무리 | 작성 완료: EQUIPMENT_ASSETS·계획·진행·학습33단계 |
| 사용자 시각/가동 확인 | 대기 |

## 중단 후 이어가기

현재 구현 작업은 네 설비의 원본/GLB 생성 및 런타임 연결까지 작성 완료다. 남은 단계는 사용자의 시각/가동 확인과 결과 반영이다. 테스트·빌드·린트·렌더·브라우저 확인은 수행하지 않았다. 모델을 처음부터 재생성할 필요는 없다.

이 문서와 PROJECT_PLAN.md, docs/PROGRESS.md를 읽고 마지막 생성 로그/작성 파일을 기준으로 재개한다. 저장된 코드를 임의로 초기화하지 않는다. 생성/내보내기와 사용자 검증을 구분한다. 작업이 중단된 실행 프로세스의 완료 여부는 보장하지 않는다. 다음 채팅 요청 예: “MODELING_CHECKPOINT.md 기준으로 나머지 Blender 설비 작업 이어서 진행해줘.”

Blender: `C:\Users\sp287\.codex\tools\blender\blender-4.5.3-windows-x64\blender.exe`. 모델 생성은 허용된 제작 작업이며 앱 테스트가 아니다. 기본 재질/좌표 기준은 assets/source-models/forming-cell/create_forming_cell.py를 참고한다.

- 생성 체크포인트: input-feeder 원본 저장/GLB 내보내기 프로세스 성공. 프론트 연결/사용자 검증과는 별도.

- 생성 체크포인트: drilling-station 원본 저장/GLB 내보내기 프로세스 성공. 프론트 연결/사용자 검증과는 별도.

- 생성 체크포인트: inspection-gate 원본 저장/GLB 내보내기 프로세스 성공. 프론트 연결/사용자 검증과는 별도.

- 생성 체크포인트: sorting-storage 원본 저장/GLB 내보내기 프로세스 성공. 프론트 연결/사용자 검증과는 별도.

## 2026-10-11 — 공장 전체 Blender 확장 착수

사용자가 현재 공장 전체의 Blender 모델 전환을 승인했다. 설비 5종은 유지하고 건축/바닥/주변 시설, 선반, 전시 트럭, 컨베이어, 받침/대기 팔레트, 생산 차체 3단계를 제작한다. UI 표시와 서버 생산 규칙은 유지한다.
- 제작 스크립트: assets/source-models/factory-world/create_factory_world.py 작성.
- 다음: 자산 생성 → scene 연결 → 사용 안내·학습 기록. 테스트/빌드/렌더/브라우저 검증은 사용자 담당.
- 생성 완료: factory-hall.blend / factory-hall.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: storage-racks.blend / storage-racks.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: assembly-display.blend / assembly-display.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: line-deck.blend / line-deck.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: roller-conveyor.blend / roller-conveyor.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: station-plinth.blend / station-plinth.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: queue-pallet.blend / queue-pallet.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: chassis-raw.blend / chassis-raw.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: chassis-formed.blend / chassis-formed.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: chassis-drilled.blend / chassis-drilled.glb (Blender 저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).

## 최신 재개 지점 — 공장 전체 확장 작성 완료 (2026-10-11)

- [x] 사용자 전체 공장 Blender 모델 전환 승인.
- [x] factory-world 제작 스크립트·원본 설명 작성.
- [x] 새10종 .blend/GLB 생성. 위 자산별 저장·내보내기 프로세스 성공 기록 참고.
- [x] WorldAsset/ChassisAsset/FactoryInfrastructure·기존 장면 연결 코드 작성.
- [x] FACTORY_WORLD_ASSETS·계획·진행·학습34단계·디자인/구조·README 갱신.
- [ ] 사용자 시각/동작/성능 확인. 기존 미확인 기능도 유지.

현재 작업의 코드/자산 제작은 작성 완료다. 다음은 FACTORY_WORLD_ASSETS.md에 따른 사용자 피드백 반영이며 재생성이 필요하지 않다. 이어갈 때 이 최신 항목을 기준으로 읽는다. 생성한 모델을 Blender에서 수동 수정했다면 재생성 스크립트로 덮어쓰기 전에 그 변경을 보존한다. 테스트·빌드·린트·렌더·앱/브라우저 확인은 실행하지 않았다.

## 최신 재개 지점 — 전체 UI 개편 작성 완료 (2026-10-11)

사용자가 모델링 개선을 긍정적으로 평가하고 첨부 화면에 한정하지 않은 전체 UI 재디자인을 요청했다.
- [x] 공통 토큰/아이콘/버튼/패널, HUD·표지·생산/시점/AI 조작·정보창 코드 작성.
- [x] 상세/설정/차체 단계/AI 질문·근거/생산·분석 기록/이벤트/체험·소개/로딩·오류/2D 스타일 작성.
- [x] UI_REDESIGN·계획·진행·학습35단계·디자인/구조·README 기록 갱신.
- [ ] 사용자 UI 시각·기능·반응형·키보드 확인. 기존 미확인 항목 유지.

새 UI 코드 작성은 끝났으며 다음은 docs/UI_REDESIGN.md에 따른 사용자 피드백 반영이다. 모델 생성이나 서버 변경은 이번 UI 작업에 없었다. 테스트·빌드·린트·앱/브라우저 검증·촬영·AI 호출을 수행하지 않았다. 사용자 결과가 오기 전 검증 완료 체크를 하지 않는다.

## 최신 재개 지점 — 별도 포트폴리오 대표 사례 (2026-10-11)

- 대상: C:\Users\sp287\WebstormProjects\portfolio.
- [x] 홈/목록 대표 소개와 #projects/truckworks 경로 작성.
- [x] 전용 사례 페이지·설명4단계·구조3관점·설계 결정/현재 범위 작성.
- [x] 기존 GLB를 활용한 소개 PNG2종 제작. 실행 화면/검증 자료 아님.
- [x] 포트폴리오 docs/TRUCKWORKS_CASE_STUDY.md 및 양쪽 기록 갱신.
- [ ] 사용자 내용/화면/동작 확인. 테스트·빌드·린트·브라우저 확인은 실행하지 않음.

현재 작성 작업은 끝났고 다음은 포트폴리오 사용자의 직접 확인/피드백 반영이다. 사용자 한도 충전/계속 요청을 반영해 기록까지 마무리했다. 기존 모델/코드를 재생성할 필요는 없다. 공개 배포·새 GitHub 공개 링크·실제 데모 촬영은 수행하지 않았다.

## 최신 재개 지점 — 포트폴리오 전체 UI 개편 (2026-10-11)

- 대상: C:\Users\sp287\WebstormProjects\portfolio.
- [x] 실제 커뮤니티 의견·Pretendard/SUIT/Wanted Sans 공식 자료 조사.
- [x] 흰색 배경·잉크색·녹색 포인트/가변 Pretendard 유지, 공통 UI·홈·목록·소개·전체 상세·체험 스타일 작성.
- [x] 소개 모바일 선택 목록/상세 배치와 이동 코드 작성.
- [x] portfolio/docs/UI_REFINEMENT.md, TRUCKWORKS_CASE_STUDY.md 및 TruckWorks 계획/진행/학습37 기록 갱신.
- [ ] 사용자 화면·동작·반응형·키보드·빌드/린트 확인.

코드/문서 작성 완료. 테스트·빌드·린트·앱/서버 실행·브라우저 검증·배포는 수행하지 않았다. 다음은 UI_REFINEMENT.md 절차에 따른 사용자 피드백 반영이다. 공장 자산·생산 엔진의 새 변경은 없으며 모델을 다시 생성하지 않는다.

## 최신 재개 지점 — 대표 프로젝트 홈 / 이력 분리 (2026-10-11)

- 대상: C:\Users\sp287\WebstormProjects\portfolio.
- [x] 기존 홈 이력을 ResumePage와 #resume 메뉴로 이동.
- [x] HomePage 전용 대형 공장 소개/타이틀/세 관점 설명/사례 링크 작성.
- [x] HomeProjectFocus·homePerspectives·모바일 메뉴 배치 작성.
- [x] HOME_AND_RESUME.md·UI_REFINEMENT 및 계획/진행/학습38 기록 작성.
- [ ] 사용자 화면·동작·경로·반응형·키보드·빌드/린트 확인.

코드/문서 작성 완료, 다음은 사용자 피드백 반영. 테스트·빌드·린트·서버 실행·브라우저 검증·배포 미수행. 기존 자산을 다시 생성하지 않는다.

## 진행 중 — 완성형 공장 시각 구성 (2026-10-11)

사용자 요청으로 현재 공장 전체 틀을 최종 제품 흐름 기준 9개 구역으로 확장한다. 주행/운행 전 AI 예측은 향후 계획이며 지금은 모델·메뉴만 작성한다. assets/source-models/full-factory/create_full_factory.py 작성, 새 자산8종 생성과 화면 연결 진행 중. 개별 생성 완료는 이후 기록을 따른다. 기존 자산은 덮어쓰지 않는다.
- 생성 완료: campus-ground.blend / campus-ground.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: axle-cell.blend / axle-cell.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: cab-finishing.blend / cab-finishing.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: final-assembly.blend / final-assembly.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: trailer-cell.blend / trailer-cell.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: vehicle-inspection.blend / vehicle-inspection.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: dispatch-yard.blend / dispatch-yard.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).
- 생성 완료: proving-ground.blend / proving-ground.glb (저장·내보내기 프로세스 성공, 사용자 시각/동작 확인 대기).

## 최신 재개 지점 — 완성형 공장 시각 마스터플랜 (2026-10-11)

- [x] 사용자 요청: 모든 최종 흐름의 모델/메뉴 선행, 운행/AI 사전 예측은 향후 목표로 기록.
- [x] 새8종 Blender 원본/GLB 제작·저장·내보내기 성공. 위 개별 자산 기록 참고.
- [x] 9개 구역 데이터·WorldAsset 연결·환경·시점·조명·구역 표지 코드 작성.
- [x] 공장 지도/구역 선택/예정 기능 안내/AI 예측 계획/2D 목록 작성.
- [x] FULL_FACTORY_MASTERPLAN·제작 README·계획/진행/학습39·디자인/구조/자산 기록 갱신.
- [ ] 사용자 시각·동작·모바일·키보드·로드 실패·성능·빌드/린트 확인.

현재 자산과 코드 작성은 끝났으며 다음은 FULL_FACTORY_MASTERPLAN.md에 따른 사용자 피드백 반영이다. Blender 실행은 모델 제작만 수행했다. 테스트·빌드·린트·렌더·앱/서버 실행·브라우저 검증·배포는 하지 않았다. 기존 모델의 수동 편집을 덮어쓰지 말고 새8종도 재생성 전에 편집 여부를 사용자와 구분한다. 운행/예측 엔진은 아직 없다.

## 최신 후속 변경 — 마우스 조작 (2026-10-11)

SpatialCamera 좌드래그=화면 이동, 우드래그=회전과 관련 안내 작성 완료. 사용자 조작 확인 대기. 테스트·빌드·실행 검증 미수행. 자산 재생성 없음.

## 최신 후속 변경 — 소개 패널 제거·이름표 가로 정렬 (2026-10-11)

SimulationExperience의 첫 화면 소개를 제거하고 진행 중 체험 안내만 남겼다. FactoryEnvironment Html 및 campusMarker에 내용 너비/가로 쓰기/줄바꿈 금지/grid를 적용했다. 코드·기록 작성 완료, 사용자 시각/클릭 확인 대기. 테스트·빌드·실행 검증 미수행. 다음은 사용자 화면 피드백 반영이다.
