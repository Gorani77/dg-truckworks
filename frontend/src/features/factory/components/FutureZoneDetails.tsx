import { getFactoryZone } from '../../../scene/factoryCampus'
import { Icon } from '../../../components/Icon'
import styles from './futureZone.module.css'

export function FutureZoneDetails({ kind }: { kind: string }) {
  const zone = getFactoryZone(kind)
  if (!zone || zone.id === 'line') return null
  const forecasting = kind === 'forecast'
  return <section className={styles.zone}>
    <span className={styles.status}><Icon name="cube" size={15} />전시 구역 · 개발 예정</span>
    <h3>{forecasting ? '주행 결과 예측' : zone.title}</h3>
    <p>{forecasting ? '트럭의 주행 조건을 입력해 AI 예측과 시뮬레이션 결과를 비교하는 기능을 준비할 예정입니다.' : zone.description}</p>
    <h4>{forecasting ? '개발 예정 기능' : '배치 설비'}</h4>
    <ol>{(forecasting ? ['완성 트럭 선택', '운행 조건 설정', 'AI 사전 예측', '운행 시뮬레이션', '예측과 결과 비교'] : zone.equipment).map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol>
    <div className={styles.boundary}><strong>지금은 공간을 둘러볼 수 있습니다.</strong><p>{forecasting ? '예측 모델·입력 조건·평가 지표는 후속 설계 대상입니다. 예측 수치나 결과를 생성하지 않습니다.' : '모형의 차량·부품·설비는 정적 전시입니다. 조립·검사·출하·운행 결과나 실제 재고로 집계하지 않습니다.'}</p></div>
    <p>{forecasting ? '운행 전 AI 예측' : zone.action} · 구현 예정</p>
    {zone.id === 'driving' && !forecasting && <p>운행 전 AI 예측 · 구현 예정</p>}
  </section>
}
