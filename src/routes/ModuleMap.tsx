import { Link, Navigate } from 'react-router'
import { allModules } from '../content'
import { loadState, hasConsented } from '../lib/store'

export default function ModuleMap() {
  if (!hasConsented()) return <Navigate to="/consent" replace />
  const state = loadState()
  const modules = allModules()

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 2px' }}>
        Modules
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        Grade 12 · one term · 11 weeks
      </p>

      <ul style={{
        listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      }}>
        {modules.map(m => {
          const done = state.modules[m.id]?.completedOutcomes.length ?? 0
          const pct = m.outcomes.length
            ? Math.min(100, Math.round((done / m.outcomes.length) * 100))
            : 0
          return (
            <li key={m.id}>
              <Link to={`/m/${m.id}`} className="tile" style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: `var(--${m.tint})`, color: 'var(--ink)',
                borderRadius: 14, padding: 14, minHeight: 120, textDecoration: 'none',
                border: '1px solid rgba(0,0,0,0.045)',
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: `var(--${m.tint}-ink)` }}>
                    {m.week.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 640, lineHeight: 1.3, marginTop: 6 }}>
                    {m.title}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'color-mix(in srgb, var(--ink) 14%, transparent)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: `var(--${m.tint}-ink)` }} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: `var(--${m.tint}-ink)`, fontVariantNumeric: 'tabular-nums',
                  }}>{pct}%</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
