import { useState } from 'react'
import type { useAgentQuestion } from './useAgentQuestion'
import { AgentPanel } from './AgentPanel'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import styles from './agent.module.css'

export function SceneAgentPanel({ agent, runId, partIds, onSelectStation }: {
  agent: ReturnType<typeof useAgentQuestion>; runId?: string
  partIds: string[]; onSelectStation: (id: string) => void
}) {
  const [question, setQuestion] = useState('지금 생산 상태를 알려줘. 멈춘 공정이 있다면 이유도 설명해줘.')
  const result = agent.answer
  const evidence = result?.tools.flatMap((tool) => tool.result && 'events' in tool.result.data ? tool.result.data.events : []) ?? []
  return <div className={styles.sceneAgent}>
    <div className={styles.agentIntro}><span className={styles.agentEmblem}><Icon name="analysis" size={22} /></span><div><h3>공장에 대해 질문하기</h3></div></div>
    <div className={styles.targetContext}><Icon name="factory" size={15} /><span>분석 범위</span><strong>차체 생산라인</strong></div>
    <p className={styles.note}>차체 라인의 상태와 작업 기록을 조회합니다. 전시 구역은 분석하지 않습니다.</p>
    <div className={styles.prompts}>
      {['생산이 멈춘 이유는?', '어디에 부품이 쌓이고 있어?', '고장이 다른 공정에도 영향을 주고 있어?'].map((text) =>
        <button key={text} disabled={agent.loading} onClick={() => setQuestion(text)}>{text}</button>)}
    </div>
    <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); if (runId) void agent.ask(question, runId) }}>
      <label className={styles.label} htmlFor="scene-question">질문</label>
      <textarea id="scene-question" className={styles.input} rows={3} maxLength={1000} value={question}
        disabled={!runId || agent.loading} onChange={(event) => setQuestion(event.target.value)} />
      <Button type="submit" variant="ai" disabled={!runId || agent.loading || !question.trim()}>
        <Icon name={agent.loading ? 'clock' : 'analysis'} size={16} />{agent.loading ? '공장 분석 중…' : '분석 요청'}
      </Button>
    </form>
    <p className={styles.note}>요청 시 OpenAI API 비용이 발생합니다. AI는 상태를 조회하며 설비를 조작하지 않습니다.</p>
    {agent.loading && <p role="status" className={styles.analysisPending}>공장 기록을 분석하고 있습니다.</p>}
    {agent.error && <p role="alert" className={styles.error}>{agent.error} 다시 요청해 주세요.</p>}
    {result && <section className={styles.result} aria-label="AI 분석 결과" aria-live="polite">
      <div className={styles.resultHeading}><Icon name="analysis" size={16} /><h3>분석 결과</h3></div><p className={styles.observation}>분석 시점 {result.simulation_time_seconds.toFixed(1)}초 · 현재 상태와 다를 수 있음</p>
      <p className={styles.answer}>{result.answer.answer}</p>
      {result.answer.uncertainty && <p className={styles.note}>{result.answer.uncertainty}</p>}
      <div className={styles.relatedStations}>
        {result.answer.related_station_ids.map((id) => <button key={id} onClick={() => onSelectStation(id)}><Icon name="target" size={14} />{id} 보기</button>)}
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
        <p className={styles.note}>분석 {result.analysis_id} · {agent.historyState === 'queued' ? '저장 요청됨 · 기록 메뉴에서 확인' : '이력 저장 상태는 기록 메뉴에서 확인'}</p>
      </details>
    </section>}
    <details className={styles.evidence}><summary>공장 데이터 직접 조회</summary>
      <AgentPanel runId={runId} partIds={partIds} onSelectStation={onSelectStation} showQuestion={false} />
    </details>
  </div>
}

