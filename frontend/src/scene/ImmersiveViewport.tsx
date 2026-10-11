import { lazy, Suspense } from 'react'
import type { FactoryState, PartState, TransferState } from '../api/factory'
import type { StationDefinition } from '../features/factory/types'
import { chassisLine } from '../features/factory/data/chassisLine'
import { SceneBoundary } from './SceneBoundary'
import { Icon } from '../components/Icon'
import { FactoryLayoutPreview } from './FactoryLayoutPreview'
import { factoryZones } from './factoryCampus'
import type { SpatialFocus } from './spatialNavigation'
import styles from './scene.module.css'

const FactoryScene = lazy(() => import('./FactoryScene'))

export function ImmersiveViewport({ state, stations, selectedId, parts, transfers, focus, relatedIds,
  resetView, show2D, onSelect, onSelectPart, onNavigate }: {
  state: FactoryState | null; stations: readonly StationDefinition[]; selectedId: string
  parts: readonly PartState[]; transfers: readonly TransferState[]; focus: SpatialFocus; relatedIds: readonly string[]
  resetView: number; show2D: boolean; onSelect: (id: string) => void; onSelectPart: (id: string) => void
  onNavigate: (focus: SpatialFocus) => void
}) {
  const fallback = <div className={styles.immersiveFallback}>
    <p>{show2D ? '2D 생산라인' : '3D 장면을 표시할 수 없어 2D 배치도를 보여줍니다.'} · 설비를 선택해 조작할 수 있습니다. 구역 이동은 상단 탐색 메뉴를 사용하세요.</p>
    <nav className={styles.campusMap} aria-label="전체 공장 구역 배치">{factoryZones.map(zone => <button key={zone.id} onClick={() => onNavigate({ kind: zone.id })} aria-pressed={focus.kind === zone.id}><span>{zone.number}</span><strong>{zone.title}</strong><small>{zone.id === 'line' ? '현재 생산 기능' : '정적 전시 · 기능 예정'}</small></button>)}</nav>
    <FactoryLayoutPreview stations={stations} selectedId={selectedId} onSelect={onSelect} />
  </div>
  return <div className={styles.immersiveCanvas} aria-label="3D 공장. 좌클릭 드래그로 이동, 우클릭 드래그로 회전, 휠로 확대. 상단 탐색 메뉴에서도 설비를 선택할 수 있습니다.">
    {show2D ? fallback : <SceneBoundary fallback={fallback}>
      <Suspense fallback={<div className={styles.sceneLoading} role="status"><div className={styles.loadingContent}><Icon name="factory" size={32} /><strong>공장으로 들어가는 중</strong><span>3D 장면을 준비하고 있습니다.</span><i /></div></div>}>
        <FactoryScene stations={stations} selectedId={selectedId} onSelect={onSelect}
          stationStates={state?.stations} dimensions={state?.configuration.chassis_dimensions_mm ?? chassisLine.chassisDimensionsMm}
          resetView={resetView} fallback={fallback} parts={parts} transfers={transfers} runId={state?.run_id}
          focus={focus} relatedIds={relatedIds} onNavigate={onNavigate} onSelectPart={onSelectPart} />
      </Suspense>
    </SceneBoundary>}
  </div>
}



