import { Suspense, useEffect, useLayoutEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial } from 'three'
import type { Material } from 'three'
import type { PartState } from '../../api/factory'
import type { ScenePalette } from '../sceneConfig'
import { SceneBoundary } from '../SceneBoundary'
import { equipmentAssets, equipmentPose } from './equipmentMotion'
import type { EquipmentId } from './equipmentMotion'
import styles from '../scene.module.css'

type Props = { stationId: EquipmentId; palette: ScenePalette; processing: boolean; progress: number
  faulted: boolean; quality?: PartState['quality']; fallback: ReactNode }

function LoadedEquipment({ stationId, palette, processing, progress, faulted, quality }: Omit<Props, 'fallback'>) {
  const spec = equipmentAssets[stationId]
  const gltf = useGLTF(`${import.meta.env.BASE_URL}models/${spec.slug}/${spec.slug}.glb`)
  const { invalidate } = useThree()
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const materials = new Map<Material, Material>()
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      function clone(source: Material) {
        let material = materials.get(source)
        if (!material) { material = source.clone(); materials.set(source, material) }
        if (material.transparent) material.depthWrite = false
        return material
      }
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material)
      const surfaces = Array.isArray(object.material) ? object.material : [object.material]
      object.castShadow = surfaces.every((material) => !material.transparent)
      object.receiveShadow = object.castShadow
    })
    const signal = [...materials.values()].find((material): material is MeshStandardMaterial =>
      material.name === 'Status_Lens' && material instanceof MeshStandardMaterial)
    const parts = spec.nodes.map((name) => {
      const object = scene.getObjectByName(name)
      if (!object) { materials.forEach((material) => material.dispose()); throw new Error(`가동 노드 없음: ${name}`) }
      return { name, object, position: object.position.clone(), rotation: object.rotation.clone() }
    })
    return { scene, materials, signal, parts }
  }, [gltf.scene, spec])
  useEffect(() => () => model.materials.forEach((material) => material.dispose()), [model])
  useLayoutEffect(() => {
    const poses = equipmentPose(stationId, progress, processing, quality)
    for (const part of model.parts) {
      const pose = poses[part.name] ?? {}
      part.object.position.copy(part.position)
      part.object.position.x += pose.x ?? 0
      part.object.position.y += pose.y ?? 0
      part.object.position.z += pose.z ?? 0
      part.object.rotation.copy(part.rotation)
      part.object.rotation.y += pose.ry ?? 0
      part.object.visible = pose.visible ?? true
    }
    if (model.signal) {
      const color = faulted ? palette.fault : processing ? palette.processing : palette.rail
      model.signal.color.set(color); model.signal.emissive.set(color)
      model.signal.emissiveIntensity = faulted ? .65 : processing ? .35 : 0
    }
    invalidate()
  }, [model, stationId, processing, progress, faulted, quality, palette, invalidate])
  return <primitive object={model.scene} dispose={null} />
}

export function EquipmentAsset({ fallback, ...props }: Props) {
  const notice = (message: string) => <>{fallback}<Html position={[0, 3.2, 0]} center zIndexRange={[7, 0]} style={{ pointerEvents: 'none' }}>
    <span className={styles.binLabel}>{equipmentAssets[props.stationId].label} · {message}</span>
  </Html></>
  return <SceneBoundary fallback={notice('모델 로드 실패 · 기본 설비 표시')}>
    <Suspense fallback={notice('모델 준비 중…')}><LoadedEquipment {...props} /></Suspense>
  </SceneBoundary>
}
