type Vector3 = [number, number, number]

type BoxProps = {
  position: Vector3
  size: Vector3
  color: string
  rotation?: Vector3
  opacity?: number
}

export function Box({ position, size, color, rotation, opacity = 1 }: BoxProps) {
  return <mesh position={position} rotation={rotation} castShadow={opacity === 1} receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} metalness={0.35} roughness={0.55}
      transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
  </mesh>
}

type CylinderProps = {
  position: Vector3
  radius: number
  length: number
  color: string
  rotation?: Vector3
}

export function Cylinder({ position, radius, length, color, rotation }: CylinderProps) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[radius, radius, length, 16]} />
    <meshStandardMaterial color={color} metalness={0.65} roughness={0.35} />
  </mesh>
}
