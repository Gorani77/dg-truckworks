import type { FactoryState, PartState, ProductionEvent } from './factory'
import { visitorFetch } from './session'

export type StorageStatus = { enabled: boolean; pending_runs: number; error: string | null }
export type RunSummary = {
  run_id: string; created_at: string; updated_at: string; scenario: FactoryState['scenario']
  run_status: FactoryState['run_status']; closed_reason: string | null
  simulation_time_seconds: number; counts: FactoryState['counts']; last_event_sequence: number
}
export type RunHistory = {
  run_id: string; created_at: string; updated_at: string; closed_reason: string | null; snapshot: FactoryState
}

export function partsForSavedState(state: FactoryState): PartState[] {
  if (state.parts.length) return state.parts
  if (state.part) return [state.part]
  const station = state.stations.find((item) => item.current_part_id)
  if (!station?.current_part_id) return []
  return [{ id: station.current_part_id, production_number: 1, stage: 'RAW', quality: 'UNINSPECTED',
    phase: station.status === 'BLOCKED' || station.status_before_fault === 'BLOCKED' ? 'BLOCKED' : 'PROCESSING',
    station_id: station.definition.id, storage_location: null }]
}

async function get<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await visitorFetch(`/api/history${path}`, {
    cache: 'no-store', headers: { Accept: 'application/json' },
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  })
  if (!response.ok) throw new Error(response.status === 503
    ? 'DB 이력을 조회할 수 없습니다. DB 연결·마이그레이션을 확인하세요.'
    : response.status === 404 ? '아직 저장되지 않았거나 존재하지 않는 실행입니다.' : `이력 조회 실패 (${response.status})`)
  return response.json() as Promise<T>
}

export const getStorageStatus = (signal: AbortSignal) => get<StorageStatus>('/status', signal)
export const getRunHistoryList = (offset: number, signal: AbortSignal) => get<RunSummary[]>(`/runs?limit=20&offset=${offset}`, signal)
export const getRunHistory = (runId: string, signal: AbortSignal) => get<RunHistory>(`/runs/${runId}`, signal)
export const getPartHistory = (runId: string, signal: AbortSignal) => get<PartState[]>(`/runs/${runId}/parts`, signal)
export const getEventHistory = (runId: string, after: number, partId: string | null, signal: AbortSignal) =>
  get<ProductionEvent[]>(`/runs/${runId}/events?limit=100&after_sequence=${after}${partId ? `&part_id=${partId}` : ''}`, signal)
