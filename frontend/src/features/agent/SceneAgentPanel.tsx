import { useState } from 'react'
import type { useAgentQuestion } from './useAgentQuestion'
import { AgentPanel } from './AgentPanel'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import styles from './agent.module.css'

export function SceneAgentPanel({ agent, runId, stationId, stationName, partIds, onSelectStation }: {
  agent: ReturnType<typeof useAgentQuestion>; runId?: string; stationId: string; stationName: string
  partIds: string[]; onSelectStation: (id: string) => void
}) {
  const [question, setQuestion] = useState('생산이 멈추거나 부품이 대기하는 이유와 영향을 받는 설비를 설명해줘.')
  const result = agent.answer
  const evidence = result?.tools.flatMap((tool) => tool.result && 'events' in tool.result.data ? tool.result.data.events : []) ?? []
  return <div className={styles.sceneAgent}>
    <div className={styles.agentIntro}><span className={styles.agentEmblem}><Icon name="spark" size={24} /></span><div><span>공장 분석 어시스턴트</span><h3>지금, 무엇이 궁금한가요?</h3></div></div>
    <div className={styles.targetContext}><Icon name="target" size={15} /><span>분석 대상</span><strong>{stationId} · {stationName}</strong></div>
    <div className={styles.prompts}>
      {['생산이 멈춘 이유는?', '어디에 부품이 쌓이고 있어?', '선택한 설비의 상태와 영향을 설명해줘.'].map((text) =>
        <button key={text} disabled={agent.loading} onClick={() => setQuestion(text)}>{text}<Icon name="arrow" size={14} /></button>)}
    </div>
    <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); if (runId) void agent.ask(question, runId, stationId) }}>
      <label className={styles.label} htmlFor="scene-question">AI에게 질문</label>
      <textarea id="scene-question" className={styles.input} rows={3} maxLength={1000} value={question}
        disabled={!runId || agent.loading} onChange={(event) => setQuestion(event.target.value)} />
      <Button type="submit" variant="ai" disabled={!runId || agent.loading || !question.trim()}>
        <Icon name={agent.loading ? 'clock' : 'spark'} size={16} />{agent.loading ? '공장 분석 중…' : '분석 요청'}
      </Button>
    </form>
    <p className={styles.note}>요청 시 OpenAI API 비용이 발생합니다. AI는 상태를 조회하며 설비를 조작하지 않습니다.</p>
    {agent.loading && <p role="status" className={styles.analysisPending}>분석 응답을 기다리고 있습니다. 공장은 계속 관찰할 수 있습니다.</p>}
    {agent.error && <p role="alert" className={styles.error}>{agent.error} 질문을 다시 요청할 수 있습니다.</p>}
    {result && <section className={styles.result} aria-label="AI 분석 결과" aria-live="polite">
      <div className={styles.resultHeading}><Icon name="spark" size={16} /><h3>공장 분석 결과</h3><span>관측 기반</span></div><p className={styles.observation}>분석 시점 {result.simulation_time_seconds.toFixed(1)}초 · 현재 상태와 다를 수 있음</p>
      <p className={styles.answer}>{result.answer.answer}</p>
      {result.answer.uncertainty && <p className={styles.note}>{result.answer.uncertainty}</p>}
      <div className={styles.relatedStations}>
        {result.answer.related_station_ids.map((id) => <button key={id} onClick={() => onSelectStation(id)}><Icon name="target" size={14} />{id}로 이동<Icon name="arrow" size={14} /></button>)}
      </div>
      <details className={styles.evidence}>
        <summary>분석 근거와 사용 도구 보기</summary>
        <p>관측 버전 {result.state_version} · 실행 {result.run_id}</p>
        <ul>{[...new Set(result.answer.evidence_event_sequences)].map((sequence) => {
          const event = evidence.find((item) => item.sequence === sequence)
          return <li key={sequence}>#{sequence} · {event ? `${event.station_id} · ${event.message}` : '응답에 이벤트 본문이 포함되지 않았습니다.'}</li>
        })}</ul>
        {result.tools.map((tool, index) => <p key={index}>{tool.tool_name} · {tool.error ? `실패: ${tool.error}` : '조회 응답 수신'}</p>)}
        <p className={styles.note}>{result.model} · 모델 {result.model_calls}회 · {result.elapsed_seconds.toFixed(1)}초<br />
          입력 {result.input_tokens} / 출력 {result.output_tokens} 토큰 · 추정 비용 {result.estimated_cost_usd === null ? '계산 안 함' : `$${result.estimated_cost_usd.toFixed(6)}`}</p>
        <p className={styles.note}>분석 {result.analysis_id} · {agent.historyState === 'queued' ? '이력 저장 요청됨 (커밋 확인은 기록 메뉴)' : '이력 저장 상태는 기록 메뉴에서 확인'}</p>
      </details>
    </section>}
    <details className={styles.evidence}><summary>AI 없이 공장 자료 직접 조회</summary>
      <AgentPanel runId={runId} stationId={stationId} partIds={partIds} onSelectStation={onSelectStation} showQuestion={false} />
    </details>
  </div>
}

