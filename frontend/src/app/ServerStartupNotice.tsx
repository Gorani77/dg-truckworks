import styles from './experience.module.css'

export function ServerStartupNotice({ seconds }: { seconds: number }) {
  const delayed = seconds === 0
  return <aside className={styles.serverStartup} aria-label="서버 연결 안내">
    <div role="status">
      <strong>{delayed ? '서버 연결이 지연되고 있습니다' : '서버 시작 중'}</strong>
      <p>{delayed ? '자동으로 다시 연결하고 있습니다. 잠시만 더 기다려 주세요.'
        : '첫 연결에는 시간이 걸릴 수 있습니다. 준비되면 자동으로 연결합니다.'}</p>
    </div>
    {!delayed && <div className={styles.startupCountdown} role="timer" aria-live="off" aria-label={`연결 대기 안내 ${seconds}초`}>
      <b>{seconds}</b><span>초</span>
    </div>}
    {!delayed && <small>대기 안내 시간이며, 실제 연결 시간은 달라질 수 있습니다.</small>}
  </aside>
}
