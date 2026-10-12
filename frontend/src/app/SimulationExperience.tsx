import { useState } from 'react'
import type { useFactoryConnection } from '../features/factory/hooks/useFactoryConnection'
import { useStationSelection } from '../features/factory/hooks/useStationSelection'
import { useGuidedTour } from '../features/factory/hooks/useGuidedTour'
import { chassisLine } from '../features/factory/data/chassisLine'
import { stationDefinition } from '../features/factory/presentation'
import { ProductionControls } from '../features/factory/components/ProductionControls'
import { FactoryEnvironmentControls } from '../features/factory/components/FactoryEnvironmentControls'
import { CampusMenu } from '../features/factory/components/CampusMenu'
import { SceneSelection } from '../features/factory/components/SceneSelection'
import { GuidedExperience } from '../features/factory/components/GuidedExperience'
import { EventLog } from '../features/factory/components/EventLog'
import { HistoryPanel } from '../features/factory/components/HistoryPanel'
import { AnalysisHistoryPanel } from '../features/agent/AnalysisHistoryPanel'
import { SceneAgentPanel } from '../features/agent/SceneAgentPanel'
import { useAgentQuestion } from '../features/agent/useAgentQuestion'
import { ImmersiveViewport } from '../scene/ImmersiveViewport'
import type { SpatialFocus } from '../scene/spatialNavigation'
import { zoneLabels } from '../scene/spatialNavigation'
import { SimulationHud } from './SimulationHud'
import { SceneDrawer } from './SceneDrawer'
import { ServerStartupNotice } from './ServerStartupNotice'
import { Icon } from '../components/Icon'
import { useSceneNavigation } from './useSceneNavigation'
import styles from './experience.module.css'

