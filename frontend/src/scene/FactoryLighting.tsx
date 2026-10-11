import { Environment, Lightformer } from '@react-three/drei'
import type { ScenePalette } from './sceneConfig'

// A locally generated reflection environment: no remote HDR dependency.
// Lightformers shape metal/glass reflections; direct lights provide shadows.
export function FactoryLighting({ width, palette }: { width: number; palette: ScenePalette }) {
  return <>
    <ambientLight intensity={0.35} />
    <hemisphereLight args={[palette.lightSky, palette.lightGround, 0.65]} />
    <directionalLight position={[-20, 60, 30]} color={palette.lightKey} intensity={2.6} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-width} shadow-camera-right={width}
      shadow-camera-top={width} shadow-camera-bottom={-width}
      shadow-camera-near={0.5} shadow-camera-far={180} shadow-bias={-0.0001} shadow-normalBias={0.025} />
    <directionalLight position={[5, 7, -9]} color={palette.lightRim} intensity={1.1} />
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={3} color={palette.reflectionTop} position={[0, 10, 0]}
        rotation={[Math.PI / 2, 0, 0]} scale={[16, 6, 1]} />
      <Lightformer form="rect" intensity={2} color={palette.reflectionWarm} position={[-10, 4, 5]}
        rotation={[0, Math.PI / 2, 0]} scale={[5, 8, 1]} />
      <Lightformer form="rect" intensity={2} color={palette.reflectionCool} position={[8, 5, -8]}
        rotation={[0, -Math.PI / 2, 0]} scale={[3, 9, 1]} />
    </Environment>
  </>
}

