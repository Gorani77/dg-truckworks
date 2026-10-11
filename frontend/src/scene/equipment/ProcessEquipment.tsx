import { Html } from '@react-three/drei'
import type { ScenePalette } from '../sceneConfig'
import { Box, Cylinder } from './MechanicalParts'
import styles from '../scene.module.css'
import { FormingCellAsset } from './FormingCellAsset'
import { EquipmentAsset } from './EquipmentAsset'
import type { PartState } from '../../api/factory'

type EquipmentProps = { palette: ScenePalette; processing: boolean; progress: number }

function InputFeeder({ palette, processing, progress }: EquipmentProps) {
  const lift = processing ? Math.sin(progress * Math.PI) * 0.35 : 0
  return <group>
    {/* Empty magazine slots are machinery, not fabricated inventory. */}
    {[-1.1, -0.3].flatMap((x) => [-1.7, -0.8].map((z) =>
      <Box key={`${x}-${z}`} position={[x, 1.15, z]} size={[0.09, 1.9, 0.09]} color={palette.rail} />))}
    {[0.45, 0.9, 1.35, 1.8].map((y) => <group key={y}>
      <Box position={[-0.7, y, -1.7]} size={[0.88, 0.06, 0.1]} color={palette.shell} />
      <Box position={[-0.7, y, -0.8]} size={[0.88, 0.06, 0.1]} color={palette.shell} />
    </group>)}
    <Box position={[-0.7, 0.32, -1.25]} size={[1.15, 0.35, 1.15]} color={palette.machine} />
    <Box position={[0.55, 1.35, -1.35]} size={[0.32, 2.35, 0.4]} color={palette.shell} />
    <Box position={[0.55, 2.48, -0.52]} size={[0.26, 0.2, 2]} color={palette.rail} />
    <Cylinder position={[0.55, 1.92 + lift, 0.25]} radius={0.075} length={0.8} color={palette.material} />
    <Box position={[0.55, 1.5 + lift, 0.25]} size={[0.7, 0.12, 0.45]} color={palette.machine} />
    {[-0.23, 0.23].map((x) => <Box key={x} position={[0.55 + x, 1.39 + lift, 0.25]}
      size={[0.1, 0.2, 0.35]} color={palette.rail} />)}
    <Box position={[1.18, 0.65, -1.35]} size={[0.5, 0.85, 0.5]} color={palette.deck} />
  </group>
}

function FormingCell({ palette, processing, progress }: EquipmentProps) {
  const headX = processing ? -0.65 + 1.3 * progress : -0.65
  return <group>
    <Box position={[0, 1.5, -1.65]} size={[2.8, 2.3, 0.18]} color={palette.shell} />
    <Box position={[-1.33, 0.68, -0.35]} size={[0.18, 0.65, 2.5]} color={palette.shell} />
    <Box position={[-1.33, 2.42, -0.35]} size={[0.18, 0.45, 2.5]} color={palette.shell} />
    <Box position={[1.33, 1.5, -0.35]} size={[0.18, 2.3, 2.5]} color={palette.shell} />
    <Box position={[0, 2.68, -1.4]} size={[2.85, 0.18, 0.55]} color={palette.machine} />
    <Box position={[0, 2.15, -0.2]} size={[2.4, 0.16, 0.2]} color={palette.rail} />
    <Box position={[headX, 1.84, -0.2]} size={[0.5, 0.55, 0.55]} color={palette.deck} />
    <Cylinder position={[headX, 1.48, -0.2]} radius={0.11} length={0.3} color={palette.material} />
    <Box position={[-1.435, 1.55, -0.3]} size={[0.025, 1.3, 1.5]} color={palette.glass} opacity={0.3} />
    <Box position={[0, 2.45, 1.02]} size={[2.55, 0.13, 0.08]} color={palette.selected} />
    <Box position={[1.1, 1.56, 1.03]} size={[0.32, 0.55, 0.12]} color={palette.deck} />
    <Box position={[1.1, 1.65, 1.105]} size={[0.23, 0.22, 0.025]} color={palette.glass} />
    <Box position={[0, 0.55, -0.25]} size={[2.1, 0.2, 1.8]} color={palette.machine} />
  </group>
}

function DrillingStation({ palette, processing, progress }: EquipmentProps) {
  const travel = processing ? Math.sin(progress * Math.PI) * 0.35 : 0
  return <group>
    <Box position={[0, 1.45, -1.18]} size={[0.48, 2.5, 0.5]} color={palette.shell} />
    <Box position={[0, 2.68, -0.45]} size={[0.65, 0.4, 1.9]} color={palette.machine} />
    <Cylinder position={[0, 2.62, -1.12]} radius={0.25} length={0.65} color={palette.deck} />
    <Cylinder position={[0, 2.14 - travel, 0.45]} radius={0.18} length={0.65} color={palette.rail} />
    <Cylinder position={[0, 1.67 - travel, 0.45]} radius={0.055} length={0.32} color={palette.material} />
    <mesh position={[0, 1.48 - travel, 0.45]} rotation={[Math.PI, 0, 0]} castShadow>
      <coneGeometry args={[0.055, 0.09, 12]} />
      <meshStandardMaterial color={palette.material} metalness={0.7} roughness={0.3} />
    </mesh>
    {[-0.85, 0.85].map((x) => <group key={x}>
      <Box position={[x, 1.02, 0.45]} size={[0.22, 0.2, 0.9]} color={palette.rail} />
      <Cylinder position={[x, 1.17, 0.45]} radius={0.055} length={0.32} color={palette.selected} />
    </group>)}
    <Box position={[0.72, 1.1, -1.18]} size={[0.6, 0.7, 0.55]} color={palette.deck} />
  </group>
}