export function SimulationExperience({ factory }: { factory: ReturnType<typeof useFactoryConnection> }) {
  const { state } = factory
  const stations = state?.stations.map(stationDefinition) ?? chassisLine.stations
  const { selectedStation: manualStation, selectStation } = useStationSelection(stations)
  const { selectedStation: environmentStation, selectStation: selectEnvironmentStation } = useStationSelection(stations)
  const scene = useSceneNavigation()
  const agent = useAgentQuestion()
  const tour = useGuidedTour(state, agent.answer)
  const [recordTab, setRecordTab] = useState<'events' | 'production' | 'analysis'>('events')
  const [showAnalysis, setShowAnalysis] = useState(true)
  const parts = state?.scenario === 'batch' ? state.parts : state?.part ? [state.part] : []
  const transfers = state?.scenario === 'batch' ? state.transfers : state?.transfer ? [state.transfer] : []
  const trackedPart = scene.focus.kind === 'part' ? parts.find((part) => scene.focus.kind === 'part' && part.id === scene.focus.id) : undefined
  const trackedStationId = trackedPart ? transfers.find((item) => item.part_id === trackedPart.id)?.to_station_id ?? trackedPart.station_id : null
  const selectedStation = stations.find((station) => station.id === trackedStationId) ?? manualStation
  const relatedIds = showAnalysis && agent.answer?.run_id === state?.run_id
    ? agent.answer?.answer.related_station_ids.filter((id) => stations.some((station) => station.id === id)) ?? [] : []
  const faults = state?.stations.filter((station) => station.status === 'FAULTED') ?? []
  const partIds = [...new Set([...parts.map((part) => part.id), ...(state?.stations.flatMap((station) => station.current_part_id ? [station.current_part_id] : []) ?? [])])]

  function navigate(next: SpatialFocus, preserveAgent = false) {
    if (next.kind === 'station') {
      if (!stations.some((station) => station.id === next.id)) return
      selectStation(next.id)
    }
    if (next.kind === 'part') {
      const part = parts.find((item) => item.id === next.id)
      if (!part) return
      selectStation(part.station_id ?? transfers.find((item) => item.part_id === part.id)?.to_station_id ?? 'ST-05')
    }
    scene.navigate(next)
    if (!preserveAgent) scene.setPanel(next.kind === 'overview' || next.kind === 'line' ? null : 'selection')
  }
  function selectInScene(id: string) { navigate({ kind: 'station', id }) }
  function startProduction(batch = true) { void factory.start(batch) }
  function guideAction() {
    if (tour.step === 'produce') startProduction()
    else if (tour.step === 'fault' || tour.step === 'repair') {
      selectEnvironmentStation('ST-02'); scene.setPanel('controls')
    } else if (tour.step === 'analyze') scene.setPanel('agent')
    else if (tour.step === 'complete') { tour.end(); navigate({ kind: 'line' }) }
  }
  const selectionTitle = scene.focus.kind === 'station' ? selectedStation.name
    : scene.focus.kind === 'part' ? '차체 따라가기' : zoneLabels[scene.focus.kind]
  const closePanel = () => scene.setPanel(null)
  return <main className={styles.experience} aria-label="TruckWorks 공장 시뮬레이션">
    <ImmersiveViewport state={state} stations={stations} selectedId={selectedStation.id}
      parts={parts} transfers={transfers} focus={scene.focus} relatedIds={relatedIds} resetView={scene.resetView}
      show2D={scene.show2D} onSelect={selectInScene} onSelectPart={(id) => navigate({ kind: 'part', id })} onNavigate={navigate} />
    <SimulationHud state={state} connection={factory.connection} startupSeconds={factory.startupSeconds} sending={factory.sending} focus={scene.focus}
      stations={stations} onNavigate={navigate} onPanel={scene.setPanel} activePanel={scene.panel} onStart={() => startProduction()}
      onPause={() => { void factory.pause() }} onResume={() => { void factory.resume() }}
      onResetView={scene.resetCamera} show2D={scene.show2D} onToggle2D={scene.toggle2D} analyzing={agent.loading} />

    {factory.startupSeconds !== null && <ServerStartupNotice seconds={factory.startupSeconds} />}
    {tour.step !== 'off' && scene.panel === null && <div className={styles.leftOverlay}>
      <GuidedExperience step={tour.step} state={state} sending={factory.sending} onAction={guideAction} onEnd={tour.end} />
    </div>}
    {(factory.error || factory.commandError) && scene.panel !== 'controls' && <div className={styles.alert} role="alert">{factory.error ?? factory.commandError}</div>}
    {faults.length > 0 && scene.panel !== 'controls' && !factory.error && !factory.commandError && <button className={styles.faultNotice} onClick={() => {
      scene.setPanel('agent')
    }}><Icon name="warning" size={16} /> 설비 {faults.length}대 고장 · 원인 분석</button>}
    {agent.answer && scene.panel !== 'controls' && <div className={styles.analysisLegend}>
      <button aria-pressed={showAnalysis} onClick={() => setShowAnalysis((value) => !value)}>{showAnalysis ? '관련 설비 표시 끄기' : '관련 설비 표시 켜기'}</button>
      <span>{agent.answer.simulation_time_seconds.toFixed(1)}초 관측 · 현재 상태와 다를 수 있음</span>
    </div>}

    <SceneDrawer open={scene.panel === 'campus'} title="전체 공장 지도" onClose={closePanel}><CampusMenu focus={scene.focus} stations={stations} onNavigate={navigate} /></SceneDrawer>
    <SceneDrawer open={scene.panel === 'selection'} title={selectionTitle} onClose={closePanel}>
      <SceneSelection focus={scene.focus} state={state} station={selectedStation} parts={parts} transfers={transfers} />
    </SceneDrawer>
    <SceneDrawer open={scene.panel === 'agent'} title="AI 공장 분석" onClose={closePanel}>
      <SceneAgentPanel agent={agent} runId={state?.run_id}
        partIds={partIds} onSelectStation={(id) => navigate({ kind: 'station', id }, true)} />
      {(tour.step === 'repair' || tour.step === 'complete') && <div className={styles.tourContinuation}>
        <button disabled={factory.sending} onClick={() => { closePanel(); guideAction() }}>
          {tour.step === 'complete' ? '안내 마치기' : '공장 환경에서 복구하기'}
        </button>
      </div>}
    </SceneDrawer>
    <SceneDrawer id="factory-environment" side="left" open={scene.panel === 'controls'} title="공장 환경" onClose={closePanel}>
      {(factory.error || factory.commandError) && <p className={styles.environmentError} role="alert">{factory.error ?? factory.commandError}</p>}
      {tour.step !== 'off' && <div className={styles.environmentGuide}>
        <GuidedExperience step={tour.step} state={state} sending={factory.sending} onAction={guideAction} onEnd={tour.end} />
      </div>}
      <FactoryEnvironmentControls stations={stations} selectedStation={environmentStation} onSelect={selectEnvironmentStation}
        state={state} sending={factory.sending} onFault={(id) => { void factory.fault(id) }} onRepair={(id) => { void factory.repair(id) }} />
      <ProductionControls state={state} sending={factory.sending} onStart={startProduction} onPause={() => { void factory.pause() }}
        onResume={() => { void factory.resume() }} onReset={() => { void factory.reset() }} error={null} />
      <div className={styles.partPicker}><label htmlFor="scene-part">차체 따라가기</label>
        <select id="scene-part" value="" disabled={!parts.length} onChange={(event) => navigate({ kind: 'part', id: event.target.value })}>
          <option value="">차체 선택</option>{parts.map((part) => <option key={part.id} value={part.id}>#{part.production_number} · {part.phase === 'STORED' ? '보관' : '라인 내부'}</option>)}
        </select>
      </div>
    </SceneDrawer>
    <SceneDrawer open={scene.panel === 'records'} title="공장 기록" wide onClose={closePanel}>
      {scene.panel === 'records' && <>
        <nav className={styles.recordTabs} aria-label="기록 종류">
          {(['events', 'production', 'analysis'] as const).map((tab) => <button key={tab} aria-pressed={recordTab === tab} onClick={() => setRecordTab(tab)}>
            {{ events: '현재 이벤트', production: '생산 이력', analysis: '분석 이력' }[tab]}</button>)}
        </nav>
        {recordTab === 'events' ? <EventLog events={factory.events} connected={factory.connection === 'connected'} parts={parts} />
          : recordTab === 'production' ? <HistoryPanel /> : <AnalysisHistoryPanel runId={state?.run_id} />}
      </>}
    </SceneDrawer>
    <SceneDrawer open={scene.panel === 'about'} title="TruckWorks 소개" onClose={closePanel}>
      <div className={styles.about}>
        <h2>모형 트럭 생산 시뮬레이터</h2>
        <p>차체를 생산하고 설비 고장이 공정에 미치는 영향을 살펴볼 수 있습니다. AI 분석은 공장 상태와 작업 기록을 바탕으로 답변합니다.</p>
        <div className={styles.aboutJourney} aria-label="체험 흐름">
          <span><Icon name="play" />생산</span><span><Icon name="warning" />고장</span><span><Icon name="analysis" />분석</span><span><Icon name="reset" />복구</span>
        </div>
        <h3>사용 방법</h3><p>좌측 공장 환경 메뉴에서 설비를 선택해 고장을 발생시키세요. 장면의 설비를 클릭하면 상태를 살펴볼 수 있고, AI 공장 분석에서 원인과 영향을 물어볼 수 있습니다. 이동 중인 차체를 클릭하면 카메라가 따라갑니다.</p>
        <h3>현재 체험 범위</h3><p>차체 생산라인 1개, 차체 1개 또는 20개 생산, 고장·복구, 읽기 전용 AI 분석. 9개 구역 중 차체 라인 외에는 정적 전시입니다. 트럭·트레일러 조립, 완성차 검사·출하, 운행과 운행 전 AI 예측은 향후 구현할 기능입니다.</p>
        <h3>모형 공장</h3><p>공정 시간·불량률은 설계된 시뮬레이션 규칙입니다. 실제 공장이나 검사 AI의 측정 결과가 아닙니다.</p>
        <h3>조작</h3><p>좌클릭 드래그: 화면 이동 · 우클릭 드래그: 회전 · 휠: 확대 · Esc: 정보창 닫기 / 전체 보기. 키보드는 공장 지도와 공장 환경의 차체 선택을 사용하세요. 상단에는 현재 선택 위치가 표시됩니다. 3D 표시가 어려우면 2D 보기로 전환할 수 있습니다.</p>
        <button className={styles.welcomeAction} onClick={() => { navigate({ kind: 'line' }); if (state?.run_status === 'READY') tour.begin() }}>차체 라인 둘러보기</button>
      </div>
    </SceneDrawer>
    <p className={styles.interactionHint}><span>좌클릭 드래그 <b>이동</b></span><span>우클릭 드래그 <b>회전</b></span><span>휠 <b>확대</b></span><span>클릭 <b>설비·차체 선택</b></span><span><kbd>ESC</kbd> 돌아가기</span></p>
  </main>
}






