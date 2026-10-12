import type { FactoryState, PartState, TransferState } from '../../../api/factory'
import type { SpatialFocus } from '../../../scene/spatialNavigation'
import type { StationDefinition } from '../types'
import { FutureZoneDetails } from './FutureZoneDetails'
import { getFactoryZone } from '../../../scene/factoryCampus'
import { StationDetails } from './StationDetails'
import { PartDetails } from './PartDetails'
import styles from '../factory.module.css'

export function SceneSelection({ focus, state, station, parts, transfers }: {
  focus: SpatialFocus; state: FactoryState | null; station: StationDefinition
  parts: readonly PartState[]; transfers: readonly TransferState[]
}) {
  const selectedState = state?.stations.find((item) => item.definition.id === station.id)
  const part = focus.kind === 'part' ? parts.find((item) => item.id === focus.id) : undefined
  if (getFactoryZone(focus.kind)?.id !== 'line' && getFactoryZone(focus.kind)) return <FutureZoneDetails kind={focus.kind} />
  if (part) return <>
    <PartDetails part={part} transfer={transfers.find((item) => item.part_id === part.id) ?? null}
      paused={state?.run_status === 'PAUSED'} faulted={state?.stations.some((item) => item.definition.id === part.station_id && item.status === 'FAULTED') ?? false} />
    <p className={styles.note} style={{ padding: 'var(--space-4)' }}>카메라는 수신된 부품 위치를 따라갑니다. 드래그하면 추적이 멈추고 차체를 다시 선택하면 따라갑니다. 시점 초기화는 첫 공장 전체 시점으로 돌아갑니다.</p>
  </>
  return <>
    <StationDetails station={station} state={selectedState} />
  </>
}


