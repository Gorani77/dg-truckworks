import type { PartState, StationState, TransferState } from '../api/factory'
import type { StationDefinition } from '../features/factory/types'
import { MM_PER_UNIT, stationX } from './sceneConfig'

export function partPosition(
  part: PartState, transfer: TransferState | null | undefined,
  stations: readonly StationDefinition[], states: readonly StationState[] | undefined,
  heightMm: number,
  parts: readonly PartState[] = [],
): [number, number, number] {
  const height = heightMm / MM_PER_UNIT
  const xFor = (id: string | null) => stationX(Math.max(0, stations.findIndex((station) => station.id === id)), stations.length)
  if (transfer) {
    const from = xFor(transfer.from_station_id)
    return [from + (xFor(transfer.to_station_id) - from) * transfer.progress, 0.91 + height / 2, 0.45]
  }
  if (part.phase === 'QUEUED') {
    const station = states?.find((item) => item.definition.id === part.station_id)
    const slot = Math.max(0, station?.queued_part_ids.indexOf(part.id) ?? 0)
    // A schematic input stack separate from the occupied processing table.
    return [xFor(part.station_id), 0.25 + height / 2 + slot * (height + 0.05), 1.4]
  }
  if (part.phase === 'STORED' || part.station_id === 'ST-05') {
    const finalX = xFor('ST-05')
    const side = part.quality === 'REJECTED' ? 1 : -1
    const station = states?.find((item) => item.definition.id === 'ST-05')
    const progress = part.phase === 'STORED' ? 1 : station?.current_part_id === part.id
      ? Math.min(1, Math.max(0, 1 - station.remaining_process_seconds / station.definition.process_seconds)) : 0
    const storedBefore = parts.filter((item) => item.phase === 'STORED' && item.quality === part.quality
      && item.production_number < part.production_number).length
    return [finalX + progress, 0.91 + height / 2 - 0.53 * progress + storedBefore * (height + 0.03) * progress,
      0.45 + side * 1.9 * progress]
  }
  return [xFor(part.station_id), 0.91 + height / 2, 0.45]
}
