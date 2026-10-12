import { Panel } from '../../components/Panel'
import styles from './agent.module.css'
import { useState } from 'react'
import type { ToolName } from '../../api/analysis'
import { useAnalysisTools } from './useAnalysisTools'
import { AgentQuestion } from './AgentQuestion'

const tools: { name: ToolName; label: string }[] = [
  { name: 'get_factory_state', label: '공장 현황' },
  { name: 'get_station_status', label: '선택 설비 상태' },
  { name: 'get_recent_events', label: '선택 설비 최근 이벤트' },
  { name: 'get_buffer_status', label: '선택 설비 대기·예약' },
  { name: 'get_part_history', label: '선택 부품 이력' },
]

export function AgentPanel({ runId, stationId, partIds, onSelectStation, showQuestion = true }: { runId?: string; stationId?: string; partIds: string[]; onSelectStation: (id: string) => void; showQuestion?: boolean }) {
  const analysis = useAnalysisTools()
  const [partId, setPartId] = useState('')
  const selectedPart = partIds.includes(partId) ? partId : partIds[0] ?? ''
  const result = analysis.result
  const data = result?.data
  function query(name: ToolName) {
    if (!runId) return
    void analysis.query(name, runId,
      ['get_station_status', 'get_recent_events', 'get_buffer_status'].includes(name) ? stationId ?? null : null,
      name === 'get_part_history' ? selectedPart : null)
  }
  return (
    <Panel title="운영 분석" label="OpenAI · 읽기 전용">
      {showQuestion && <AgentQuestion runId={runId} stationId={stationId} onSelectStation={onSelectStation} />}
      <p className={styles.description}>현재 실행을 수동 조회합니다. {stationId ? `선택 설비: ${stationId}` : '조회 범위: 차체 생산라인 전체'}. 조회 결과는 표시된 시점의 자료이며 자동 갱신하지 않습니다.</p>
      <label className={styles.label} htmlFor="analysis-part">이력을 조회할 부품</label>
      <select className={styles.input} id="analysis-part" value={selectedPart} onChange={(event) => setPartId(event.target.value)} disabled={!partIds.length || analysis.loading}>
        {!partIds.length && <option value="">현재 부품 없음</option>}
        {partIds.map((id) => <option key={id} value={id}>{id}</option>)}
      </select>
      <div className={styles.questions}>
        {tools.filter((tool) => stationId || tool.name !== 'get_station_status').map((tool) => <button key={tool.name} onClick={() => query(tool.name)}
          disabled={!runId || analysis.loading || (tool.name === 'get_part_history' && !selectedPart)}>
          {stationId ? tool.label : tool.label.replace('선택 설비', '공장 전체')}</button>)}
      </div>
      {analysis.loading && <p role="status" className={styles.note}>자료 조회 중…</p>}
      {analysis.error && <p role="alert" className={styles.note}>{analysis.error} 조회 버튼으로 다시 시도하세요.</p>}
      {result && <div className={styles.result} aria-live="polite">
        <p>사용 도구: <code>{result.tool_name}</code></p>
        <p>조회: {new Date(result.observed_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
        <p>공장 시각 {result.simulation_time_seconds.toFixed(1)}초 · 상태 버전 {result.state_version} · 마지막 이벤트 #{result.last_event_sequence}</p>
        <p className={styles.note}>실행 {result.run_id} · 현재 서버 메모리</p>
        {data && 'status' in data && <p>설비 상태: {data.status} · 잔여 가공 {data.remaining_process_seconds.toFixed(1)}초</p>}
        {data && 'run_status' in data && <p>실행 상태: {data.run_status} · 양품 {data.counts.good_count} · 불량 {data.counts.rejected_count}</p>}
        {data && 'limitation' in data && <p className={styles.note}>{data.limitation}</p>}
        {data && 'stations' in data && !('run_status' in data) && data.stations.map((station) =>
          <p key={station.station_id}>{station.station_id}: 입력 대기 {station.queued_part_ids.length} · 예약 {station.reserved_part_ids.length} · 빈 자리 {station.available_input_slots}/{station.input_capacity}</p>)}
        {data && 'events' in data && <>
          <p>일치 {data.matched_count}개 · 최근 {data.events.length}개{data.truncated ? ' (이전 이벤트 생략)' : ''}</p>
          <ol className={styles.events}>{data.events.map((event) => <li key={event.sequence}>#{event.sequence} · {event.simulation_time_seconds.toFixed(1)}초 · {event.station_id} · {event.message}</li>)}</ol>
        </>}
        <details><summary>조회한 전체 자료</summary><pre>{JSON.stringify(result.data, null, 2)}</pre></details>
      </div>}
      <p className={styles.note}>수동 도구 조회는 OpenAI API를 호출하지 않습니다.</p>
    </Panel>
  )
}

