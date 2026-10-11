import styles from './dashboard.module.css'

export function AppHeader({ connection }: { connection: 'loading' | 'connected' | 'offline' }) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#workspace">
        <svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
          <path d="M4 6h20v5H4zm0 11h20v5H4zM7 6v16m7-16v16m7-16v16" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>TruckWorks</span>
      </a>
      <span className={styles.headerLabel}>내 공장 · 생산 관제</span>
      <div className={styles.connection} role="status"><span className={styles.connectionDot} />
        {{ loading: '서버 연결 중', connected: '서버 연결됨', offline: '서버 연결 끊김' }[connection]}
      </div>
    </header>
  )
}

