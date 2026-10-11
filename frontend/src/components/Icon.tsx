import type { CSSProperties } from 'react'

const paths = {
  factory: 'M3 21V9l6 3V6l6 4V3h6v18H3Zm4-5v2m5-2v2m5-2v2',
  compass: 'm16 8-3 5-5 3 3-5 5-3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  play: 'm9 5 11 7-11 7V5',
  pause: 'M8 5v14M16 5v14',
  reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
  settings: 'M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6',
  spark: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3',
  history: 'M5 5h14v16H5V5m4 4h6m-6 4h6m-6 4h4M9 2h6',
  info: 'M12 11v6m0-10v.1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  close: 'm6 6 12 12M6 18 18 6',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  back: 'M19 12H5m5-5-5 5 5 5',
  cube: 'm12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5M12 12 3 7m9 5v10',
  clock: 'M12 7v5l3 2M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  check: 'm5 12 4 4L19 6',
  warning: 'm12 3 10 18H2L12 3Zm0 6v5m0 3v.1',
  target: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
} as const

export type IconName = keyof typeof paths
export function Icon({ name, size = 18, className, style }: {
  name: IconName; size?: number; className?: string; style?: CSSProperties
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} style={style}>
    <path d={paths[name]} />
  </svg>
}
