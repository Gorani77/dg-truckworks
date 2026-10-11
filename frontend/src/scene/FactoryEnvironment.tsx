import { useState } from 'react'
import { Html } from '@react-three/drei'
import type { ScenePalette } from './sceneConfig'
import type { SpatialFocus } from './spatialNavigation'
import { factoryZones } from './factoryCampus'
import { Box } from './equipment/MechanicalParts'
import { WorldAsset } from './assets/WorldAsset'
import styles from './scene.module.css'

export function FactoryEnvironment({ palette, focus, onNavigate }: {
  palette: ScenePalette; focus: SpatialFocus; onNavigate: (focus: SpatialFocus) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  return <group>
    <WorldAsset name="campus-ground" label="전체 공장 기반" fallback={
      <Box position={[0, -.43, 4]} size={[82, .64, 74]} color={palette.floor} />
    } />
    {factoryZones.map(zone => {
      const active = focus.kind === zone.id || (focus.kind === 'forecast' && zone.id === 'driving')
      const detailed = active || hovered === zone.id
      return <group key={zone.id} position={zone.position}
        onClick={event => { event.stopPropagation(); onNavigate({ kind: zone.id }) }}
        onPointerOver={event => { event.stopPropagation(); setHovered(zone.id) }} onPointerOut={() => setHovered(null)}>
        {zone.model && <WorldAsset name={zone.model} label={zone.title} fallback={<group>
          <Box position={[0, -.02, 0]} size={[zone.footprint[0], .1, zone.footprint[1]]} color={palette.deck} />
          <Box position={[0, .65, 0]} size={[3, 1.3, 2]} color={palette.machine} />
        </group>} />}
        {detailed && <Box position={[0, .035, zone.footprint[1] / 2]} size={[zone.footprint[0] - .4, .025, .05]} color={palette.selected} />}
        {(focus.kind === 'overview' || detailed) && <Html position={[0, .65, zone.footprint[1] / 2 + .7]} center zIndexRange={[8, 0]} style={{ width: 'max-content' }}>
          <button className={styles.campusMarker} data-compact={focus.kind === 'overview' && !detailed} data-active={active} data-live={zone.id === 'line'}
            onClick={() => onNavigate({ kind: zone.id })} aria-label={`${zone.title} · ${zone.id === 'line' ? '생산 기능' : '정적 전시 · 기능 예정'}`}>
            <span>{zone.number}</span><strong>{zone.title}</strong>
            {detailed && <small>{zone.id === 'line' ? '생산 · AI 분석' : '정적 전시 · 기능 예정'}</small>}
          </button>
        </Html>}
      </group>
    })}
  </group>
}


