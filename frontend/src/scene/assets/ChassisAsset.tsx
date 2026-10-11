import { useMemo } from 'react'
import { Path, Shape } from 'three'
import type { PartState } from '../../api/factory'
import { MM_PER_UNIT } from '../sceneConfig'
import { Box } from '../equipment/MechanicalParts'
import { WorldAsset } from './WorldAsset'
import type { WorldAssetName } from './WorldAsset'

type Props = {
  stage: PartState['stage']
  dimensions: { length: number; width: number; height: number }
  color: string
}

const assets: Record<PartState['stage'], WorldAssetName> = {
  RAW: 'chassis-raw', FRAME: 'chassis-formed', DRILLED: 'chassis-drilled',
}

function ChassisFallback({ stage, color }: Pick<Props, 'stage' | 'color'>) {
  const shape = useMemo(() => {
    const result = new Shape()
    result.moveTo(-.9, -.06); result.lineTo(.9, -.06)
    result.lineTo(.9, .06); result.lineTo(-.9, .06); result.closePath()
    if (stage === 'DRILLED') {
      for (const x of [-.576, .27, .612]) {
        const hole = new Path()
        hole.absarc(x, 0, .0264, 0, Math.PI * 2, true)
        result.holes.push(hole)
      }
    }
    return result
  }, [stage])
  if (stage === 'RAW') return <Box position={[0, 0, 0]} size={[1.8, .12, .6]} color={color} />
  return <group>
    {[-1, 1].map((side) => <mesh key={side} position={[0, 0, side * .26 - .04]} castShadow>
      <extrudeGeometry args={[shape, { depth: .08, bevelEnabled: false, curveSegments: 12 }]} />
      <meshStandardMaterial color={color} metalness={.6} roughness={.4} />
    </mesh>)}
    {[-.63, 0, .63].map((x) => <Box key={x} position={[x, 0, 0]} size={[.08, .12, .44]} color={color} />)}
  </group>
}

export function ChassisAsset({ stage, dimensions, color }: Props) {
  // Authored around the product center at 180 x 60 x 12 mm; server dimensions remain authoritative.
  return <group scale={[dimensions.length / MM_PER_UNIT / 1.8, dimensions.height / MM_PER_UNIT / .12,
    dimensions.width / MM_PER_UNIT / .6]}>
    <WorldAsset name={assets[stage]} label="생산 차체" productColor={color}
      fallback={<ChassisFallback stage={stage} color={color} />} />
  </group>
}
