import { Link, useParams } from 'react-router'
import { getModule } from '../content'
import { loadState } from '../lib/store'

export default function ModuleOverview() {
  const { moduleId = '' } = useParams()
  const m = getModule(moduleId)
  const state = loadState()

  if (!m) {
    return <p style={{ color: 'var(--ink-2)' }}>That module does not exist yet. <Link to="/">Back to modules</Link></p>
  }

  const done = state.modules[m.id]?.completedOutcomes ?? []

  return (
    <>
      <Link to="/" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Modules</Link>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 2px' }}>{m.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px' }}>{m.week}</p>

      {!m.teacherReviewed && (
        <p role="status" style={{
          fontSize: 12, color: 'var(--caution)', background: 'var(--surface)',
          border: '1px solid var(--line)', borderLeft: '3px solid var(--caution)',
          borderRadius: '0 10px 10px 0', padding: '10px 12px', margin: '0 0 16px',
        }}>
          This module has not yet been reviewed by your teacher. Confirm any procedure with them before performing it on real equipment.
        </p>
      )}

      <h2 style={{ fontSize: 13, fontWeight: 660, margin: '0 0 8px' }}>Learning competencies</h2>
      <ul style={{ margin: '0 0 22px', paddingLeft: 18 }}>
        {m.competencies.map(c => (
          <li key={c} style={{ fontSize: 13.5, lineHeight: 1.62, color: 'var(--ink-2)', marginBottom: 4 }}>{c}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 13, fontWeight: 660, margin: '0 0 8px' }}>Outcomes</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {m.outcomes.map(o => (
          <li key={o.id}>
            <Link to={`/m/${m.id}/lo/${o.id}`} className="tile" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
              padding: '13px 14px', textDecoration: 'none', color: 'var(--ink)', minHeight: 44,
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>{o.title}</span>
              {done.includes(o.id) && (
                <span style={{ fontSize: 11, color: 'var(--pass)', fontWeight: 640, flex: 'none' }}>Done</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
