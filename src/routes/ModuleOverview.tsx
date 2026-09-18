import { Link, useParams } from 'react-router'
import { ArrowLeft, CheckCircle, Warning } from '@phosphor-icons/react'
import { getModule } from '../content'
import { loadState, hasTaken } from '../lib/store'
import { TASKS } from '../content/tasks'
import { Tape } from '../ui/board/Tape'
import { PlateLink } from '../ui/board/Plate'
import { toolFor } from '../ui/board/tools'

export default function ModuleOverview() {
  const { moduleId = '' } = useParams()
  const m = getModule(moduleId)
  const state = loadState()

  if (!m) {
    return (
      <p style={{ color: 'var(--ink-2)' }}>
        That module does not exist yet.{' '}
        <Link to="/" className="back"><ArrowLeft weight="bold" aria-hidden />Back to modules</Link>
      </p>
    )
  }

  const done = state.modules[m.id]?.completedOutcomes ?? []
  const Tool = toolFor(m.id)

  return (
    <>
      <Link to="/" className="back"><ArrowLeft weight="bold" aria-hidden />Modules</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 20px' }}>
        <Tool size={40} weight="regular" color="var(--chrome)" aria-hidden />
        <div>
          <p className="label" style={{ margin: '0 0 2px' }}>{m.week}</p>
          <Tape as="h1">{m.title}</Tape>
        </div>
      </div>

      {!m.teacherReviewed && (
        <div role="status" className="callout callout--caution">
          <strong><Warning weight="bold" aria-hidden />Not yet reviewed</strong>
          This module has not yet been reviewed by your teacher. Confirm any procedure with them before performing it on real equipment.
        </div>
      )}

      <Tape as="h2" size="section">Learning competencies</Tape>
      <ul className="sign" style={{ margin: '0 0 22px', listStylePosition: 'inside' }}>
        {m.competencies.map(c => (
          <li key={c} style={{ fontSize: '1rem', lineHeight: 1.62, color: 'var(--ink)', marginBottom: 4 }}>{c}</li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 20px' }}>
        <PlateLink to={`/m/${m.id}/test/pre`}>
          Pre-test{hasTaken(m.id, 'pretest') ? ' (taken)' : ''}
        </PlateLink>
        <PlateLink to={`/m/${m.id}/test/post`}>
          Post-test{hasTaken(m.id, 'posttest') ? ' (taken)' : ''}
        </PlateLink>
        {TASKS.filter(t => t.modules.includes(m.id)).map(t => (
          <PlateLink key={t.id} to={`/tasks/${t.id}`} className="plate--wrap">
            {/*
              The title leads, not the kind. Module 4 carries two individual
              sheets, and two tiles both reading "Individual task" give a
              student no way to tell which is which. The kind still follows,
              because it is the difference between turning up alone and
              turning up with a group.
            */}
            {t.title}
            <span style={{ fontWeight: 500, color: 'var(--ink-3)', marginLeft: 8, whiteSpace: 'nowrap' }}>
              {t.kind === 'group' ? 'Group task' : 'Individual task'}
            </span>
          </PlateLink>
        ))}
      </div>

      <Tape as="h2" size="section">Outcomes</Tape>
      <ul className="rack" style={{ marginTop: 'calc(var(--pitch) * 0.6)' }}>
        {m.outcomes.map(o => (
          <li key={o.id} style={{ ['--span' as string]: 12 }}>
            <Link to={`/m/${m.id}/lo/${o.id}`}>
              <Tool weight="regular" aria-hidden />
              <span>
                <span className="t">{o.title}</span>
                {done.includes(o.id) && (
                  <span className="w">
                    <CheckCircle weight="fill" style={{ width: '1em', height: '1em', verticalAlign: '-0.15em', color: 'var(--pass)' }} aria-hidden />{' '}Done
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
