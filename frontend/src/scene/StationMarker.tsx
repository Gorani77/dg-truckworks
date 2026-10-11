import type { StationState } from '../api/factory'
import type { StationDefinition } from '../features/factory/types'
import { stationStatusLabels } from '../features/factory/presentation'
import { Icon } from '../components/Icon'
import styles from './scene.module.css'

export function StationMarker({ station, state, selected, expanded, related, progress, active }: {
  station: StationDefinition; state?: StationState; selected: boolean; expanded: boolean
  related?: boolean; progress: number; active: boolean
}) {
  return <div className={styles.sceneLabel} data-selected={selected} data-status={state?.status} data-related={related}>
    <div className={styles.markerHeading}>
      <span className={styles.markerNumber} aria-label={station.id}>{station.id.replace('ST-', '')}</span>
      <div><strong>{station.name}</strong><span className={styles.markerStatus}><i />{state ? stationStatusLabels[state.status] : '수신 대기'}</span></div>
      {related && <Icon name="spark" size={13} />}
    </div>
    {state && expanded && <div className={styles.markerDetail}>
      <span>입력 <b>{state.queued_part_ids.length}</b></span><span>예약 <b>{state.reserved_part_ids.length}</b></span>
      {active && <strong>{Math.round(progress * 100)}%</strong>}
    </div>}
    {active && expanded && <div className={styles.markerProgress} role="progressbar" aria-label={`${station.name} 공정 진행률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ width: `${progress * 100}%` }} /></div>}
    {related && expanded && <small className={styles.markerEvidence}>AI 분석 관련 설비</small>}
  </div>
}
