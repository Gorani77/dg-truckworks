import type { ButtonHTMLAttributes } from 'react'
import styles from './button.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'danger' | 'ai'
}

export function Button({ variant = 'default', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={[styles.button, variant === 'default' ? '' : styles[variant], className].filter(Boolean).join(' ')}
    />
  )
}


