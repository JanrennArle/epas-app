import { Link, Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { hasConsented } from '../lib/store'
import { UpdatePrompt } from './UpdatePrompt'

const NAV = [
  { to: '/', label: 'Modules' },
  { to: '/labs', label: 'Labs' },
  { to: '/progress', label: 'Progress' },
  { to: '/evaluate', label: 'Evaluate' },
]

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  // Every route is wrapped in the Shell, so this is the only place that can
  // gate all of them. Gating the module map alone let a typed or restored URL
  // reach a lesson or a test, and the test routes write attempt records, so a
  // student could have had data stored before consenting to anything.
  const OPEN = ['/consent', '/teacher']
  if (!OPEN.includes(pathname) && !hasConsented()) {
    return <Navigate to="/consent" replace />
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      <UpdatePrompt />
      <header className="wrap" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        minHeight: 'calc(var(--pitch) * 2.5)', flexWrap: 'wrap',
      }}>
        <Link to="/" aria-label="EPAS, modules" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minHeight: 44,
        }}>
          <span className="tape" style={{ fontSize: '1.05rem' }}>EPAS</span>
          <span className="label" style={{ fontSize: '0.95rem' }}>Grade 12</span>
        </Link>
        <nav aria-label="Main" style={{ display: 'flex', gap: 'calc(var(--pitch) * 0.15)', flexWrap: 'wrap' }}>
          {NAV.map(n => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <Link key={n.to} to={n.to} aria-current={active ? 'page' : undefined} className="nav-link">
                {n.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="wrap" style={{ paddingBlock: 'calc(var(--pitch) * 0.5) calc(var(--pitch) * 2)' }}>
        {children}
      </main>
    </div>
  )
}
