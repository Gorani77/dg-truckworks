import type { FactoryState, PartState, ProductionEvent, StationState } from './factory'
import { visitorFetch } from './session'

export type ToolName = 'get_factory_state' | 'get_station_status' | 'get_recent_events' | 'get_buffer_status' | 'get_part_history'
export type AgentAnswer = {
  analysis_id: string; model: string; run_id: string; state_version: number; simulation_time_seconds: number
  answer: { answer: string; uncertainty: string; evidence_event_sequences: number[]; related_station_ids: string[] }
  tools: { tool_name: string; result: ToolResult | null; error: string | null }[]
  input_tokens: number; cached_input_tokens: number; output_tokens: number
  estimated_cost_usd: number | null; elapsed_seconds: number; model_calls: number
}
type EventData = { events: ProductionEvent[]; matched_count: number; truncated: boolean }
type BufferData = {
  material_remaining: number
  limitation: string
  stations: { station_id: string; status: string; input_capacity: number; queued_part_ids: string[];
    reserved_part_ids: string[]; available_input_slots: number; current_part_id: string | null }[]
}
export type ToolResult = {
  tool_name: ToolName
  source: 'live_memory'
  observed_at: string
  run_id: string
  state_version: number
  last_event_sequence: number
  simulation_time_seconds: number
  data: FactoryState | StationState | BufferData | EventData | (EventData & { part_id: string; part: PartState | null; limitation: string })
}

export async function getAnalysisTool(name: ToolName, runId: string, stationId: string | null,
  partId: string | null, signal: AbortSignal): Promise<ToolResult> {
  const params = new URLSearchParams({ expected_run_id: runId, limit: '20' })
  if (stationId) params.set('station_id', stationId)
  if (partId) params.set('part_id', partId)
  const response = await visitorFetch(`/api/analysis/tools/${name}?${params}`, {
    cache: 'no-store', headers: { Accept: 'application/json' },
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('실행이 바뀌었습니다. 현재 상태가 갱신된 뒤 다시 조회하세요.')
    if (response.status === 404) throw new Error('현재 실행에 해당 설비나 부품이 없습니다.')
    throw new Error(`조회하지 못했습니다 (${response.status}). 선택 항목과 서버 연결을 확인하세요.`)
  }
  return response.json() as Promise<ToolResult>
}
