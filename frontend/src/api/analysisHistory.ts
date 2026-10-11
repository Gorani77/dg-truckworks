import type { AgentAnswer, ToolResult } from './analysis'
import { visitorFetch } from './session'

export type AnalysisUsage = {
  model_calls: number; reported_calls: number; input_tokens: number; cached_input_tokens: number
  output_tokens: number; usage_complete: boolean; estimated_cost_usd: number | null
}
export type AnalysisSummary = {
  analysis_id: string; run_id: string; created_at: string; finished_at: string | null
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'STALE' | 'CANCELLED'
  question: string; model: string; state_version: number; usage: AnalysisUsage
  error: string | null; elapsed_seconds: number
}
export type AnalysisHistory = AnalysisSummary & {
  last_event_sequence: number; simulation_time_seconds: number; selected_station_id: string | null
  result: AgentAnswer | null
  tools: { tool_name: string; result: ToolResult | null; error: string | null }[]
}
export type AnalysisStorage = { history_enabled: boolean; history_pending: number; history_error: string | null }

async function read<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await visitorFetch(`/api/analysis${path}`, {
    headers: { Accept: 'application/json' }, cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  })
  if (!response.ok) throw new Error(response.status === 404 ? '저장된 분석이 없습니다. 저장 대기도 확인하세요.'
    : '분석 이력을 읽지 못했습니다. DB 설정·연결·마이그레이션을 확인하세요.')
  return response.json() as Promise<T>
}
export const getAnalysisStorage = (signal: AbortSignal) => read<AnalysisStorage>('/status', signal)
export const getAnalysisHistory = (runId: string | null, offset: number, signal: AbortSignal) => {
  const params = new URLSearchParams({ limit: '20', offset: String(offset) })
  if (runId) params.set('run_id', runId)
  return read<AnalysisSummary[]>(`/history?${params}`, signal)
}
export const getAnalysisDetail = (id: string, signal: AbortSignal) => read<AnalysisHistory>(`/history/${encodeURIComponent(id)}`, signal)
