import { Suspense, useEffect, useLayoutEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial } from 'three'
import type { Material } from 'three'
import { SceneBoundary } from '../SceneBoundary'
import styles from '../scene.module.css'

export type WorldAssetName = 'factory-hall' | 'storage-racks' | 'assembly-display' | 'line-deck'
  | 'roller-conveyor' | 'station-plinth' | 'queue-pallet'
  | 'chassis-raw' | 'chassis-formed' | 'chassis-drilled'
  | 'campus-ground' | 'axle-cell' | 'cab-finishing' | 'final-assembly'
  | 'trailer-cell' | 'vehicle-inspection' | 'dispatch-yard' | 'proving-ground'

type Props = {
  name: WorldAssetName
  fallback: ReactNode
  label: string
  productColor?: string
}

function LoadedAsset({ name, productColor }: Pick<Props, 'name' | 'productColor'>) {
  const gltf = useGLTF(`${import.meta.env.BASE_URL}models/${name}/${name}.glb`)
  const { invalidate } = useThree()
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const owned = new Map<Material, MeshStandardMaterial>()
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      // Static geometry/materials stay shared. Only per-product quality tint is mutable.
      const surface = (source: Material) => {
        if (source.name !== 'Product_Metal' || !(source instanceof MeshStandardMaterial)) return source
        let copy = owned.get(source)
        if (!copy) { copy = source.clone(); owned.set(source, copy) }
        return copy
      }
      object.material = Array.isArray(object.material) ? object.material.map(surface) : surface(object.material)
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      object.castShadow = materials.every((material) => !material.transparent)
      object.receiveShadow = object.castShadow
    })
    return { scene, owned }
  }, [gltf.scene])
  useEffect(() => () => model.owned.forEach((material) => material.dispose()), [model])
  useLayoutEffect(() => {
    if (productColor) model.owned.forEach((material) => material.color.set(productColor))
    invalidate()
  }, [model, productColor, invalidate])
  return <primitive object={model.scene} dispose={null} />
}

export function WorldAsset({ fallback, label, ...props }: Props) {
  const failed = <>{fallback}<Html position={[0, 1.5, 0]} center zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
    <span className={styles.binLabel}>{label} · 모델 로드 실패 / 기본 모형 표시</span>
  </Html></>
  return <SceneBoundary key={props.name} fallback={failed}>
    <Suspense fallback={fallback}><LoadedAsset {...props} /></Suspense>
  </SceneBoundary>
}

