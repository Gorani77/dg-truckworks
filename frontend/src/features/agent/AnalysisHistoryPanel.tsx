import { useState } from 'react'
import { Panel } from '../../components/Panel'
import { Button } from '../../components/Button'
import { useAnalysisHistory } from './useAnalysisHistory'
import type { AnalysisSummary, AnalysisUsage } from '../../api/analysisHistory'
import styles from './agent.module.css'

const statuses: Record<AnalysisSummary['status'], string> = {
  RUNNING: '완료 정보 없음', SUCCEEDED: '성공', FAILED: '실패', TIMED_OUT: '시간 초과',
  STALE: '분석 중 실행 변경', CANCELLED: '서버 작업 취소',
}
function Usage({ usage }: { usage: AnalysisUsage }) {
  return <p className={styles.note}>
    모델 요청 {usage.model_calls}회 · 사용량 수신 {usage.reported_calls}회 · 입력 {usage.input_tokens} / 출력 {usage.output_tokens} 토큰<br />
    {usage.usage_complete ? '수신 사용량 집계 완료' : '집계 불완전 · 최종 비용 알 수 없음'} ·
    {usage.estimated_cost_usd === null ? ' 비용 추정 없음' : !usage.usage_complete && !usage.reported_calls
      ? ' 수신 사용량 없음' : ` 확인된 토큰 기준 추정 $${usage.estimated_cost_usd.toFixed(6)}`}
  </p>
}

export function AnalysisHistoryPanel({ runId }: { runId?: string }) {
  const history = useAnalysisHistory()
  const [allRuns, setAllRuns] = useState(false)
  const filter = allRuns ? null : runId ?? null
  const detail = history.detail
  const evidence = detail?.tools.flatMap((tool) => tool.result && 'events' in tool.result.data ? tool.result.data.events : []) ?? []
  return <Panel title="분석 이력" label="저장된 관측 · 수동 조회">
    <div className={styles.historyToolbar}>
      <label><input type="checkbox" checked={allRuns} disabled={history.loading}
        onChange={(event) => { setAllRuns(event.target.checked); void history.load(event.target.checked ? null : runId ?? null) }} /> 이전 실행 포함</label>
      <Button disabled={history.loading || (!allRuns && !runId)} onClick={() => { void history.load(filter) }}>이력 새로고침</Button>
      <Button disabled={history.loading || history.offset === 0} onClick={() => { void history.load(filter, Math.max(0, history.offset - 20)) }}>이전 20개</Button>
      <Button disabled={history.loading || history.rows.length < 20} onClick={() => { void history.load(filter, history.offset + 20) }}>다음 20개</Button>
    </div>
    <p className={styles.note}>내 브라우저에 연결된 질문·답변만 조회합니다. 이력 조회는 OpenAI를 호출하지 않으며 현재 생산을 변경하지 않습니다.</p>
    {history.storage && <p className={styles.note}>{history.storage.history_enabled ? `저장 대기 ${history.storage.history_pending}건` : 'DB 미설정으로 분석 이력 저장 비활성'}{history.storage.history_error && ` · ${history.storage.history_error}`}</p>}
    {history.error && <p role="alert" className={styles.note}>{history.error}</p>}
    {history.loading && <p role="status" className={styles.note}>조회 중…</p>}
    <ol className={styles.historyList}>
      {history.rows.map((row) => <li key={row.analysis_id}>
        <button className={styles.historySelect} aria-pressed={detail?.analysis_id === row.analysis_id} disabled={history.loading} onClick={() => { void history.select(row.analysis_id) }}>
          <span className={styles.historyMeta}><time>{new Date(row.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</time><span data-status={row.status}>{statuses[row.status]}</span></span>
          <strong>{row.question}</strong>
        </button>
      </li>)}
    </ol>
    {history.storage?.history_enabled && !history.loading && !history.error && !history.rows.length && <p className={styles.note}>조회된 저장 이력이 없습니다. 저장 대기나 실행 필터도 확인하세요.</p>}
    {detail && <div className={styles.result}>
      <p>상태: {statuses[detail.status]} · {detail.model} · {detail.elapsed_seconds.toFixed(1)}초</p>
      <p>질문: {detail.question}</p>
      <p className={styles.note}>분석 {detail.analysis_id}<br />실행 {detail.run_id} · 버전 {detail.state_version} · 공장 시각 {detail.simulation_time_seconds.toFixed(1)}초</p>
      {detail.status === 'RUNNING' && <p className={styles.note}>마지막 저장에 완료 정보가 없습니다. 서버 종료로 남은 기록일 수도 있어 현재 실행 중이라고 단정할 수 없습니다.</p>}
      {detail.error && <p className={styles.note}>{detail.error}</p>}
      {detail.result && <>
        <p className={styles.answer}>{detail.result.answer.answer}</p>
        <p className={styles.note}>{detail.result.answer.uncertainty}</p>
        <ul>{[...new Set(detail.result.answer.evidence_event_sequences)].map((sequence) => {
          const event = evidence.find((item) => item.sequence === sequence)
          return <li key={sequence}>#{sequence} · {event?.station_id} · {event?.message}</li>
        })}</ul>
      </>}
      <p>사용 도구: {detail.tools.map((tool) => tool.tool_name + (tool.error ? ' (실패)' : '')).join(', ') || '없음'}</p>
      <Usage usage={detail.usage} />
      <details><summary>저장된 도구 자료</summary><pre>{JSON.stringify(detail.tools, null, 2)}</pre></details>
    </div>}
  </Panel>
}

