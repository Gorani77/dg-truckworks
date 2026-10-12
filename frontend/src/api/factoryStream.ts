import type { FactoryState, ProductionEvent } from './factory'
import { apiUrl } from './url'

type FactoryFrame = {
  type: 'factory_state'
  protocol_version: 1
  state: FactoryState
  events: ProductionEvent[]
}
type Heartbeat = { type: 'heartbeat'; protocol_version: 1 }

export function factoryStreamUrl() {
  const url = apiUrl('/api/factory/stream')
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export function readFactoryFrame(data: string): FactoryFrame | Heartbeat {
  const value = JSON.parse(data)
  if (value?.protocol_version !== 1) throw new Error('지원하지 않는 실시간 메시지입니다.')
  if (value.type === 'heartbeat') return value as Heartbeat
  if (value.type !== 'factory_state' || typeof value.state?.run_id !== 'string'
    || !Number.isInteger(value.state.state_version)
    || !Number.isInteger(value.state.last_event_sequence)
    || !Array.isArray(value.state.stations) || !Array.isArray(value.events)) {
    throw new Error('공장 실시간 메시지 형식이 올바르지 않습니다.')
  }
  return value as FactoryFrame
}
