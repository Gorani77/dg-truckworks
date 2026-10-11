import { factoryZones } from '../../../scene/factoryCampus'
import type { SpatialFocus } from '../../../scene/spatialNavigation'
import { Icon } from '../../../components/Icon'
import styles from './campusMenu.module.css'

export function CampusMenu({ focus, onNavigate }: { focus: SpatialFocus; onNavigate: (focus: SpatialFocus) => void }) {
  return <div className={styles.menu}>
    <p>입고에서 완성차까지, 그리고 주행으로.<br />현재 동작하는 차체 라인과 앞으로 연결할 공간을 함께 둘러보세요.</p>
    <button className={styles.overview} onClick={() => onNavigate({ kind: 'overview' })}><Icon name="factory" />전체 공장 보기<Icon name="arrow" /></button>
    <ol>{factoryZones.map(zone => <li key={zone.id}><button aria-pressed={focus.kind === zone.id} onClick={() => onNavigate({ kind: zone.id })}>
      <span className={styles.number}>{zone.number}</span><span><strong>{zone.title}</strong><small>{zone.id === 'line' ? '생산 · 고장/복구 · AI 분석' : zone.id === 'driving' ? '정적 트랙 · 운행 구현 예정' : '설비 모형 · 공정 구현 예정'}</small></span><Icon name="arrow" size={15} />
    </button></li>)}</ol>
    <div className={styles.future}><span>향후 목표</span><h3>만든 트럭을 직접 운행하고,<br />운행 전에 AI로 예측하기.</h3><p>현재는 메뉴와 공간을 준비했습니다. 운행 엔진·예측 모델·결과 비교는 후속 개발 범위입니다.</p><button onClick={() => onNavigate({ kind: 'forecast' })}><Icon name="spark" />운행 전 AI 예측 계획<Icon name="arrow" size={15} /></button></div>
  </div>
}
