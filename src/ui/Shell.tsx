import { Link, useLocation } from 'react-router'
import type { ReactNode } from 'react'

const NAV = [
  { to: '/', label: 'Modules' },
  { to: '/labs', label: 'Labs' },
  { to: '/progress', label: 'Progress' },
]

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div style={{ minHeight: '100dvh' }}>
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
          color: 'var(--ink)', fontWeight: 700, fontSize: 14, minHeight: 44,
        }}>
          <span aria-hidden style={{
            width: 22, height: 22, borderRadius: 7, background: 'var(--accent)',
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800,
          }}>E</span>
          EPAS
        </Link>
        <nav style={{ display: 'flex', gap: 18 }}>
          {NAV.map(n => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <Link key={n.to} to={n.to} style={{
                fontSize: 13, textDecoration: 'none', minHeight: 44,
                display: 'flex', alignItems: 'center',
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: active ? 620 : 400,
              }}>{n.label}</Link>
            )
          })}
        </nav>
      </header>
      <main style={{ padding: '18px 16px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
