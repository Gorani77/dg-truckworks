"""Approved chassis-line settings, not measurements from a real factory."""

from truckworks.domain.models import (
    ChassisDimensions,
    ProductionConfig,
    StationDefinition,
)

LINE_ID = "LINE-01"
MODEL_VERSION = "chassis-line-v2"

PRODUCTION_CONFIG = ProductionConfig(
    initial_material_count=20,
    defect_probability=0.05,
    random_seed=42,
    good_storage_capacity=20,
    rejected_storage_capacity=20,
    chassis_dimensions_mm=ChassisDimensions(length=180, width=60, height=12),
)

STATIONS = (
    StationDefinition(
        id="ST-01", name="소재 투입", process_seconds=2,
        capacity=1, input_buffer_capacity=3,
        description="소재를 운반대에 올려 생산라인에 투입합니다.",
        input="소재 재고", output="투입된 소재",
    ),
    StationDefinition(
        id="ST-02", name="형상 가공", process_seconds=8,
        capacity=1, input_buffer_capacity=3,
        description="두 줄의 프레임과 가로 연결부 형태로 소재를 가공합니다.",
        input="투입된 소재", output="구멍 없는 프레임",
    ),
    StationDefinition(
        id="ST-03", name="구멍 가공", process_seconds=6,
        capacity=1, input_buffer_capacity=3,
        description="차축 결합 구멍과 운전석 장착부를 가공합니다.",
        input="구멍 없는 프레임", output="검사 전 차체",
    ),
    StationDefinition(
        id="ST-04", name="품질 검사", process_seconds=4,
        capacity=1, input_buffer_capacity=3,
        description="차체의 품질을 판정하고 양품과 불량품을 구분합니다.",
        input="검사 전 차체", output="품질 판정 차체",
    ),
    StationDefinition(
        id="ST-05", name="분리·적재", process_seconds=2,
        capacity=1, input_buffer_capacity=3,
        description="검사 결과에 따라 양품과 불량품을 각각 보관합니다.",
        input="품질 판정 차체", output="양품 / 불량 보관",
    ),
)
