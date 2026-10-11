import styles from '../factory.module.css'
import type { FactoryState } from '../../../api/factory'
import { runStatusLabels } from '../presentation'

export function ProductionSummary({ state }: { state: FactoryState | null }) {
  const summaryItems = [
    { label: '실행 상태', value: state ? (state.run_status === 'PAUSED' && !state.can_resume
      ? '단일 설비 종료' : state.run_status === 'COMPLETED' && state.scenario === 'batch'
        ? '차체 20개 완료' : runStatusLabels[state.run_status]) : '수신 대기', unit: '', status: true },
    { label: '양품 생산', value: state?.counts.good_count ?? '—', unit: '개', status: false },
    { label: '불량', value: state?.counts.rejected_count ?? '—', unit: '개', status: false },
    { label: '입력 대기', value: state?.counts.waiting_count ?? '—', unit: '개', status: false },
    { label: '소재 잔여', value: state?.material_remaining ?? '—', unit: '개', status: false },
    { label: '라인 내부', value: state?.counts.in_process_count ?? '—', unit: '개', status: false },
    { label: '시뮬레이션 시간', value: state?.simulation_time_seconds.toFixed(1) ?? '—', unit: '초', status: false },
  ]
  return (
    <section className={styles.summary} aria-label="생산 현황">
      {summaryItems.map(({ label, value, unit, status }) => (
        <div className={styles.summaryItem} key={label}>
          <span>{label}</span>
          <strong className={status ? styles.summaryStatus : undefined}>{value}<small>{unit}</small></strong>
        </div>
      ))}
    </section>
  )
}

