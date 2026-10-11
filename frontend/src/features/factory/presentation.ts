import type { StationState } from '../../api/factory'
import type { StationDefinition } from './types'

export const runStatusLabels = { READY: '시작 대기', RUNNING: '생산 중', PAUSED: '일시정지', COMPLETED: '생산 완료' }
export const partStageLabels = { RAW: '소재', FRAME: '구멍 없는 프레임', DRILLED: '구멍 가공 차체' }
export const qualityLabels = { UNINSPECTED: '검사 전', GOOD: '양품', REJECTED: '불량' }
export const stationStatusLabels = {
  IDLE: '대기', PROCESSING: '처리 중', STARVED: '소재 부족', BLOCKED: '출력 대기', FAULTED: '고장',
}

export function stationDefinition(state: StationState): StationDefinition {
  const definition = state.definition
  return {
    id: definition.id, name: definition.name,
    processSeconds: definition.process_seconds, capacity: definition.capacity,
    inputBufferCapacity: definition.input_buffer_capacity,
    description: definition.description, input: definition.input, output: definition.output,
  }
}
