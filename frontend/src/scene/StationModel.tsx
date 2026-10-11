import { Html } from '@react-three/drei'
import type { PartState, StationState } from '../api/factory'
import type { StationDefinition } from '../features/factory/types'
import { StationMarker } from './StationMarker'
import { MM_PER_UNIT } from './sceneConfig'
import type { ScenePalette } from './sceneConfig'
import { Box } from './equipment/MechanicalParts'
import { ProcessEquipment } from './equipment/ProcessEquipment'
import { WorldAsset } from './assets/WorldAsset'
import { ChassisAsset } from './assets/ChassisAsset'

import { useState } from 'react'

type StationModelProps = {
  station: StationDefinition
  state?: StationState
  x: number
  selected: boolean
  palette: ScenePalette
  dimensions: { length: number; width: number; height: number }
  onSelect: (id: string) => void
  hideMaterial?: boolean
  compact?: boolean
  related?: boolean
  quality?: PartState['quality']
}

export function StationModel({ station, state, x, selected, palette, dimensions, onSelect, hideMaterial, compact, related, quality }: StationModelProps) {
  const [hovered, setHovered] = useState(false)
  const processing = state?.status === 'PROCESSING'
  const holdProcessPose = processing || (state?.status === 'FAULTED' && state.status_before_fault === 'PROCESSING')
  const progress = state ? Math.min(1, Math.max(0, 1 - state.remaining_process_seconds / station.processSeconds)) : 0
  const length = dimensions.length / MM_PER_UNIT
  const width = dimensions.width / MM_PER_UNIT
  const height = dimensions.height / MM_PER_UNIT

  return (
    <group position={[x, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelect(station.id) }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true) }} onPointerOut={() => setHovered(false)}>
      <WorldAsset name="station-plinth" label="설비 받침" fallback={<Box position={[0, 0.08, -0.15]} size={[3.5, 0.16, 3.6]} color={palette.deck} />} />
      {[-1.7, 1.7].map((edge) => <Box key={edge} position={[edge, 0.17, -0.15]}
        size={[0.035, 0.025, 3.5]} color={related ? palette.processing : selected || hovered ? palette.selected : palette.rail} />)}
      {related && <mesh position={[0, 0.19, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.95, 2.03, 48]} /><meshBasicMaterial color={palette.processing} transparent opacity={0.85} />
      </mesh>}
      {station.id !== 'ST-01' && <group position={[0, 0, 1.4]} scale={[(length + .12) / 1.92, 1, (width + .1) / .7]}>
        <WorldAsset name="queue-pallet" label="대기 팔레트" fallback={
          <Box position={[0, .21, 0]} size={[1.92, .06, .7]} color={palette.deck} />
        } />
      </group>}
      <ProcessEquipment stationId={station.id} palette={palette} processing={holdProcessPose} progress={progress}
        faulted={state?.status === 'FAULTED'} quality={quality} />
      {!hideMaterial && state?.current_part_id && <group position={[0, .91 + height / 2, .45]}>
        <ChassisAsset stage="RAW" dimensions={dimensions} color={palette.material} />
      </group>}
      {holdProcessPose && progress > 0 && <mesh position={[-1.2 + progress * 1.2, 0.62, 0.96]}>
        <boxGeometry args={[2.4 * progress, 0.06, 0.015]} />
        <meshBasicMaterial color={state?.status === 'FAULTED' ? palette.fault : palette.processing} />
      </mesh>}
      {(!compact || hovered || state?.status === 'FAULTED') && <Html position={[0, 0.18, 1.8]} center zIndexRange={[7, 0]} style={{ pointerEvents: 'none' }}>
        <StationMarker station={station} state={state} selected={selected} expanded={selected || hovered}
          related={related} progress={progress} active={holdProcessPose} />
      </Html>}
    </group>
  )
}


