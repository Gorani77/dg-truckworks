import { factoryZones } from '../../../scene/factoryCampus'
import type { SpatialFocus } from '../../../scene/spatialNavigation'
import { Icon } from '../../../components/Icon'
import type { StationDefinition } from '../types'
import { StationList } from './StationList'
import styles from './campusMenu.module.css'

export function CampusMenu({ focus, stations, onNavigate }: { focus: SpatialFocus; stations: readonly StationDefinition[]; onNavigate: (focus: SpatialFocus) => void }) {
  return <div className={styles.menu}>
    <p>구역을 선택하면 해당 위치로 이동합니다. 현재 생산 가능한 구역은 차체 라인입니다.</p>
    <button className={styles.overview} onClick={() => onNavigate({ kind: 'overview' })}><Icon name="factory" />전체 공장 보기</button>
    <ol>{factoryZones.map(zone => <li key={zone.id}><button aria-pressed={focus.kind === zone.id} onClick={() => onNavigate({ kind: zone.id })}>
      <span className={styles.number}>{zone.number}</span><span><strong>{zone.title}</strong><small>{zone.id === 'line' ? '생산 · 고장/복구 · AI 분석' : zone.id === 'driving' ? '전시 · 주행 준비 중' : '전시 · 생산 준비 중'}</small></span>
    </button></li>)}</ol>
    <details className={styles.stationDirectory}>
      <summary>차체 생산라인 설비 목록</summary>
      <StationList stations={stations} selectedId={focus.kind === 'station' ? focus.id : ''}
        onSelect={(id) => onNavigate({ kind: 'station', id })} />
    </details>
    <div className={styles.future}><span>향후 목표</span><h3>트럭 주행과 결과 예측</h3><p>주행과 AI 예측은 개발 예정입니다. 현재는 시험장 모형만 볼 수 있습니다.</p><button onClick={() => onNavigate({ kind: 'forecast' })}><Icon name="analysis" />운행 전 AI 예측 계획</button></div>
  </div>
}
