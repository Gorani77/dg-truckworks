import type { StationSelectionProps } from '../types'
import styles from '../factory.module.css'

type StationListProps = StationSelectionProps & { selectedId: string }

export function StationList({ stations, selectedId, onSelect }: StationListProps) {
  return (
    <ol className={styles.stationList}>
      {stations.map((station, index) => (
        <li key={station.id}>
          <button className={selectedId === station.id ? styles.selectedStation : ''} aria-pressed={selectedId === station.id} onClick={() => onSelect(station.id)}>
            <span className={styles.stationIndex}>{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.stationName}>{station.name}<small>{station.id}</small></span>
            <span className={styles.stationTime}>{station.processSeconds}s</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

