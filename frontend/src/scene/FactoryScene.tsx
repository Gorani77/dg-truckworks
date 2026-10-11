import { useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import type { PartState, StationState, TransferState } from '../api/factory'
import type { StationSelectionProps } from '../features/factory/types'
import { StationModel } from './StationModel'
import { readScenePalette, stationX, STATION_SPACING } from './sceneConfig'
import { FactoryInfrastructure } from './FactoryInfrastructure'
import { PartModel } from './PartModel'
import { partPosition } from './partPosition'
import { SpatialCamera } from './SpatialCamera'
import { FactoryEnvironment } from './FactoryEnvironment'
import type { SpatialFocus } from './spatialNavigation'
import { getFactoryZone } from './factoryCampus'
import { FactoryLighting } from './FactoryLighting'

type FactorySceneProps = StationSelectionProps & {
  selectedId: string
  stationStates?: readonly StationState[]
  dimensions: { length: number; width: number; height: number }
  resetView: number
  fallback: ReactNode
  parts?: readonly PartState[]
  transfers?: readonly TransferState[]
  runId?: string
  focus?: SpatialFocus
  relatedIds?: readonly string[]
  onNavigate?: (focus: SpatialFocus) => void
  onSelectPart?: (id: string) => void
}

export default function FactoryScene({ stations, selectedId, onSelect, stationStates, dimensions, resetView, fallback,
  parts = [], transfers = [], runId, focus = { kind: 'line' }, relatedIds = [], onNavigate, onSelectPart }: FactorySceneProps) {
  const [palette] = useState(readScenePalette)
  const width = Math.max(8, stations.length * STATION_SPACING + 1)
  const tracked = focus.kind === 'part' ? parts.find((part) => part.id === focus.id) : undefined
  const zone = getFactoryZone(focus.kind)
  const target: [number, number, number] = tracked
    ? partPosition(tracked, transfers.find((item) => item.part_id === tracked.id), stations, stationStates, dimensions.height, parts)
    : focus.kind === 'station' ? [stationX(Math.max(0, stations.findIndex((station) => station.id === focus.id)), stations.length), 0.8, 0]
    : focus.kind === 'overview' ? [0, 0, 4]
    : zone ? [zone.position[0], .7, zone.position[2]] : [0, .7, 0]
  return (
    <Canvas orthographic camera={{ position: [6, 13, 18], zoom: 30, near: 0.1, far: 300 }}
      style={{ position: 'absolute', inset: 0 }}
      shadows dpr={[1, 1.5]} frameloop="demand" fallback={fallback}>
      <color attach="background" args={[palette.background]} />
      <FactoryLighting width={onNavigate ? 55 : width} palette={palette} />
      <SpatialCamera focus={focus} target={target} resetView={resetView} />
      {onNavigate && <FactoryEnvironment palette={palette} focus={focus} onNavigate={onNavigate} />}
      <FactoryInfrastructure count={stations.length} width={width} palette={palette} />
      {stations.map((station, index) => <StationModel key={station.id}
        station={station} state={stationStates?.find((state) => state.definition.id === station.id)}
        x={stationX(index, stations.length)} selected={(focus.kind === 'line' || focus.kind === 'station' || focus.kind === 'part') && station.id === selectedId}
        compact={focus.kind !== 'line' && focus.kind !== 'station' && focus.kind !== 'part'} related={relatedIds.includes(station.id)}
        quality={parts.find((part) => part.id === stationStates?.find((item) => item.definition.id === station.id)?.current_part_id)?.quality}
        onSelect={onSelect} palette={palette} dimensions={dimensions} hideMaterial={parts.length > 0} />)}
      {parts.map((part) => {
        const transfer = transfers.find((item) => item.part_id === part.id)
        return <PartModel key={`${runId}-${part.id}`} part={part}
          position={partPosition(part, transfer, stations, stationStates, dimensions.height, parts)}
          dimensions={dimensions} palette={palette}
          onSelect={() => onSelectPart ? onSelectPart(part.id) : onSelect(part.station_id ?? transfer?.to_station_id ?? 'ST-05')} />
      })}
    </Canvas>
  )
}



