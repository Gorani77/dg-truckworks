import { useState } from 'react'
import { Button } from '../../components/Button'
import { useAgentQuestion } from './useAgentQuestion'
import styles from './agent.module.css'

export function AgentQuestion({ runId, stationId, onSelectStation }: {
  runId?: string; stationId?: string; onSelectStation: (id: string) => void
}) {
  const [question, setQuestion] = useState('생산이 멈추거나 부품이 대기하는 이유를 알려줘.')
  const agent = useAgentQuestion()
  const result = agent.answer
  const evidence = result?.tools.flatMap((tool) => tool.result && 'events' in tool.result.data ? tool.result.data.events : []) ?? []
  return <div>
    <label className={styles.label} htmlFor="agent-question">공장 상태에 관한 질문</label>
    <textarea className={styles.input} id="agent-question" value={question} maxLength={1000} rows={3}
      onChange={(event) => setQuestion(event.target.value)} disabled={agent.loading || !runId} />
    <Button disabled={!runId || agent.loading || !question.trim()}
      onClick={() => { if (runId) void agent.ask(question, runId, stationId) }}>
      {agent.loading ? '분석 중…' : '분석 요청'}
    </Button>
    <p className={styles.note}>현재 실행의 조회 시점을 기준으로 분석합니다. 요청 시 OpenAI API 비용이 발생하며 생산 제어는 수행하지 않습니다.</p>
    {agent.error && <p role="alert" className={styles.note}>{agent.error}</p>}
    {agent.historyState && <p className={styles.note}>{agent.historyState === 'queued' ? '이력 저장 요청됨 · DB 커밋 완료는 분석 이력 새로고침으로 확인하세요.' : 'DB 미설정으로 분석 이력 저장 비활성'}</p>}
    {result && <div className={styles.result} aria-live="polite">
      <p className={styles.answer}>{result.answer.answer}</p>
      {result.answer.uncertainty && <p className={styles.note}>한계: {result.answer.uncertainty}</p>}
      <p>관측: {result.simulation_time_seconds.toFixed(1)}초 · 버전 {result.state_version}</p>
      <p className={styles.note}>실행 {result.run_id} · 답변 이후 공장 상태는 달라질 수 있습니다.</p>
      <p className={styles.note}>분석 ID: {result.analysis_id}</p>
      <p>사용 도구: {result.tools.map((tool) => tool.tool_name + (tool.error ? ' (실패)' : '')).join(', ')}</p>
      {result.answer.related_station_ids.map((id) => <Button key={id} onClick={() => onSelectStation(id)}>{id} 보기</Button>)}
      <ul>{[...new Set(result.answer.evidence_event_sequences)].map((sequence) => {
        const event = evidence.find((item) => item.sequence === sequence)
        return <li key={sequence}>#{sequence} · {event?.station_id} · {event?.message}</li>
      })}</ul>
      <p className={styles.note}>{result.model} · 모델 {result.model_calls}회 · {result.elapsed_seconds.toFixed(1)}초<br />
        입력 {result.input_tokens} / 출력 {result.output_tokens} 토큰 · 추정 비용 {result.estimated_cost_usd === null ? '계산 안 함' : `$${result.estimated_cost_usd.toFixed(6)}`}</p>
    </div>}
  </div>
}
