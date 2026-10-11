import { visitorFetch } from './session'

export type StationState = {
  definition: {
    id: string
    name: string
    process_seconds: number
    capacity: number
    input_buffer_capacity: number
    description: string
    input: string
    output: string
  }
  status: 'IDLE' | 'PROCESSING' | 'STARVED' | 'BLOCKED' | 'FAULTED'
  current_part_id: string | null
  queued_part_ids: string[]
  remaining_process_seconds: number
  reserved_part_ids: string[]
  status_before_fault: StationState['status'] | null
}

export type PartState = {
  id: string
  stage: 'RAW' | 'FRAME' | 'DRILLED'
  phase: 'PROCESSING' | 'TRANSFERRING' | 'QUEUED' | 'BLOCKED' | 'STORED'
  quality: 'UNINSPECTED' | 'GOOD' | 'REJECTED'
  station_id: string | null
  storage_location: 'GOOD_STORAGE' | 'REJECTED_STORAGE' | null
  production_number: number
}

export type TransferState = {
  part_id: string
  from_station_id: string
  to_station_id: string
  started_at_seconds: number
  duration_seconds: number
  progress: number
}

export type FactoryState = {
  schema_version: string
  model_version: string
  run_id: string
  run_status: 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  can_resume: boolean
  scenario: 'single_station' | 'single_part' | 'batch'
  part: PartState | null
  transfer: TransferState | null
  parts: PartState[]
  transfers: TransferState[]
  state_version: number
  last_event_sequence: number
  simulation_time_seconds: number
  material_remaining: number
  counts: {
    good_count: number
    rejected_count: number
    in_process_count: number
    waiting_count: number
  }
  configuration: {
    initial_material_count: number
    random_seed: number
    defect_probability: number
    chassis_dimensions_mm: { length: number; width: number; height: number }
  }
  stations: StationState[]
}

export type ProductionEvent = {
  run_id: string
  sequence: number
  simulation_time_seconds: number
  station_id: string
  part_id: string | null
  kind: string
  message: string
  occurred_at: string
}

async function request<T>(path: string, signal: AbortSignal, body?: unknown): Promise<T> {
  const response = await visitorFetch(`/api/factory${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? { Accept: 'application/json' } : {
      Accept: 'application/json', 'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    cache: 'no-store',
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('현재 상태에서 실행할 수 없거나 실행 ID가 바뀌었습니다. 갱신된 상태를 확인하세요.')
    throw new Error(`API 요청에 실패했습니다 (${response.status}).`)
  }
  return response.json() as Promise<T>
}

export const getFactoryState = (signal: AbortSignal) => request<FactoryState>('/state', signal)
export const getFactoryEvents = (signal: AbortSignal) => request<ProductionEvent[]>('/events', signal)
export const startSingleStation = (runId: string, signal: AbortSignal) =>
  request<FactoryState>('/single-station/start', signal, { expected_run_id: runId })
export const startSinglePart = (runId: string, signal: AbortSignal) =>
  request<FactoryState>('/single-part/start', signal, { expected_run_id: runId })
export const startBatch = (runId: string, signal: AbortSignal) =>
  request<FactoryState>('/batch/start', signal, { expected_run_id: runId })
export const pauseFactory = (runId: string, signal: AbortSignal) =>
  request<FactoryState>('/pause', signal, { expected_run_id: runId })
export const resumeFactory = (runId: string, signal: AbortSignal) =>
  request<FactoryState>('/resume', signal, { expected_run_id: runId })
export const resetFactory = (runId: string, signal: AbortSignal) =>
  request<FactoryState>('/reset', signal, { expected_run_id: runId })
export const faultStation = (runId: string, stationId: string, signal: AbortSignal) =>
  request<FactoryState>(`/stations/${encodeURIComponent(stationId)}/fault`, signal, { expected_run_id: runId })
export const repairStation = (runId: string, stationId: string, signal: AbortSignal) =>
  request<FactoryState>(`/stations/${encodeURIComponent(stationId)}/repair`, signal, { expected_run_id: runId })
