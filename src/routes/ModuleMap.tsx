import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { allModules } from '../content'
import { loadState, resetAll } from '../lib/store'

export default function ModuleMap() {
  const navigate = useNavigate()
  const state = loadState()
  const modules = allModules()
  const [confirming, setConfirming] = useState(false)

  function startNewParticipant() {
    resetAll()
    navigate('/consent', { replace: true })
  }

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

      {/*
        These machines are shared. Without a way to hand the app to the next
        student, their work joined the previous student's participant record,
        they never saw the consent screen, and the two sittings resolved as one
        student retaking a test.
      */}
      <div style={{
        marginTop: 28, paddingTop: 14, borderTop: '1px solid var(--line)',
        fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-3)',
      }}>
        {confirming ? (
          <div>
            <p style={{ margin: '0 0 10px', color: 'var(--ink-2)' }}>
              This clears every answer and result stored on this device and starts a new
              participant. Work that has not been exported cannot be got back.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={startNewParticipant} className="tile" style={{
                minHeight: 44, padding: '10px 14px', borderRadius: 10, border: 0,
                background: 'var(--accent)', color: 'var(--on-accent)',
                font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Clear and start a new participant
              </button>
              <button onClick={() => setConfirming(false)} className="tile" style={{
                minHeight: 44, padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--line)', background: 'var(--surface)',
                color: 'var(--ink)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <span>
            Working as{' '}
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', fontWeight: 600 }}>
              {state.participant.code}
            </strong>
            {state.participant.name ? ` (${state.participant.name})` : ''}.{' '}
            <button onClick={() => setConfirming(true)} style={{
              background: 'none', border: 0, padding: 0, font: 'inherit',
              color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline',
            }}>
              Not you?
            </button>
          </span>
        )}
      </div>
    </>
  )
}
