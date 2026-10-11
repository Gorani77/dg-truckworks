import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './experience.module.css'
import { Icon } from '../components/Icon'

export function SceneDrawer({ title, open, wide, onClose, children }: {
  title: string; open: boolean; wide?: boolean; onClose: () => void; children: ReactNode
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    heading.current?.focus()
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [open, title])
  return <aside className={`${styles.drawer} ${wide ? styles.wideDrawer : ''}`} hidden={!open} aria-label={title}>
    <header className={styles.drawerHeading}><div><span className={styles.drawerKicker}>TRUCKWORKS / {wide ? '기록 보관함' : '공장 인스펙터'}</span><h2 ref={heading} tabIndex={-1}>{title}</h2></div><button onClick={onClose} aria-label={`${title} 닫기`}><Icon name="close" size={20} /></button></header>
    <div className={styles.drawerBody}>{children}</div>
  </aside>
}

