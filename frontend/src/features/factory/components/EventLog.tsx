import { Panel } from '../../../components/Panel'
import { Icon } from '../../../components/Icon'
import styles from '../factory.module.css'
import type { PartState, ProductionEvent } from '../../../api/factory'

export function EventLog({ events, connected, parts = [], showOccurredAt = false }: {
  events: ProductionEvent[]; connected: boolean; parts?: readonly PartState[]; showOccurredAt?: boolean
}) {
  return (
    <Panel title="이벤트 로그" label={connected ? `${events.length}건` : '수신 대기'} className={styles.eventLog}>
      <div className={styles.tableScroll}>
        <table className={styles.eventTable}>
          <thead><tr><th scope="col">순서</th><th scope="col">시뮬레이션 시간</th>{showOccurredAt && <th scope="col">발생 시각 (한국 시간)</th>}<th scope="col">대상</th><th scope="col">차체</th><th scope="col">이벤트</th></tr></thead>
          <tbody>
            {events.length ? events.map((event) => <tr key={`${event.run_id}-${event.sequence}`}>
              <td>{event.sequence}</td><td>{event.simulation_time_seconds.toFixed(1)}초</td>
              {showOccurredAt && <td>{new Date(event.occurred_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>}
              <td>{event.station_id}</td><td title={event.part_id ?? undefined}>{event.kind.startsWith('RUN_') ? '전체 실행'
                : parts.find((part) => part.id === event.part_id)
                  ? `#${parts.find((part) => part.id === event.part_id)?.production_number}` : event.part_id?.slice(0, 8) ?? '—'}</td>
              <td>{event.message}</td>
            </tr>) : <tr><td colSpan={showOccurredAt ? 6 : 5}><div className={styles.emptyState}><Icon name="history" size={26} /><strong>{connected ? '아직 기록된 이벤트가 없습니다' : '서버 이벤트 수신 대기'}</strong><span>{connected ? '생산과 설비 상태 변화가 기록되면 여기에 표시됩니다.' : '공장에 연결되면 수신한 기록을 표시합니다.'}</span></div></td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}