function InspectionGate({ palette, processing, progress }: EquipmentProps) {
  return <group>
    {[-1.25, 1.25].map((x) => <Box key={x} position={[x, 1.55, 0.4]}
      size={[0.2, 2.5, 0.3]} color={palette.shell} />)}
    <Box position={[0, 2.85, 0.4]} size={[2.7, 0.22, 0.35]} color={palette.shell} />
    <Box position={[0, 2.61, 0.4]} size={[0.6, 0.28, 0.45]} color={palette.deck} />
    <Cylinder position={[0, 2.39, 0.4]} radius={0.12} length={0.18} color={palette.glass} />
    {[-1, 1].map((x) => <Box key={x} position={[x, 1.6, 0.4]}
      size={[0.06, 1, 0.07]} color={processing ? palette.processing : palette.rail} />)}
    {processing && <mesh position={[0, 1.13, -0.1 + progress * 1.1]}>
      <boxGeometry args={[2.1, 0.012, 0.035]} />
      <meshBasicMaterial color={palette.processing} transparent opacity={0.65} />
    </mesh>}
    <Box position={[1.1, 1.1, -1.1]} size={[0.12, 1.5, 0.12]} color={palette.rail} />
    <Box position={[1.1, 1.9, -1.1]} size={[0.65, 0.5, 0.12]} color={palette.deck} />
    <Box position={[1.1, 1.9, -1.025]} size={[0.52, 0.35, 0.025]} color={palette.glass} />
  </group>
}

function SortingStorage({ palette }: EquipmentProps) {
  return <group>
    <Cylinder position={[0.15, 0.88, 0.45]} radius={0.4} length={0.1} color={palette.rail} />
    <Box position={[0.15, 0.96, 0.45]} size={[1.1, 0.1, 0.48]} color={palette.deck} />
    {[-1, 1].map((side) => <group key={side}>
      <Box position={[0.75, 0.82, 0.45 + side * 0.95]} size={[1.45, 0.12, 0.65]}
        rotation={[0, -side * Math.PI / 4, 0]} color={palette.rail} />
      <group position={[1, 0, 0.45 + side * 1.9]}>
        <Box position={[0, 0.28, 0]} size={[1.25, 0.18, 1]} color={palette.deck} />
        {[-0.6, 0.6].map((x) => <Box key={x} position={[x, 0.57, 0]}
          size={[0.07, 0.65, 1]} color={palette.shell} />)}
        {[-0.47, 0.47].map((z) => <Box key={z} position={[0, 0.57, z]}
          size={[1.2, 0.65, 0.07]} color={palette.shell} />)}
        <Html position={[0, 0.95, 0]} center zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
          <span className={styles.binLabel}>{side < 0 ? '양품 보관' : '불량 분리'}</span>
        </Html>
      </group>
    </group>)}
  </group>
}

const assemblies = {
  'ST-01': InputFeeder, 'ST-02': FormingCell, 'ST-03': DrillingStation,
  'ST-04': InspectionGate, 'ST-05': SortingStorage,
}

export function ProcessEquipment({ stationId, faulted = false, quality, ...props }: EquipmentProps & { stationId: string; faulted?: boolean; quality?: PartState['quality'] }) {
  if (stationId === 'ST-02') return <FormingCellAsset {...props} faulted={faulted}
    fallback={<>
      <Box position={[0, 0.6, 0.45]} size={[2.8, 0.48, 1]} color={props.palette.machine} />
      <Box position={[0, 0.87, 0.45]} size={[2.85, 0.06, 0.9]} color={props.palette.deck} />
      <FormingCell {...props} />
    </>} />
  const Assembly = assemblies[stationId as keyof typeof assemblies]
  if (Assembly && (stationId === 'ST-01' || stationId === 'ST-03' || stationId === 'ST-04' || stationId === 'ST-05')) {
    return <EquipmentAsset {...props} stationId={stationId} faulted={faulted} quality={quality} fallback={<>
      <Box position={[0, 0.6, 0.45]} size={[2.8, 0.48, 1]} color={props.palette.machine} />
      <Box position={[0, 0.87, 0.45]} size={[2.85, 0.06, 0.9]} color={props.palette.deck} />
      <Assembly {...props} />
    </>} />
  }
  return Assembly ? <Assembly {...props} /> : null
}
