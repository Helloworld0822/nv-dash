import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { thumbSlot } from '../lib/format'

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className ? `card ${className}` : 'card'}>
      {(title || action) && (
        <header className="card-head">
          {title && <h3 className="card-title">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function PageHead({
  title,
  sub,
  actions,
}: {
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Tabs<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T
  items: { key: T; label: string }[]
  onChange: (key: T) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={item.key === value}
          className={item.key === value ? 'tab is-active' : 'tab'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function Badge({
  children,
  tone = 'brand',
}: {
  children: ReactNode
  tone?: 'brand' | 'quiet' | 'new'
}) {
  const cls = tone === 'quiet' ? 'badge is-quiet' : tone === 'new' ? 'badge is-new' : 'badge'
  return <span className={cls}>{children}</span>
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  )
}

export function ErrorBar({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof Error ? error.message : '요청에 실패했습니다.'
  return <p className="error-bar">{message}</p>
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="hint">
      <Icon name="help" />
      <span>{children}</span>
    </p>
  )
}

export function Thumb({
  seed,
  size = 'md',
}: {
  seed: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const cls = size === 'sm' ? 'thumb is-sm' : size === 'lg' ? 'thumb is-lg' : 'thumb'
  return <div className={cls} data-slot={thumbSlot(seed)} role="presentation" />
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string
  value: ReactNode
  unit?: string
  icon: IconName
  accent?: boolean
}) {
  return (
    <div className={accent ? 'stat is-accent' : 'stat'}>
      <div className="stat-top">
        <span>{label}</span>
        <Icon name={icon} />
      </div>
      <p className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </p>
    </div>
  )
}
