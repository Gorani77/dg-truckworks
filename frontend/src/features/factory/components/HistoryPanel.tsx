import { Button } from '../../../components/Button'
import { Panel } from '../../../components/Panel'
import { useProductionHistory } from '../hooks/useProductionHistory'
import { runStatusLabels } from '../presentation'
import { EventLog } from './EventLog'
import { PartDetails } from './PartDetails'
import styles from '../history.module.css'

const scenarioLabels = { single_station: 'ST-01 단독', single_part: '차체 1개', batch: '차체 20개' }
const closureLabels: Record<string, string> = {
  RESET: '초기화로 보관', SERVER_STOP: '서버 종료 시 보관', IDLE_EXPIRED: '유휴 공장 정리로 보관',
}
const dateLabel = (value: string) => new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })

export function HistoryPanel() {
  const history = useProductionHistory()
  const busy = history.loading || history.loadingDetail
  const snapshot = history.detail?.snapshot
  const part = history.parts.find((item) => item.id === history.partId)
  const transfer = snapshot?.scenario === 'batch' ? snapshot.transfers.find((item) => item.part_id === part?.id)
    : snapshot?.transfer?.part_id === part?.id ? snapshot?.transfer : null
  return <section className={styles.container} aria-label="저장된 생산 이력">
    <Panel title="생산 이력" label="저장된 기록">
      <div className={styles.toolbar}>
        <p>내 브라우저에 연결된 생산 이력의 마지막 저장 상태와 이벤트를 조회합니다. 과거 실행을 재개하는 기능은 아닙니다.</p>
        <Button disabled={busy} onClick={() => { void history.loadRuns() }}>이력 새로고침</Button>
      </div>
      {!history.status && !history.loading && !history.error && <p>이력 새로고침을 눌러 저장 상태와 실행 목록을 불러오세요.</p>}
      {history.loading && <p role="status">이력 목록을 불러오는 중입니다.</p>}
      {history.status && <p role="status">{!history.status.enabled ? '이력 저장이 꺼져 있습니다. DB 구성 안내를 따라 설정해주세요.'
        : history.status.error ?? (history.status.pending_runs ? `저장 대기 실행 ${history.status.pending_runs}개. 잠시 후 새로고침하세요.` : '저장 대기 없음. 목록은 조회 시점 기준입니다.')}</p>}
      {history.error && <p role="alert">{history.error}</p>}
      {history.status?.enabled && <>
        <label htmlFor="history-run">저장된 실행 선택</label>
        <select id="history-run" value={history.detail?.run_id ?? ''} disabled={busy || history.runs.length === 0}
          onChange={(event) => { void history.selectRun(event.target.value) }}>
          <option value="">실행을 선택하세요</option>
          {history.runs.map((run) => <option key={run.run_id} value={run.run_id}>
            {dateLabel(run.created_at)} · {scenarioLabels[run.scenario] ?? run.scenario} · {run.run_id.slice(0, 8)} · 마지막 상태 {runStatusLabels[run.run_status] ?? run.run_status}
          </option>)}
        </select>
        {!history.loading && history.runs.length === 0 && <p>이 페이지에 저장된 실행이 없습니다.</p>}
        <div className={styles.toolbar}>
          <Button disabled={busy || history.offset === 0} onClick={() => { void history.loadRuns(Math.max(0, history.offset - 20)) }}>이전 목록</Button>
          <span>{Math.floor(history.offset / 20) + 1}페이지 / 페이지당 20개</span>
          <Button disabled={busy || history.runs.length < 20} onClick={() => { void history.loadRuns(history.offset + 20) }}>다음 목록</Button>
        </div>
      </>}
      {history.loadingDetail && <p role="status">선택한 이력을 불러오는 중입니다.</p>}
      {history.detail && snapshot && <>
        <dl className={styles.properties}>
          <div><dt>실행 ID</dt><dd>{history.detail.run_id}</dd></div>
          <div><dt>마지막 저장 (한국 시간)</dt><dd>{dateLabel(history.detail.updated_at)}</dd></div>
          <div><dt>보관 상태</dt><dd>{history.detail.closed_reason ? closureLabels[history.detail.closed_reason] ?? history.detail.closed_reason : '종료 표식 없음 · 저장 시점의 상태'}</dd></div>
          <div><dt>모델 / 응답 버전</dt><dd>{snapshot.model_version} / {snapshot.schema_version}</dd></div>
          <div><dt>난수 시드 / 불량 확률</dt><dd>{snapshot.configuration.random_seed} / {snapshot.configuration.defect_probability}</dd></div>
          <div><dt>시뮬레이션 시각</dt><dd>{snapshot.simulation_time_seconds.toFixed(1)}초</dd></div>
          <div><dt>양품 / 불량 / 라인 내부</dt><dd>{snapshot.counts.good_count} / {snapshot.counts.rejected_count} / {snapshot.counts.in_process_count}</dd></div>
          <div><dt>마지막 이벤트 순번</dt><dd>{snapshot.last_event_sequence}</dd></div>
        </dl>
        <label htmlFor="history-part">이벤트 대상</label>
        <select id="history-part" value={history.partId ?? ''} disabled={busy}
          onChange={(event) => { void history.loadEvents(event.target.value || null) }}>
          <option value="">전체 이벤트 · 부품 없는 설비 고장 포함</option>
          {history.parts.map((part) => <option key={part.id} value={part.id}>차체 #{part.production_number} · {part.id.slice(0, 8)} · {part.phase}</option>)}
        </select>
        <p>부품 필터는 해당 ID가 기록된 이벤트만 표시합니다. 전체 실행 제어 이벤트의 ID는 대표 부품 문맥입니다.</p>
      </>}
    </Panel>
    {history.detail && <>
      {part && snapshot && <PartDetails part={part} transfer={transfer ?? null}
        paused={snapshot.run_status === 'PAUSED' && snapshot.can_resume}
        faulted={snapshot.stations.some((station) => station.definition.id === part.station_id && station.status === 'FAULTED')} />}
      <EventLog events={history.events} parts={history.parts} connected showOccurredAt />
      {history.hasMoreEvents && <Button disabled={busy} onClick={() => { void history.loadEvents(history.partId, true) }}>이벤트 100개 더 보기</Button>}
    </>}
  </section>
}
