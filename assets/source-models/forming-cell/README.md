# ST-02 형상 가공기 원본

2026-10-11. TruckWorks용으로 자체 제작한 산업용 디오라마 모델이다. 특정 제조사 장비·정밀 CNC·실제 절삭 물리의 복제품이 아니다. 정면 절개와 측면 안전창은 생산 과정의 가시성을 위한 표현이다.

## 파일

- `create_forming_cell.py`: Blender Python 제작/내보내기 스크립트. 부품을 만들고 bevel/weighted normals를 적용한다. 원본을 먼저 저장한 뒤 가동 부모·재질별로 메시를 합쳐 웹 모델을 내보낸다.
- `forming-cell.blend`: 합치기 전의 개별 부품과 가동 계층을 보존한 편집 원본. 이 파일에 직접 편집한 내용은 생성 스크립트를 다시 실행하면 덮어쓰므로 별도 파일로 저장한다.
- `../../../frontend/public/models/forming-cell/forming-cell.glb`: 앱 배포용 파일. 외부 텍스처·HDR·압축 디코더가 필요 없는 GLB다.

Blender4.5.3 포터블의 백그라운드 실행으로 원본 저장/GLB 내보내기를 수행했다. 렌더·화면 확인·성능 측정·앱 빌드/테스트는 하지 않았다. 파일 생성 성공은 최종 시각 품질 확인을 뜻하지 않는다.

## 재생성

이번 작업의 Blender 도구는 프로젝트 외부 `C:\Users\sp287\.codex\tools\blender\blender-4.5.3-windows-x64\blender.exe`에 있다. [공식 배포 디렉터리](https://download.blender.org/release/Blender4.5/)의4.5.3 Windows x64 ZIP을 사용했다. 시스템 설치/파일 연결을 변경하지 않았다.

사용자가 원할 때 PowerShell에서:

```powershell
& 'C:\Users\sp287\.codex\tools\blender\blender-4.5.3-windows-x64\blender.exe' --background --factory-startup --python 'C:\project\truckworks\assets\source-models\forming-cell\create_forming_cell.py'
```

이 명령은 Blender 생성 작업이며 기존 두 산출물을 다시 작성한다. 앱을 실행하거나 테스트하지 않는다. 다른 컴퓨터는 Blender 실행 경로를 바꾼다. 웹 앱 이용자는 Blender가 필요하지 않다.

## 좌표와 가동 계약

스크립트의 설계 좌표는 앱과 같은 X 가로/Y 높이/Z 정면이다. bpy에는 `(x,-z,y)`로 변환하고 glTF Y-up으로 내보낸다. 파일 단위 스케일은1로 유지한다. 앱의1단위=100mm는 모형 표시 기준이며 설비 실측 치수를 뜻하지 않는다. 생산품 바닥은 기존 y=0.91, 컨베이어 중심은 z=0.45다.

| GLB 노드 | 런타임 변경 | 역할 |
|---|---|---|
| CarriageX | 기준 위치 대비 X 이동 | 가로 공구 이동 |
| SpindleSlide | 기준 위치 대비 Y 하강 | 공구 접근/복귀, CarriageX 자식 |
| ClampFront | 기준 위치 대비 -Z 이동 | 정면 지그 고정/해제 |
| ClampBack | 기준 위치 대비 +Z 이동 | 후면 지그 고정/해제 |

`Status_Lens` 재질은 수신 상태에 따라 앱에서 색/발광을 바꾼다. 이 이름들과 계층은 재작업 시 유지해야 한다. 모델에 생산품을 포함하지 않으며 기존 PartModel이 실제 수신 부품을 표시한다. 가동 애니메이션 클립은 내보내지 않는다. `formingCellMotion.ts`가 서버 진행률에 대응하는 동작을 결정한다.

## 재질과 외형

도장 금속·주물 베이스·가공 금속·고무·안전창·표지·작업등 재질을 구분한다. 레벨링 풋, T슬롯 테이블, 분할 외장, 안전창 프레임과 체결부, 레일/캐리지/스핀들, 지그, 배선, 환기구, 정적인 제어판 표기와 비상정지 버튼을 포함한다. 장식 제어판은 별도의 실제 조작 UI가 아니며 숫자/성능값을 만들어 표시하지 않는다.

사용자 확인은 `docs/FORMING_CELL_ASSET.md`를 따른다.
