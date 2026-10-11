import { useState } from 'react'
import type { PartState, StationState, TransferState } from '../../../api/factory'
import { PartDetails } from './PartDetails'
import styles from '../factory.module.css'

export function PartTracking({ parts, transfers, paused, stations }: {
  parts: readonly PartState[]; transfers: readonly TransferState[]; paused: boolean; stations: readonly StationState[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const part = parts.find((item) => item.id === selectedId)
    ?? parts.find((item) => item.phase !== 'STORED') ?? parts[0]
  if (!part) return null
  return <section aria-label="생산 차체 선택과 추적">
    <label className={styles.label} htmlFor="tracked-part">추적할 차체</label>
    <select className={styles.select} id="tracked-part" value={part.id}
      onChange={(event) => setSelectedId(event.target.value)}>
      {parts.map((item) => <option key={item.id} value={item.id}>
        #{item.production_number} · {item.id.slice(0, 8)}{item.phase === 'STORED' ? ' · 보관 완료' : ''}
      </option>)}
    </select>
    <PartDetails part={part} transfer={transfers.find((item) => item.part_id === part.id) ?? null} paused={paused}
      faulted={stations.some((station) => station.definition.id === part.station_id && station.status === 'FAULTED')} />
  </section>
}
