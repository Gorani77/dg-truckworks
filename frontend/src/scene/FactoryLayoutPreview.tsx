import type { StationSelectionProps } from '../features/factory/types'
import styles from './scene.module.css'

type FactoryLayoutPreviewProps = StationSelectionProps & { selectedId: string }

export function FactoryLayoutPreview({ stations, selectedId, onSelect }: FactoryLayoutPreviewProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.coordinateLabel}>차체 가공 구역 <span>배치도 / 정적 미리보기</span></div>
      <div className={styles.route}>
        {stations.map((station, index) => (
          <button key={station.id} className={`${styles.station} ${station.id === selectedId ? styles.active : ''}`} onClick={() => onSelect(station.id)} aria-pressed={station.id === selectedId}>
            <span className={styles.stationCode}>{station.id}</span>
            <svg className={styles.machine} viewBox="0 0 100 100" aria-hidden="true">
              <path d="M18 20h64v62H18zM18 20l10-10h64L82 20M82 20v62l10-10V10" />
              <path className={styles.machineWindow} d="M29 33h42v26H29z" />
              <path d="M29 68h12m8 0h22M12 82h76v8H12z" />
              <text x="50" y="51" textAnchor="middle">{String(index + 1).padStart(2, '0')}</text>
            </svg>
            <span className={styles.stationName}>{station.name}</span>
            <span className={styles.duration}>{station.processSeconds}초</span>
          </button>
        ))}
      </div>
      <div className={styles.productDrawing}>
        <svg viewBox="0 0 220 100" role="img" aria-label="프레임 두 줄과 가로 연결부 세 개로 구성된 차체 도식">
          <path d="M20 28h180v10H20zm0 34h180v10H20zM42 38h8v24h-8zm62 0h8v24h-8zm62 0h8v24h-8z" />
          <path className={styles.dimensionLine} d="M20 85h180M20 80v10m180-10v10" />
          <text x="110" y="98" textAnchor="middle">180 mm</text>
        </svg>
        <div><span>생산 대상</span><strong>프레임 차체</strong><small>1개 부품으로 취급</small></div>
      </div>
    </div>
  )
}

