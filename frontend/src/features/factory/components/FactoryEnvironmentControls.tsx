import type { FactoryState } from '../../../api/factory'
import { Button } from '../../../components/Button'
import { Panel } from '../../../components/Panel'
import type { StationDefinition, StationSelectionProps } from '../types'
import { stationStatusLabels } from '../presentation'
import styles from '../factory.module.css'

export function FactoryEnvironmentControls({ stations, selectedStation, onSelect, state, sending, onFault, onRepair }: StationSelectionProps & {
  selectedStation: StationDefinition
  state: FactoryState | null
  sending: boolean
  onFault: (id: string) => void
  onRepair: (id: string) => void
}) {
  const selectedState = state?.stations.find((station) => station.definition.id === selectedStation.id)
  const canFault = !!state && (state.run_status === 'RUNNING' || state.can_resume)
    && !!selectedState && selectedState.status !== 'FAULTED'
  return <Panel title="설비 장애 설정" label="차체 생산라인">
    <p className={styles.description}>선택한 설비를 고장 내거나 복구합니다.</p>
    <label className={styles.label} htmlFor="environment-station">조작할 설비</label>
    <select id="environment-station" className={styles.select} value={selectedStation.id}
      disabled={sending} onChange={(event) => onSelect(event.target.value)}>
      {stations.map((station) => {
        const current = state?.stations.find((item) => item.definition.id === station.id)
        return <option key={station.id} value={station.id}>
          {station.id} · {station.name} · {current ? stationStatusLabels[current.status] : '수신 대기'}
        </option>
      })}
    </select>
    <p className={styles.note}>고장과 복구는 이 메뉴에서 선택한 설비에 적용됩니다.</p>
    <dl className={styles.properties}>
      <div><dt>적용 대상</dt><dd>{selectedStation.name}</dd></div>
      <div><dt>현재 상태</dt><dd>{selectedState ? stationStatusLabels[selectedState.status] : '수신 대기'}</dd></div>
    </dl>
    <div className={styles.buttonPair}>
      <Button variant="danger" disabled={!canFault || sending} onClick={() => onFault(selectedStation.id)}>고장 발생</Button>
      <Button disabled={!selectedState || selectedState.status !== 'FAULTED' || sending}
        onClick={() => onRepair(selectedStation.id)}>복구</Button>
    </div>
    {sending && <p role="status" className={styles.note}>공장 명령을 전달하고 있습니다.</p>}
    {selectedState?.status === 'FAULTED'
      ? <p className={styles.note}>복구하면 남은 작업을 이어갑니다. 생산을 일시정지했다면 재개해 주세요.</p>
      : <p className={styles.note}>생산을 시작한 뒤 고장을 낼 수 있습니다. 고장 난 설비의 작업은 멈추고, 다른 설비는 계속 가동합니다.</p>}
    <p className={styles.note}>고장의 영향은 AI 공장 분석에서 물어볼 수 있습니다.</p>
  </Panel>
}
