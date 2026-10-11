import { Panel } from '../../../components/Panel'
import { Button } from '../../../components/Button'
import { Icon } from '../../../components/Icon'
import type { FactoryState } from '../../../api/factory'
import { StationList } from './StationList'
import type { StationDefinition, StationSelectionProps } from '../types'
import styles from '../factory.module.css'
import { useState } from 'react'

type ProductionControlsProps = StationSelectionProps & {
  selectedStation: StationDefinition
  state: FactoryState | null
  sending: boolean
  onStart: (batch: boolean) => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onFault: (stationId: string) => void
  onRepair: (stationId: string) => void
  error: string | null
}

export function ProductionControls({ stations, selectedStation, onSelect, state, sending, onStart, onPause, onResume, onReset, onFault, onRepair, error }: ProductionControlsProps) {
  const [selection, setSelection] = useState('batch')
  const scenario = state && state.run_status !== 'READY' ? state.scenario : selection
  const batch = scenario === 'batch'
  const selectedState = state?.stations.find((station) => station.definition.id === selectedStation.id)
  const canFault = state && (state.run_status === 'RUNNING' || state.can_resume)
    && selectedState && selectedState.status !== 'FAULTED'
  return (
    <Panel title="생산 제어" label="수동">
      <span className={styles.label} id="scenario-label">생산 시나리오</span>
      <div className={styles.scenarios} role="group" aria-labelledby="scenario-label">
        <button aria-pressed={scenario === 'single_part'} disabled={!state || state.run_status !== 'READY' || sending} onClick={() => setSelection('single_part')}>
          <strong>01<small>개</small></strong><span>차체 하나의 전체 공정</span>
        </button>
        <button aria-pressed={scenario === 'batch'} disabled={!state || state.run_status !== 'READY' || sending} onClick={() => setSelection('batch')}>
          <strong>20<small>개</small></strong><span>대기열을 포함한 연속 생산</span>
        </button>
      </div>
      {scenario === 'single_station' && <p className={styles.note}>기존 ST-01 단독 실행 중</p>}
      <Button variant="primary" disabled={!state || state.run_status !== 'READY' || sending} onClick={() => onStart(batch)}>
        <Icon name="play" size={16} />{batch ? '차체 20개 생산 시작' : '차체 1개 생산 시작'}
      </Button>
      <div className={styles.buttonPair}>
        <Button disabled={!state || state.run_status !== 'RUNNING' || sending} onClick={onPause}>일시정지</Button>
        <Button disabled={!state || state.run_status !== 'PAUSED' || !state.can_resume || sending} onClick={onResume}>재개</Button>
      </div>
      <Button disabled={!state || sending} onClick={onReset}>실행 초기화</Button>
      <p className={styles.note}>{batch ? '소재 20개를 차례로 투입합니다. 설비당 처리 1개, 입력 대기와 이동 예약은 합쳐 최대 3개입니다.'
        : '5개 공정 처리 22초 + 구간별 이동 1초 × 4회. 소재 20개 중 1개만 생산합니다.'} 일시정지 중에는 가공·이동 시간이 함께 멈춥니다.</p>
      <p className={styles.note}>초기화하면 현재 생산과 이벤트를 지우고 소재 20개로 돌아갑니다.</p>
      {sending && <p className={styles.note} role="status">생산 제어 요청 중…</p>}
      {state?.can_resume && <p className={styles.note}>일시정지했습니다. 재개하면 남은 시간부터 이어갑니다.</p>}
      {(state?.run_status === 'COMPLETED' || (state?.run_status === 'PAUSED' && !state.can_resume)) && <p className={styles.note}>시나리오가 끝났습니다. 실행 초기화 후 다시 시작할 수 있습니다.</p>}
      {error && <p className={styles.note} role="alert">{error}</p>}
      <h3 className={styles.sectionTitle}>공정</h3>
      <StationList stations={stations} selectedId={selectedStation.id} onSelect={onSelect} />
      <h3 className={styles.sectionTitle}>설비 장애</h3>
      <p className={styles.note}>{selectedStation.id} / {selectedStation.name}</p>
      <div className={styles.buttonPair}>
        <Button variant="danger" disabled={!canFault || sending} onClick={() => onFault(selectedStation.id)}>고장 발생</Button>
        <Button disabled={!state || selectedState?.status !== 'FAULTED' || sending}
          onClick={() => onRepair(selectedStation.id)}>복구</Button>
      </div>
      <p className={styles.note}>선택한 설비만 멈춥니다. 부품·남은 가공 시간을 보존하고 복구 후 이어갑니다. 다른 설비와 이동은 계속 진행합니다.</p>
      {selectedState?.status === 'FAULTED' && <p className={styles.note} role="status">{selectedStation.id} 고장 상태입니다. 복구 버튼으로 해제하세요. 공장 재개만으로는 복구되지 않습니다.</p>}
    </Panel>
  )
}


