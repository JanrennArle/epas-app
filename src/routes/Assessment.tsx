import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getModule } from '../content'
import { bankFor } from '../content/bank'
import { competencyGains, gradeForm } from '../lib/assess'
import { attemptsFor, hasTaken, newRunId, recordAttempt } from '../lib/store'
import type { AttemptContext } from '../lib/store'

const PHASES = {
  pre: { form: 'A', context: 'pretest', title: 'Pre-test' },
  post: { form: 'B', context: 'posttest', title: 'Post-test' },
} as const

export default function Assessment() {
  const { moduleId = '', phase = '' } = useParams()
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [done, setDone] = useState<{ correct: number; total: number } | null>(null)

  const spec = phase === 'pre' || phase === 'post' ? PHASES[phase] : undefined
  const module = getModule(moduleId)

  if (!spec || !module) {
    return <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>That test does not exist.</p>
  }

  const items = bankFor(moduleId, spec.form)
  const ready = items.every(i => responses[i.id] !== undefined)
  const retake = hasTaken(moduleId, spec.context as AttemptContext)

  function submit() {
    const runId = newRunId()
    const at = new Date().toISOString()
    for (const item of items) {
      recordAttempt({
        itemId: item.id,
        moduleId,
        competency: item.competency,
        correct: responses[item.id] === item.answer,
        at,
        context: spec!.context as AttemptContext,
        runId,
      })
    }
    setDone(gradeForm(items, responses))
  }

  if (items.length === 0) {
    return <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>This module has no test yet.</p>
  }

  if (done) {
    // Only the post-test has something to compare against. `measured` counts
    // the competencies the student actually sat on both sides, so a partly
    // completed pair reports honestly instead of counting a missing pre-test
    // as a competency not yet held.
    const gains = phase === 'post'
      ? competencyGains(attemptsFor(moduleId, 'pretest'), attemptsFor(moduleId, 'posttest'))
      : []
    const gained = gains.filter(g => g.gained).length
    const measured = gains.filter(g => g.pre !== null && g.post !== null).length

    return (
      <div style={{ maxWidth: '60ch' }}>
        <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          {spec.title} complete
        </h1>
        <p role="status" style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-2)', margin: '0 0 6px' }}>
          You answered {done.correct} of {done.total} correctly.
        </p>

        {phase === 'pre' && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 18px' }}>
            The answers are not shown, because you will sit a matching test on the same
            competencies after the module and seeing them now would change the result.
          </p>
        )}

        {phase === 'post' && measured > 0 && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 18px' }}>
            Comparing this with your pre-test, there {gained === 1 ? 'is' : 'are'} {gained} of {measured} competencies
            you answer correctly now and did not before.
          </p>
        )}

        {phase === 'post' && measured === 0 && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 18px' }}>
            There is no pre-test on this module to compare this with.
          </p>
        )}

        <Link to={`/m/${moduleId}`} style={{ fontSize: 14, color: 'var(--accent)' }}>
          Back to {module.title}
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '60ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        {spec.title}: {module.title}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px' }}>
        {items.length} questions, one for each competency in this module. Answer every one,
        then submit. You will not be told which answers were right.
      </p>
      {retake && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
          You have taken this before. Submitting again replaces your earlier result.
        </p>
      )}

      <div style={{ margin: '18px 0 0' }}>
        {items.map((item, n) => (
          <fieldset key={item.id} style={{
            border: '1px solid var(--line)', borderRadius: 14, padding: 16,
            margin: '0 0 12px', background: 'var(--surface)',
          }}>
            <legend style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '0 6px' }}>
              Question {n + 1}
            </legend>
            <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.55, margin: '0 0 10px', color: 'var(--ink)' }}>
              {item.stem}
            </p>
            {item.options.map((opt, i) => (
              <label key={i} style={{
                display: 'flex', gap: 9, alignItems: 'flex-start', minHeight: 44,
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)',
              }}>
                <input type="radio" name={item.id}
                  checked={responses[item.id] === i}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: i }))}
                  style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
                <span>{opt}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <button onClick={submit} disabled={!ready} className="tile" style={{
        minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
        background: ready ? 'var(--accent)' : 'var(--line)',
        color: ready ? 'var(--on-accent)' : 'var(--ink-3)',
        font: 'inherit', fontSize: 14, fontWeight: 600,
        cursor: ready ? 'pointer' : 'default',
      }}>
        {ready ? 'Submit' : `Answer all ${items.length} to submit`}
      </button>
    </div>
  )
}
