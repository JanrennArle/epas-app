import { useState } from 'react'
import type { QuizItem } from '../lib/types'
import { gradeItem, scoreQuiz } from '../lib/quiz'
import { newRunId, recordAttempt } from '../lib/store'
import { Tape } from './board/Tape'
import { PlateButton } from './board/Plate'

export function Quiz({ items, moduleId, onFinish }: {
  items: QuizItem[]
  moduleId: string
  onFinish: () => void
}) {
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    const runId = newRunId()
    const at = new Date().toISOString()
    for (const item of items) {
      recordAttempt({
        itemId: item.id,
        moduleId,
        competency: item.competency,
        correct: gradeItem(item, responses[item.id]),
        at,
        context: 'formative',
        runId,
      })
    }
    setSubmitted(true)
  }

  const result = submitted ? scoreQuiz(items, responses) : null
  const ready = items.every(i => responses[i.id] !== undefined)

  return (
    <section className="sign" style={{ maxWidth: '62ch' }}>
      <Tape as="h2" size="section">Check your understanding</Tape>

      {items.map(item => {
        const answered = responses[item.id]
        const correct = submitted && gradeItem(item, answered)
        return (
          <fieldset key={item.id} style={{ border: 0, padding: 0, margin: '0 0 20px' }}>
            <legend style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, padding: 0, marginBottom: 8 }}>
              {item.stem}
            </legend>

            {item.kind === 'mcq' && item.options.map((opt, i) => (
              <label key={i} style={{
                display: 'flex', gap: 9, alignItems: 'flex-start', minHeight: 44,
                padding: '8px 10px', borderRadius: 3, cursor: 'pointer',
                fontSize: '1rem', lineHeight: 1.5, color: 'var(--ink)',
                border: `2px solid ${submitted && i === item.answer ? 'var(--pass)' : 'transparent'}`,
                background: answered === i ? 'color-mix(in srgb, var(--paint) 8%, transparent)' : undefined,
              }}>
                <input type="radio" name={item.id} disabled={submitted}
                  checked={answered === i}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: i }))}
                  style={{ marginTop: 3, accentColor: 'var(--paint)' }} />
                <span>{opt}</span>
              </label>
            ))}

            {item.kind === 'truefalse' && [true, false].map(v => (
              <label key={String(v)} style={{
                display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
                padding: '8px 10px', borderRadius: 3, cursor: 'pointer', fontSize: '1rem',
                color: 'var(--ink)',
                border: `2px solid ${submitted && v === item.answer ? 'var(--pass)' : 'transparent'}`,
                background: answered === v ? 'color-mix(in srgb, var(--paint) 8%, transparent)' : undefined,
              }}>
                <input type="radio" name={item.id} disabled={submitted}
                  checked={answered === v}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: v }))}
                  style={{ accentColor: 'var(--paint)' }} />
                <span>{v ? 'True' : 'False'}</span>
              </label>
            ))}

            {item.kind === 'order' && (
              <OrderInput item={item} disabled={submitted}
                onChange={seq => setResponses(r => ({ ...r, [item.id]: seq }))} />
            )}

            {submitted && (
              <p style={{
                fontSize: 12.5, lineHeight: 1.55, marginTop: 8,
                color: correct ? 'var(--pass)' : 'var(--caution)',
              }}>
                {correct ? '' : 'Not quite. '}
                {item.kind === 'mcq' ? item.rationale[typeof answered === 'number' ? answered : item.answer]
                  : item.kind === 'truefalse' ? item.rationale
                  : `The correct order is: ${item.steps.join(', ')}.`}
              </p>
            )}
          </fieldset>
        )
      })}

      {!submitted ? (
        <PlateButton variant="primary" onClick={submit} disabled={!ready}>Check answers</PlateButton>
      ) : (
        <div>
          <p style={{ fontSize: 14, fontWeight: 620, margin: '0 0 12px' }}>
            You scored {result!.correct} out of {result!.total}.
          </p>
          <PlateButton variant="primary" onClick={onFinish}>Mark this outcome complete</PlateButton>
        </div>
      )}
    </section>
  )
}

/**
 * Deterministic shuffle. Reversing would present the pool as the exact
 * inverse of the answer, which a student can solve from the bottom up
 * without reading. Interleaving is still reproducible for every student
 * but carries no such shortcut.
 */
function shuffleSteps(steps: string[]): string[] {
  return [
    ...steps.filter((_, i) => i % 2 === 1),
    ...steps.filter((_, i) => i % 2 === 0),
  ]
}

function OrderInput({ item, disabled, onChange }: {
  item: Extract<QuizItem, { kind: 'order' }>
  disabled: boolean
  onChange: (seq: string[]) => void
}) {
  // Deterministic shuffle via shuffleSteps: reproducible for every student
  // without presenting the pool as the plain inverse of the answer.
  const [pool, setPool] = useState<string[]>(() => shuffleSteps(item.steps))
  const [chosen, setChosen] = useState<string[]>([])

  function pick(step: string) {
    const nextChosen = [...chosen, step]
    setChosen(nextChosen)
    setPool(p => p.filter(s => s !== step))
    onChange(nextChosen)
  }

  function reset() {
    setPool(shuffleSteps(item.steps))
    setChosen([])
    onChange([])
  }

  return (
    <div>
      <ol style={{ paddingLeft: 20, margin: '0 0 8px', fontSize: 13.5, color: 'var(--ink)' }}>
        {chosen.map(s => <li key={s} style={{ marginBottom: 4 }}>{s}</li>)}
      </ol>
      {!disabled && pool.map(s => (
        <button key={s} onClick={() => pick(s)} style={{
          display: 'block', width: '100%', textAlign: 'left', minHeight: 44,
          background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10,
          padding: '9px 11px', marginBottom: 6, fontSize: 13.5, color: 'var(--ink-2)',
          cursor: 'pointer', font: 'inherit',
        }}>{s}</button>
      ))}
      {!disabled && chosen.length > 0 && (
        <button onClick={reset} style={{
          background: 'none', border: 0, color: 'var(--accent)', fontSize: 12,
          cursor: 'pointer', padding: '8px 0', minHeight: 44,
        }}>Start over</button>
      )}
    </div>
  )
}
