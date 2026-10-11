import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MOUSE, OrthographicCamera, Vector3 } from 'three'
import type { SpatialFocus } from './spatialNavigation'

export function SpatialCamera({ focus, target, resetView }: {
  focus: SpatialFocus; target: [number, number, number]; resetView: number
}) {
  const { camera, size, invalidate } = useThree()
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const moving = useRef(true)
  const manualView = useRef(false)
  const previousReset = useRef<number | null>(null)
  const framing = useRef({ zoom: 1, offset: new Vector3(28, 55, 65) })
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [x, y, z] = target
  const destination = useMemo(() => new Vector3(x, y, z), [x, y, z])
  const initialZoom = Math.max(1, Math.min(size.width / 120, size.height / (120 * 0.65)))
  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCamera) || !controls.current) return
    const reset = previousReset.current === null || previousReset.current !== resetView
    previousReset.current = resetView
    framing.current = {
      zoom: reset ? initialZoom : camera.zoom,
      offset: reset ? new Vector3(28, 55, 65) : camera.position.clone().sub(controls.current.target),
    }
    manualView.current = false
    moving.current = true
    invalidate()
  }, [focus, resetView, initialZoom, camera, invalidate])
  useLayoutEffect(() => {
    if (!manualView.current) { moving.current = true; invalidate() }
  }, [destination, invalidate])
  useFrame((_, delta) => {
    if (!moving.current || !controls.current || !(camera instanceof OrthographicCamera)) return
    const { zoom, offset } = framing.current
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


