export type FactoryZoneKind = 'line' | 'storage' | 'axle' | 'cab' | 'assembly' | 'trailer' | 'inspection' | 'dispatch' | 'driving'
export type SpatialFocus =
  | { kind: 'overview' | FactoryZoneKind | 'forecast' }
  | { kind: 'station' | 'part'; id: string }

export const zoneLabels = {
  overview: '공장 전체', line: '차체 생산라인', storage: '입고·소재 보관', axle: '차축·휠 부분조립',
  cab: '운전석 마감', assembly: '트럭 최종조립', trailer: '트레일러 제작', inspection: '완성차 검사',
  dispatch: '완성차 출하', driving: '주행 시험장', forecast: '운행 전 AI 예측 · 구현 예정',
}

export function isZoneKind(value: string): value is FactoryZoneKind {
  return ['line', 'storage', 'axle', 'cab', 'assembly', 'trailer', 'inspection', 'dispatch', 'driving'].includes(value)
}
