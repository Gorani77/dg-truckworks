import type { ReactNode } from 'react'
import styles from './panel.module.css'

type PanelProps = {
  title: string
  label?: string
  children: ReactNode
  className?: string
}

export function Panel({ title, label, children, className }: PanelProps) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')} aria-label={title}>
      <header className={styles.header}><h2>{title}</h2>{label && <span>{label}</span>}</header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}

