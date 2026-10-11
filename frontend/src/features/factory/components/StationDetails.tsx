import { Panel } from '../../../components/Panel'
import type { StationDefinition } from '../types'
import styles from '../factory.module.css'
import type { StationState } from '../../../api/factory'
import { stationStatusLabels } from '../presentation'

export function StationDetails({ station, state }: { station: StationDefinition; state?: StationState }) {
  const rows = [
    ['설비 상태', state ? stationStatusLabels[state.status] : '수신 대기'],
    ...(state?.status === 'FAULTED' ? [['고장 전 상태', state.status_before_fault
      ? stationStatusLabels[state.status_before_fault] : '—']] : []),
    ['처리시간', `${station.processSeconds}초`],
    ['동시 처리', `${station.capacity}개`],
    ['입력 대기 용량', `${station.inputBufferCapacity}개`],
    ['현재 작업', state?.current_part_id ?? '—'],
    ['남은 처리시간', state ? `${state.remaining_process_seconds.toFixed(1)}초` : '—'],
    ['이동 도착 예약', state ? `${state.reserved_part_ids?.length ?? 0}개` : '—'],
    ['입력 대기 수량', state ? `${state.queued_part_ids.length}개` : '—'],
    ['입력 순서 (FIFO)', state?.queued_part_ids.map((id) => id.slice(0, 8)).join(' → ') || '—'],
  ]
  return (
    <Panel title="공정 상세" label={station.id}>
      <div className={styles.stationHero}><span>{station.id} / 공정 설비</span>
        <span className={styles.stateBadge} data-status={state?.status}><i />{state ? stationStatusLabels[state.status] : '수신 대기'}</span></div>
      <h3 className={styles.detailTitle}>{station.name}</h3>
      <p className={styles.description}>{station.description}</p>
      <div className={styles.stationMetrics}>
        <div><span>남은 처리</span><strong>{state ? state.remaining_process_seconds.toFixed(1) : '—'}<small>초</small></strong></div>
        <div><span>입력 대기</span><strong>{state?.queued_part_ids.length ?? '—'}<small>개</small></strong></div>
        <div><span>이동 예약</span><strong>{state?.reserved_part_ids.length ?? '—'}<small>개</small></strong></div>
      </div>
      <details className={styles.technicalDetails}><summary>공정 설정 · 작업 · 대기열 상세</summary>
      <dl className={styles.properties}>
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl></details>
      <div className={styles.processFlow}><span>{station.input}</span><span aria-hidden="true">↓</span><span>{station.output}</span></div>
      <p className={styles.note}>처리시간과 용량은 모델 설정값입니다.</p>
      {state?.status === 'BLOCKED' && <p className={styles.note}>완료 부품을 설비에 보관하고 있습니다. 다음 입력 공간을 확보해야 이동할 수 있습니다. 단독 설비 시나리오는 다음 공정이 연결되지 않아 이 상태로 종료됩니다.</p>}
      {state?.status === 'FAULTED' && <p className={styles.note}>설비 고장으로 작업이 중단됐습니다. 현재 부품과 잔여시간을 보존하며 복구 후 이어갑니다. 완료 후 출력 대기였다면 가공을 반복하지 않습니다.</p>}
    </Panel>
  )
}


