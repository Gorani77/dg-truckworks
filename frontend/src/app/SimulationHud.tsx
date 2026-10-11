import type { FactoryState } from '../api/factory'
import type { SpatialFocus } from '../scene/spatialNavigation'
import { isZoneKind } from '../scene/spatialNavigation'
import { factoryZones, getFactoryZone } from '../scene/factoryCampus'
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
  const location = focus.kind === 'station' || focus.kind === 'part' ? `${focus.kind}:${focus.id}` : focus.kind
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
      <span className={styles.connection} data-connected={connection === 'connected'}><i />{connection === 'connected' ? '내 공장 연결됨' : connection === 'loading' ? '연결 중' : '연결 끊김'}</span>
      <nav className={styles.topActions} aria-label="공장 메뉴">
        <button aria-pressed={activePanel === 'campus'} onClick={() => onPanel(activePanel === 'campus' ? null : 'campus')}><Icon name="compass" />공장 지도</button>
        <button aria-pressed={activePanel === 'records'} onClick={() => onPanel(activePanel === 'records' ? null : 'records')}><Icon name="history" />기록</button>
        <button aria-pressed={activePanel === 'about'} onClick={() => onPanel(activePanel === 'about' ? null : 'about')}><Icon name="info" />소개</button>
      </nav>
    </header>
    <div className={styles.navigation}>
      <span className={styles.navIcon}><Icon name="compass" size={20} /></span>
      <div><label htmlFor="scene-location">현재 탐색 위치</label>
        <select id="scene-location" value={location} onChange={(event) => {
          const value = event.target.value
          if (value.startsWith('station:')) onNavigate({ kind: 'station', id: value.slice(8) })
          else if (value === 'overview' || value === 'forecast' || isZoneKind(value)) onNavigate({ kind: value })
        }}>
          <option value="overview">공장 전체 · 9개 구역</option>
          <optgroup label="공장 구역">{factoryZones.map(zone => <option key={zone.id} value={zone.id}>{zone.number} · {zone.title}{zone.id !== 'line' ? ' (전시)' : ''}</option>)}</optgroup><optgroup label="차체 라인 · 현재 설비">
          {stations.map((station) => <option key={station.id} value={`station:${station.id}`}>{station.id} · {station.name}</option>)}
          </optgroup><optgroup label="향후 운행 기능"><option value="forecast">운행 전 AI 예측 (구현 예정)</option></optgroup>
          {focus.kind === 'part' && <option value={location}>선택한 차체 따라가기</option>}
        </select>
      </div>
      {focus.kind !== 'overview' && <button aria-label="상위 구역으로 돌아가기" title="상위 구역으로 돌아가기" onClick={() => onNavigate({ kind: focus.kind === 'station' || focus.kind === 'part' ? 'line' : 'overview' })}><Icon name="back" /></button>}
    </div>
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
      {preview ? <div className={styles.futureTransport}><span>전시 구역 · 동작 구현 예정</span><strong>{zone?.title}</strong><button onClick={() => onNavigate({ kind: 'line' })}>차체 생산라인으로 <Icon name="arrow" size={16} /></button></div> : <div className={styles.transport} aria-label="생산 조작">
        <button className={styles.playButton} data-running={running} disabled={!state || sending || complete || (state.run_status === 'PAUSED' && !state.can_resume)}
          onClick={running ? onPause : state?.can_resume ? onResume : onStart}>
          <span className={styles.playIcon}><Icon name={sending ? 'clock' : running ? 'pause' : complete ? 'check' : 'play'} size={22} /></span>
          <span><small>{sending ? '명령 전달 중' : running ? '라인 가동 중' : complete ? '이번 실행 종료' : state?.can_resume ? '남은 공정 이어하기' : '차체 20개 연속 생산'}</small>
            <strong>{sending ? '요청 중…' : running ? '일시정지' : state?.can_resume ? '생산 재개' : complete ? '생산 완료' : '생산 시작'}</strong></span>
        </button>
        <button className={styles.settingsButton} aria-pressed={activePanel === 'controls'} onClick={() => onPanel(activePanel === 'controls' ? null : 'controls')}><Icon name="settings" size={20} /><span>생산 설정</span></button>
      </div>}
      <button disabled={preview} className={styles.agentLauncher} data-busy={analyzing} aria-pressed={activePanel === 'agent'} onClick={() => onPanel(activePanel === 'agent' ? null : 'agent')}>
        <span className={styles.agentGlyph}><Icon name="spark" size={22} /></span><span><small>{preview ? '이 구역 분석은 구현 예정' : '차체 라인 상태와 근거 분석'}</small><strong>{preview ? 'AI 분석 · 준비 중' : analyzing ? 'AI 분석 중…' : 'AI에게 질문'}</strong></span><Icon name="arrow" size={16} />
      </button>
    </div>
  </>
}


