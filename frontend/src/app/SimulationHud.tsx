import type { FactoryState } from '../api/factory'
import type { SpatialFocus } from '../scene/spatialNavigation'
import { zoneLabels } from '../scene/spatialNavigation'
import { getFactoryZone } from '../scene/factoryCampus'
import type { StationDefinition } from '../features/factory/types'
import { runStatusLabels } from '../features/factory/presentation'
import { Icon } from '../components/Icon'
import styles from './experience.module.css'

export type ScenePanel = 'agent' | 'selection' | 'controls' | 'campus' | 'records' | 'about' | null

export function SimulationHud({ state, connection, sending, focus, stations, onNavigate, onPanel, activePanel,
  onStart, onPause, onResume, onResetView, show2D, onToggle2D, analyzing }: {
  state: FactoryState | null; connection: 'loading' | 'connected' | 'offline'; sending: boolean
  focus: SpatialFocus; stations: readonly StationDefinition[]; onNavigate: (focus: SpatialFocus) => void
  onPanel: (panel: ScenePanel) => void; activePanel: ScenePanel; onStart: () => void; onPause: () => void; onResume: () => void
  onResetView: () => void; show2D: boolean; onToggle2D: () => void; analyzing: boolean
}) {
  const location = focus.kind === 'station'
    ? `${focus.id} · ${stations.find((station) => station.id === focus.id)?.name ?? '설비'}`
    : focus.kind === 'part' ? `차체 · ${focus.id.slice(0, 8)}` : zoneLabels[focus.kind]
  const zone = getFactoryZone(focus.kind)
  const preview = !!zone && zone.id !== 'line'
  const running = state?.run_status === 'RUNNING'
  const complete = state?.run_status === 'COMPLETED'
  return <>
    <header className={styles.topBar}>
      <button className={styles.brand} onClick={() => onNavigate({ kind: 'overview' })} aria-label="TruckWorks 공장 전체 보기">
        <span className={styles.brandMark}><Icon name="factory" size={22} /></span>
        <span>TruckWorks<small>공장 시뮬레이션</small></span>
      </button>
      <span className={styles.connection} data-connected={connection === 'connected'}><i />{connection === 'connected' ? '연결됨' : connection === 'loading' ? '연결 중' : '연결 끊김'}</span>
      <nav className={styles.topActions} aria-label="공장 메뉴">
        <button aria-pressed={activePanel === 'campus'} onClick={() => onPanel(activePanel === 'campus' ? null : 'campus')}><Icon name="compass" />공장 지도</button>
        <button aria-pressed={activePanel === 'records'} onClick={() => onPanel(activePanel === 'records' ? null : 'records')}><Icon name="history" />기록</button>
        <button aria-pressed={activePanel === 'about'} onClick={() => onPanel(activePanel === 'about' ? null : 'about')}><Icon name="info" />소개</button>
      </nav>
    </header>
    <div className={styles.navigation} aria-label="현재 위치">
      <span className={styles.navIcon}><Icon name="compass" size={20} /></span>
      <div><span className={styles.locationLabel}>현재 위치</span><strong aria-live="polite">{location}</strong></div>
    </div>
    <nav className={styles.sidebar} aria-label="공장 환경 메뉴">
      <button aria-expanded={activePanel === 'controls'} aria-controls="factory-environment"
        onClick={() => onPanel(activePanel === 'controls' ? null : 'controls')}>
        <Icon name="settings" size={22} /><span>공장 환경</span>
      </button>
    </nav>
    <div className={styles.statusBar} aria-label="차체 라인의 현재 생산 현황">
      <div className={styles.runState} data-status={state?.run_status ?? 'UNKNOWN'}><i /><span><small>차체 라인</small><strong>{state ? runStatusLabels[state.run_status] : '수신 대기'}</strong></span></div>
      <div className={styles.metric}><span>양품</span><strong>{state?.counts.good_count ?? '—'}<small>개</small></strong></div>
      <div className={styles.metric} data-tone="fault"><span>불량</span><strong>{state?.counts.rejected_count ?? '—'}<small>개</small></strong></div>
      <div className={`${styles.metric} ${styles.clock}`}><span><Icon name="clock" size={12} /> 시뮬레이션</span><strong>{state ? state.simulation_time_seconds.toFixed(1) : '—'}<small>s</small></strong></div>
    </div>
    <div className={styles.bottomBar}>
      <div className={styles.viewActions} aria-label="시점 조작">
        <button onClick={onResetView} title="처음 접속했을 때의 공장 전체 시점으로 초기화"><Icon name="target" /><span>시점 초기화</span></button>
        <button onClick={onToggle2D} aria-pressed={show2D}><Icon name="cube" /><span>{show2D ? '3D 보기' : '2D 보기'}</span></button>
      </div>
      {preview ? <div className={styles.futureTransport}><span>전시 구역</span><strong>{zone?.title}</strong><button onClick={() => onNavigate({ kind: 'line' })}>차체 라인 보기</button></div> : <div className={styles.transport} aria-label="생산 조작">
        <button className={styles.playButton} data-running={running} disabled={!state || sending || complete || (state.run_status === 'PAUSED' && !state.can_resume)}
          onClick={running ? onPause : state?.can_resume ? onResume : onStart}>
          <span className={styles.playIcon}><Icon name={sending ? 'clock' : running ? 'pause' : complete ? 'check' : 'play'} size={22} /></span>
          <span><small>{sending ? '처리 중' : running ? '라인 가동 중' : complete ? '생산 종료' : state?.can_resume ? '일시정지됨' : '차체 20개'}</small>
            <strong>{sending ? '요청 중…' : running ? '일시정지' : state?.can_resume ? '생산 재개' : complete ? '생산 완료' : '생산 시작'}</strong></span>
        </button>
      </div>}
      <button className={styles.agentLauncher} data-busy={analyzing} aria-pressed={activePanel === 'agent'} onClick={() => onPanel(activePanel === 'agent' ? null : 'agent')}>
        <span className={styles.agentGlyph}><Icon name="analysis" size={20} /></span><span><small>차체 라인 상태와 고장 원인</small><strong>{analyzing ? 'AI 분석 중…' : 'AI 공장 분석'}</strong></span>
      </button>
    </div>
  </>
}


