import type { PartState, TransferState } from '../../../api/factory'
import { Panel } from '../../../components/Panel'
import { partStageLabels, qualityLabels } from '../presentation'
import styles from '../factory.module.css'

export function PartDetails({ part, transfer, paused, faulted }: {
  part: PartState; transfer: TransferState | null; paused: boolean; faulted: boolean
}) {
  const location = transfer ? `${transfer.from_station_id} → ${transfer.to_station_id}`
    : part.phase === 'STORED' ? (part.quality === 'GOOD' ? '양품 보관' : '불량 보관') : part.station_id ?? '—'
  const rows = [
    ['생산 번호', `#${part.production_number}`], ['부품 ID', part.id], ['가공 단계', partStageLabels[part.stage]],
    ['품질', qualityLabels[part.quality]], ['위치', location],
    ['진행', faulted ? (part.phase === 'QUEUED' ? '입력 대기 · 설비 고장' : '설비 고장 · 작업 중단')
      : part.phase === 'QUEUED' ? (paused ? '입력 대기 · 일시정지' : '입력 대기')
      : part.phase === 'BLOCKED' ? (paused ? '출력 대기 · 일시정지' : '출력 대기')
      : paused && part.phase !== 'STORED' ? (transfer ? '이동 일시정지' : '가공 일시정지')
      : part.phase === 'TRANSFERRING' ? '이동 중' : part.phase === 'STORED' ? '적재 완료' : '공정 처리 중'],
  ]
  return <Panel title="차체 추적" label={`#${part.production_number}`}>
    <div className={styles.partStages} aria-label="차체 가공 단계">
      {(['RAW', 'FRAME', 'DRILLED'] as const).map((stage, index) => <span key={stage}
        data-reached={index <= ['RAW', 'FRAME', 'DRILLED'].indexOf(part.stage)}
        aria-current={stage === part.stage ? 'step' : undefined}>{partStageLabels[stage]}</span>)}
    </div>
    <dl className={styles.properties}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </Panel>
}

