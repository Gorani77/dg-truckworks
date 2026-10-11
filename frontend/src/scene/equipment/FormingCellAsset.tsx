import { Suspense, useEffect, useLayoutEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial } from 'three'
import type { Material, Object3D } from 'three'
import type { ScenePalette } from '../sceneConfig'
import { SceneBoundary } from '../SceneBoundary'
import { formingCellPose } from './formingCellMotion'
import styles from '../scene.module.css'

const MODEL_URL = `${import.meta.env.BASE_URL}models/forming-cell/forming-cell.glb`

type FormingCellAssetProps = {
  palette: ScenePalette; processing: boolean; progress: number; faulted: boolean
  fallback: ReactNode
}

function LoadedFormingCell({ palette, processing, progress, faulted }: Omit<FormingCellAssetProps, 'fallback'>) {
  const gltf = useGLTF(MODEL_URL)
  const { invalidate } = useThree()
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const materials = new Map<Material, Material>()
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      const cloneMaterial = (source: Material) => {
        let cloned = materials.get(source)
        if (!cloned) { cloned = source.clone(); materials.set(source, cloned) }
        if (cloned.transparent) cloned.depthWrite = false
        return cloned
      }
      object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material)
      const surface = Array.isArray(object.material) ? object.material[0] : object.material
      object.castShadow = !surface.transparent
      object.receiveShadow = !surface.transparent
    })
    const signal = [...materials.values()].find((material): material is MeshStandardMaterial =>
      material.name === 'Status_Lens' && material instanceof MeshStandardMaterial)
    const names = ['CarriageX', 'SpindleSlide', 'ClampFront', 'ClampBack'] as const
    const parts = Object.fromEntries(names.map((name) => {
      const object = scene.getObjectByName(name)
      if (!object) throw new Error(`형상 가공기 모델의 가동 부품이 없습니다: ${name}`)
      return [name, { object, rest: object.position.clone() }]
    })) as Record<typeof names[number], { object: Object3D; rest: Object3D['position'] }>
    return { scene, materials, parts, signal }
  }, [gltf.scene])

  useEffect(() => () => { model.materials.forEach((material) => material.dispose()) }, [model])
  useLayoutEffect(() => {
    const pose = formingCellPose(progress, processing)
    const { CarriageX, SpindleSlide, ClampFront, ClampBack } = model.parts
    CarriageX.object.position.copy(CarriageX.rest)
    CarriageX.object.position.x += pose.carriageX + .7
    SpindleSlide.object.position.copy(SpindleSlide.rest)
    SpindleSlide.object.position.y -= pose.spindleDrop
    ClampFront.object.position.copy(ClampFront.rest)
    ClampFront.object.position.z -= pose.jawTravel
    ClampBack.object.position.copy(ClampBack.rest)
    ClampBack.object.position.z += pose.jawTravel
    if (model.signal) {
      const color = faulted ? palette.fault : processing ? palette.processing : palette.rail
      model.signal.color.set(color)
      model.signal.emissive.set(color)
      model.signal.emissiveIntensity = faulted ? .65 : processing ? .35 : 0
    }
    invalidate()
  }, [model, progress, processing, faulted, palette, invalidate])
  return <primitive object={model.scene} dispose={null} />
}

function ModelNotice({ children }: { children: ReactNode }) {
  return <Html position={[0, 3.2, 0]} center zIndexRange={[7, 0]} style={{ pointerEvents: 'none' }}>
    <span className={styles.binLabel}>{children}</span>
  </Html>
}

export function FormingCellAsset({ fallback, ...props }: FormingCellAssetProps) {
  return <SceneBoundary fallback={<>{fallback}<ModelNotice>모델 로드 실패 · 기본 설비 표시</ModelNotice></>}>
    <Suspense fallback={<>{fallback}<ModelNotice>형상 가공기 모델 준비 중…</ModelNotice></>}>
      <LoadedFormingCell {...props} />
    </Suspense>
  </SceneBoundary>
}
