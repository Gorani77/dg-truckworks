import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MOUSE, OrthographicCamera, Vector3 } from 'three'
import { getFactoryZone } from './factoryCampus'
import type { SpatialFocus } from './spatialNavigation'

export function SpatialCamera({ focus, target, resetView }: {
  focus: SpatialFocus; target: [number, number, number]; resetView: number
}) {
  const { camera, size, invalidate } = useThree()
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const moving = useRef(true)
  const manualView = useRef(false)
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [x, y, z] = target
  const destination = useMemo(() => new Vector3(x, y, z), [x, y, z])
  const close = focus.kind === 'station' || focus.kind === 'part'
  const span = focus.kind === 'overview' ? 120 : close ? 11 : getFactoryZone(focus.kind)?.span ?? 29
  const zoom = Math.max(1, Math.min(size.width / span, size.height / (span * 0.65)))
  const offset = useMemo(() => new Vector3(close ? 5 : 28, close ? 8 : 55, close ? 10 : 65), [close])
  useLayoutEffect(() => {
    manualView.current = false
    moving.current = true
    invalidate()
  }, [focus, resetView, zoom, invalidate])
  useLayoutEffect(() => {
    if (!manualView.current) { moving.current = true; invalidate() }
  }, [destination, invalidate])
  useFrame((_, delta) => {
    if (!moving.current || !controls.current || !(camera instanceof OrthographicCamera)) return
    const position = destination.clone().add(offset)
    const weight = reducedMotion ? 1 : 1 - Math.exp(-5 * Math.min(delta, 0.1))
    camera.position.lerp(position, weight)
    controls.current.target.lerp(destination, weight)
    camera.zoom += (zoom - camera.zoom) * weight
    camera.updateProjectionMatrix()
    controls.current.update()
    moving.current = camera.position.distanceToSquared(position) > 0.0001
      || controls.current.target.distanceToSquared(destination) > 0.0001 || Math.abs(camera.zoom - zoom) > 0.01
    if (moving.current) invalidate()
  })
  return <OrbitControls ref={controls} makeDefault enablePan screenSpacePanning
    mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
    minZoom={1} maxZoom={140} minPolarAngle={0.25} maxPolarAngle={Math.PI / 2.2}
    onStart={() => { manualView.current = true; moving.current = false }} />
}


