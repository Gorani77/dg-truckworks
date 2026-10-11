import type { StationDefinition } from '../types'

// Model settings, not live production data. Keep server state separate.
const stations: readonly StationDefinition[] = [
  {
    id: 'ST-01', name: '소재 투입', processSeconds: 2, capacity: 1, inputBufferCapacity: 3,
    description: '소재를 운반대에 올려 생산라인에 투입합니다.',
    input: '소재 재고', output: '투입된 소재',
  },
  {
    id: 'ST-02', name: '형상 가공', processSeconds: 8, capacity: 1, inputBufferCapacity: 3,
    description: '두 줄의 프레임과 가로 연결부 형태로 소재를 가공합니다.',
    input: '투입된 소재', output: '구멍 없는 프레임',
  },
  {
    id: 'ST-03', name: '구멍 가공', processSeconds: 6, capacity: 1, inputBufferCapacity: 3,
    description: '차축 결합 구멍과 운전석 장착부를 가공합니다.',
    input: '구멍 없는 프레임', output: '검사 전 차체',
  },
  {
    id: 'ST-04', name: '품질 검사', processSeconds: 4, capacity: 1, inputBufferCapacity: 3,
    description: '차체의 품질을 판정하고 양품과 불량품을 구분합니다.',
    input: '검사 전 차체', output: '품질 판정 차체',
  },
  {
    id: 'ST-05', name: '분리·적재', processSeconds: 2, capacity: 1, inputBufferCapacity: 3,
    description: '검사 결과에 따라 양품과 불량품을 각각 보관합니다.',
    input: '품질 판정 차체', output: '양품 / 불량 보관',
  },
]

export const chassisLine = {
  id: 'LINE-01',
  materialCount: 20,
  chassisDimensionsMm: { length: 180, width: 60, height: 12 },
  stations,
}

