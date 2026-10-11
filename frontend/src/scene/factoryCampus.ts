import type { FactoryZoneKind } from './spatialNavigation'
import type { WorldAssetName } from './assets/WorldAsset'

export type FactoryZone = {
  id: FactoryZoneKind; number: string; title: string; model?: WorldAssetName
  position: [number, number, number]; span: number; footprint: [number, number]
  description: string; equipment: readonly string[]; action: string
}

export const factoryZones: readonly FactoryZone[] = [
  { id: 'storage', number: '01', title: '입고·소재 보관', model: 'storage-racks', position: [-24, 0, -16], span: 20, footprint: [10, 6], description: '소재와 외부 공급 부품을 받아 생산으로 연결하는 입구입니다. 선반과 운반 카트는 전시 모형이며 실제 재고와 대응하지 않습니다.', equipment: ['소재 랙', '부품 입고 구역', '운반 카트'], action: '입고·재고 관리' },
  { id: 'line', number: '02', title: '차체 생산라인', position: [0, 0, 0], span: 29, footprint: [23, 11], description: '현재 생산·고장·복구·AI 분석을 사용할 수 있는 차체 가공 라인입니다.', equipment: ['소재 투입', '형상 가공', '구멍 가공', '품질 검사', '분리·적재'], action: '차체 생산' },
  { id: 'axle', number: '03', title: '차축·휠 부분조립', model: 'axle-cell', position: [-24, 0, 1], span: 25, footprint: [18, 12], description: '외부 공급 차축과 바퀴를 지그에 고정하고 결합하는 부분조립 구역입니다. 별도 타이어 제조 공정은 가정하지 않습니다.', equipment: ['휠 공급 랙', '차축 정렬 지그', '압입·체결 갠트리', '제어반'], action: '부분조립 시작' },
  { id: 'cab', number: '04', title: '운전석 마감', model: 'cab-finishing', position: [0, 0, -19], span: 25, footprint: [18, 12], description: '공급된 운전석의 표면 마감과 부속 장착을 위한 공간입니다. 마감 부스와 작업 조명, 작업대와 로봇을 정적 모형으로 배치했습니다.', equipment: ['마감 부스·집진 장치', '마감 로봇', '부속 장착 작업대', '제어반'], action: '운전석 마감 시작' },
  { id: 'assembly', number: '05', title: '트럭 최종조립', model: 'final-assembly', position: [24, 0, -19], span: 27, footprint: [20, 12], description: '차체와 차축·바퀴·운전석을 완성 트럭으로 결합할 구역입니다. 미완성 프레임과 완성 외형을 나란히 전시합니다.', equipment: ['차체 리프트', '운전석 장착 갠트리', '체결 로봇', '공구 캐비닛', '완성 트럭 전시'], action: '최종조립 시작' },
  { id: 'trailer', number: '06', title: '트레일러 제작', model: 'trailer-cell', position: [24, 0, -1], span: 27, footprint: [20, 12], description: '트레일러의 프레임과 적재함을 조립할 후속 생산 공간입니다. 프레임 지그와 적재함 체결 단계를 모형으로 구분했습니다.', equipment: ['프레임 지그', '차축·랜딩기어', '적재함 조립대', '체결 로봇'], action: '트레일러 생산 시작' },
  { id: 'inspection', number: '07', title: '완성차 검사', model: 'vehicle-inspection', position: [24, 0, 18], span: 25, footprint: [18, 12], description: '완성 차량의 외관과 기능을 확인할 출하 전 검사 구역입니다. 검사 포털과 롤러는 시각 모형이며 측정이나 합격 판정은 실행되지 않습니다.', equipment: ['조명 검사 포털', '휠·제동 롤러', '광학 센서', '검사 제어반'], action: '완성차 검사 시작' },
  { id: 'dispatch', number: '08', title: '완성차 출하', model: 'dispatch-yard', position: [0, 0, 19], span: 27, footprint: [20, 12], description: '검사를 마친 트럭과 출하 물품을 배치할 구역입니다. 차량과 포장 상자는 장면 구성용이며 실제 생산 수량이나 주문을 뜻하지 않습니다.', equipment: ['완성차 대기 베이', '출하 도크', '포장 상자', '출하 제어반'], action: '출하 계획 실행' },
  { id: 'driving', number: '09', title: '주행 시험장', model: 'proving-ground', position: [-24, 0, 24], span: 33, footprint: [24, 22], description: '향후 완성 트럭을 운행할 시험 공간입니다. 트랙·차선·연석·관측실과 차량 모형을 먼저 구성했습니다. 물리·경로 주행은 아직 구현하지 않았습니다.', equipment: ['순환 주행로', '출발선', '연석·콘 구간', '관측실', '전시 차량'], action: '운행 시뮬레이션 시작' },
]

export function getFactoryZone(kind: string) {
  return factoryZones.find(zone => zone.id === (kind === 'forecast' ? 'driving' : kind))
}
