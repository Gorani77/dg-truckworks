import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import type { PartState } from '../api/factory'
import type { ScenePalette } from './sceneConfig'
import { ChassisAsset } from './assets/ChassisAsset'

type PartModelProps = {
  part: PartState
  position: [number, number, number]
  dimensions: { length: number; width: number; height: number }
  palette: ScenePalette
  onSelect: () => void
}

export function PartModel({ part, position, dimensions, palette, onSelect }: PartModelProps) {
  const group = useRef<Group>(null)
  const [initialPosition] = useState(position)
  const { invalidate } = useThree()
  const [x, y, z] = position
  const target = useMemo(() => new Vector3(x, y, z), [x, y, z])
  const color = part.quality === 'GOOD' ? palette.processing : part.quality === 'REJECTED' ? palette.fault : palette.material
  useLayoutEffect(() => { invalidate() }, [target, invalidate])
  useFrame((_, delta) => {
    if (group.current && group.current.position.distanceToSquared(target) > 0.000001) {
      // Smooth only toward the latest server pose, never advance simulation time.
      group.current.position.lerp(target, 1 - Math.exp(-18 * delta))
      invalidate()
    }
  })
  return <group ref={group} position={initialPosition} onClick={(event) => { event.stopPropagation(); onSelect() }}>
    <ChassisAsset stage={part.stage} dimensions={dimensions} color={color} />
  </group>
}
