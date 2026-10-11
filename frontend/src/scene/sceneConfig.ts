// Display units: 1 unit = 100 mm. Machine sizes are schematic, not CAD dimensions.
export const MM_PER_UNIT = 100
export const STATION_SPACING = 4.4

export function stationX(index: number, count: number) {
  return (index - (count - 1) / 2) * STATION_SPACING
}

export function readScenePalette() {
  const css = getComputedStyle(document.documentElement)
  const read = (name: string) => css.getPropertyValue(name).trim()
  return {
    background: read('--color-viewport'),
    floor: read('--scene-floor'),
    machine: read('--scene-machine'),
    shell: read('--scene-shell'),
    glass: read('--scene-glass'),
    deck: read('--scene-deck'),
    rail: read('--scene-rail'),
    material: read('--scene-material'),
    selected: read('--color-accent'),
    processing: read('--scene-processing'),
    fault: read('--scene-fault'),
    grid: read('--scene-grid'),
    lightSky: read('--scene-light-sky'),
    lightGround: read('--scene-light-ground'),
    lightKey: read('--scene-light-key'),
    lightRim: read('--scene-light-rim'),
    reflectionTop: read('--scene-reflection-top'),
    reflectionWarm: read('--scene-reflection-warm'),
    reflectionCool: read('--scene-reflection-cool'),
  }
}

export type ScenePalette = ReturnType<typeof readScenePalette>
