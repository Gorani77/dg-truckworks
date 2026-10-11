import type { FactoryState, PartState, TransferState } from '../../../api/factory'
import type { SpatialFocus } from '../../../scene/spatialNavigation'
import type { StationDefinition } from '../types'
import { FutureZoneDetails } from './FutureZoneDetails'
import { getFactoryZone } from '../../../scene/factoryCampus'
import { StationDetails } from './StationDetails'
import { PartDetails } from './PartDetails'
import { Button } from '../../../components/Button'
import { Icon } from '../../../components/Icon'
import styles from '../factory.module.css'

export function SceneSelection({ focus, state, station, parts, transfers, sending, onFault, onRepair, onAnalyze, onSelectPart }: {
  focus: SpatialFocus; state: FactoryState | null; station: StationDefinition
  parts: readonly PartState[]; transfers: readonly TransferState[]; sending: boolean
  onFault: () => void; onRepair: () => void; onAnalyze: () => void; onSelectPart: (id: string) => void
}) {
  const selectedState = state?.stations.find((item) => item.definition.id === station.id)
  const part = focus.kind === 'part' ? parts.find((item) => item.id === focus.id) : undefined
  if (getFactoryZone(focus.kind)?.id !== 'line' && getFactoryZone(focus.kind)) return <FutureZoneDetails kind={focus.kind} />
  if (part) return <>
    <PartDetails part={part} transfer={transfers.find((item) => item.part_id === part.id) ?? null}
      paused={state?.run_status === 'PAUSED'} faulted={state?.stations.some((item) => item.definition.id === part.station_id && item.status === 'FAULTED') ?? false} />
    <p className={styles.note} style={{ padding: 'var(--space-4)' }}>카메라는 수신된 부품 위치를 따라갑니다. 드래그로 둘러본 뒤 시점 초기화를 누르면 추적 시점으로 돌아옵니다.</p>
    <div className={styles.selectionFoot}><Button variant="ai" onClick={onAnalyze}><Icon name="spark" size={17} />이 공정 AI 분석</Button></div>
  </>
  return <>
    <div className={styles.selectionActions}>
      <Button variant="ai" onClick={onAnalyze}><Icon name="spark" size={17} />이 설비 AI 분석<Icon name="arrow" size={15} /></Button>
      <div className={styles.buttonPair}>
        <Button variant="danger" disabled={sending || !state || !(state.run_status === 'RUNNING' || state.can_resume) || !selectedState || selectedState.status === 'FAULTED'} onClick={onFault}>고장 발생</Button>
        <Button disabled={sending || selectedState?.status !== 'FAULTED'} onClick={onRepair}>복구</Button>
      </div>
    </div>
    <StationDetails station={station} state={selectedState} />
    {selectedState?.current_part_id && parts.some((item) => item.id === selectedState.current_part_id) && <div className={styles.selectionFoot}><Button onClick={() => onSelectPart(selectedState.current_part_id!)}><Icon name="target" size={17} />현재 차체 따라가기</Button></div>}
  </>
}


