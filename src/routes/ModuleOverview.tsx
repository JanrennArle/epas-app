import { Link, useParams } from 'react-router'
import { getModule } from '../content'
import { loadState, hasTaken } from '../lib/store'
import { TASKS } from '../content/tasks'

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
      <Link to="/" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>Modules</Link>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 2px' }}>{m.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px' }}>{m.week}</p>

      {!m.teacherReviewed && (
        <p role="status" style={{
          fontSize: 12, color: 'var(--caution)', background: 'var(--surface)',
          border: '1px solid var(--line)', borderLeft: '3px solid var(--caution)',
          borderRadius: '0 10px 10px 0', padding: '10px 12px', margin: '0 0 16px',
        }}>
          <strong style={{
            fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--caution)', display: 'block', marginBottom: 4,
          }}>Not yet reviewed</strong>
          This module has not yet been reviewed by your teacher. Confirm any procedure with them before performing it on real equipment.
        </p>
      )}

      <h2 style={{ fontSize: 13, fontWeight: 660, margin: '0 0 8px' }}>Learning competencies</h2>
      <ul style={{ margin: '0 0 22px', paddingLeft: 18 }}>
        {m.competencies.map(c => (
          <li key={c} style={{ fontSize: 13.5, lineHeight: 1.62, color: 'var(--ink-2)', marginBottom: 4 }}>{c}</li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 20px' }}>
        <Link to={`/m/${m.id}/test/pre`} className="tile" style={{
          minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '10px 14px',
          borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
          fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none',
        }}>
          Pre-test{hasTaken(m.id, 'pretest') ? ' (taken)' : ''}
        </Link>
        <Link to={`/m/${m.id}/test/post`} className="tile" style={{
          minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '10px 14px',
          borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
          fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none',
        }}>
          Post-test{hasTaken(m.id, 'posttest') ? ' (taken)' : ''}
        </Link>
        {TASKS.filter(t => t.modules.includes(m.id)).map(t => (
          <Link key={t.id} to={`/tasks/${t.id}`} className="tile" style={{
            minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '10px 14px',
            borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
            fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none',
          }}>
            {/*
              The title leads, not the kind. Two of these modules carry two
              sheets of the same kind, and two tiles both reading
              "Individual task" give a student no way to tell which is which.
            */}
            {t.title}
            <span style={{ fontWeight: 500, color: 'var(--ink-3)', marginLeft: 8 }}>
              {t.kind === 'group' ? 'Group' : 'Individual'}
            </span>
          </Link>
        ))}
      </div>

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
