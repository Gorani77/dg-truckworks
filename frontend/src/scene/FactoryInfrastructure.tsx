import type { ScenePalette } from './sceneConfig'
import { stationX, STATION_SPACING } from './sceneConfig'
import { Box, Cylinder } from './equipment/MechanicalParts'
import { WorldAsset } from './assets/WorldAsset'

export function FactoryInfrastructure({ count, width, palette }: {
  count: number; width: number; palette: ScenePalette
}) {
  return <group>
    <group scale={[width / 23, 1, 1]}>
      <WorldAsset name="line-deck" label="생산라인 바닥" fallback={
        <Box position={[0, -.05, 0]} size={[23, .1, 10.8]} color={palette.floor} />
      } />
    </group>
    {Array.from({ length: Math.max(0, count - 1) }, (_, index) =>
      <group key={index} position={[stationX(index, count) + STATION_SPACING / 2, 0, 0]}>
        <WorldAsset name="roller-conveyor" label="운반 롤러" fallback={<group>
          {[-.5, -.25, 0, .25, .5].map((x) => <Cylinder key={x} position={[x, .85, .45]}
            radius={.06} length={1.02} rotation={[Math.PI / 2, 0, 0]} color={palette.material} />)}
          <Box position={[0, .42, .45]} size={[.1, .8, .8]} color={palette.machine} />
        </group>} />
      </group>)}
  </group>
}
