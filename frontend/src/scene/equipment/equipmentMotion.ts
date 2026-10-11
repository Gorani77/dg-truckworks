import type { PartState } from '../../api/factory'

export const equipmentAssets = {
  'ST-01': { slug: 'input-feeder', label: '소재 투입기', nodes: ['FeedLift'] },
  'ST-03': { slug: 'drilling-station', label: '구멍 가공기', nodes: ['DrillHead', 'DrillClampFront', 'DrillClampBack'] },
  'ST-04': { slug: 'inspection-gate', label: '품질 검사기', nodes: ['Scanner', 'InspectionSweep'] },
  'ST-05': { slug: 'sorting-storage', label: '분리·적재기', nodes: ['Diverter'] },
} as const
export type EquipmentId = keyof typeof equipmentAssets
export type NodePose = { x?: number; y?: number; z?: number; ry?: number; visible?: boolean }
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t) }

// Offsets from each GLB node's rest pose. No wall clock or quality calculation.
export function equipmentPose(id: EquipmentId, progress: number, active: boolean,
  quality?: PartState['quality']): Record<string, NodePose> {
  const p = clamp(progress)
  if (id === 'ST-01') return { FeedLift: { y: active ? -.265 * smooth(p / .35) * (1 - smooth((p-.55)/.4)) : 0 } }
  if (id === 'ST-03') {
    const cycle = clamp((p-.12)/.73) * 6
    const hole = Math.min(5, Math.floor(cycle))
    const phase = cycle-hole
    const xs = [-.576, .27, .612, -.576, .27, .612]
    const zs = [-.26, -.26, -.26, .26, .26, .26]
    const previous = Math.max(0, hole-1)
    const travel = smooth(phase/.2)
    const x = xs[previous] + (xs[hole]-xs[previous])*travel
    const z = zs[previous] + (zs[hole]-zs[previous])*travel
    const down = smooth((phase-.2)/.3) * (1-smooth((phase-.65)/.3))
    const release = 1-smooth((p-.9)/.1)
    const jaw = active ? .2*smooth(p/.12)*release : 0
    return {
      DrillHead: { x: active ? (x+.576)*release : 0, z: active ? z*release : 0,
        y: active && p >= .12 && p < .85 ? -.27*down : 0 },
      DrillClampFront: { z: -jaw }, DrillClampBack: { z: jaw },
    }
  }
  if (id === 'ST-04') return {
    Scanner: { z: active ? -.3+.6*smooth(p) : 0 },
    InspectionSweep: { z: .6*smooth(p), visible: active },
  }
  const side = quality === 'GOOD' ? -1 : quality === 'REJECTED' ? 1 : 0
  return { Diverter: { ry: active ? -side*Math.atan(1.9)*smooth(p/.2) : 0 } }
}
