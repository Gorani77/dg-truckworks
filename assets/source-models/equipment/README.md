# 나머지 네 공정 Blender 자산

2026-10-11. ST-02의 재질·bevel·좌표 규칙을 이어받은 자체 제작 설비다. 사용자 외형 피드백 후 확장을 승인받았다. Blender 파일 생성/GLB 내보내기는 수행했고 렌더·앱 테스트·시각 검증은 수행하지 않았다.

| 설비 | 폴더/파일 이름 | 가동 노드 |
|---|---|---|
| ST-01 소재 투입 | input-feeder | FeedLift |
| ST-03 구멍 가공 | drilling-station | DrillHead, DrillClampFront, DrillClampBack |
| ST-04 품질 검사 | inspection-gate | Scanner, InspectionSweep |
| ST-05 분리/적재 | sorting-storage | Diverter |

편집 원본은 각 하위 폴더의 동일 이름 `.blend`, 웹용은 `frontend/public/models/<이름>/<이름>.glb`다. 원본에는 개별 부품을 남기고 웹용은 재질/가동 부모별로 합친다. 공통 `Status_Lens` 재질은 상태등에 사용한다. 생산품과 재고를 모델에 내장하지 않는다.

`common.py`는 기존 forming-cell 제작 함수와 재질을 재사용한 Blender 제작 모듈이다. `create_equipment.py`에 설비별 외형을 둔다. ST-02 원본/생성 코드는 수정하지 않았다. 스크립트 재실행은 해당 설비의 원본/GLB를 다시 작성하므로 수동 편집본은 별도 저장한다.

재생성 예시(PowerShell):

```powershell
& 'C:\Users\sp287\.codex\tools\blender\blender-4.5.3-windows-x64\blender.exe' --background --factory-startup --python-exit-code 1 --python 'C:\project\truckworks\assets\source-models\equipment\create_equipment.py' -- input-feeder
```

마지막 인자를 표의 이름으로 바꾸면 다른 설비를 생성한다. 이 작업은 자산 제작이며 앱 실행 검증이 아니다. Blender 단위 스케일1, 앱 기준 X 가로/Y 높이/Z 정면을 유지하고 소재 바닥 y=.91, 중심 z=.45를 사용한다. 지그/흡착/드릴/검사/분기 동작은 시각 표현이며 실제 물리·안전 설비를 재현하지 않는다. 검사기는 실제 비전 AI가 아니다.

연결 코드는 `scene/equipment/EquipmentAsset.tsx`와 `equipmentMotion.ts`, 사용자 절차는 `docs/EQUIPMENT_ASSETS.md`, 중단 후 진행 상태는 `docs/MODELING_CHECKPOINT.md`에 있다.
