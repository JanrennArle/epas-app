import { useState } from 'react'
import type { QuizItem } from '../lib/types'
import { gradeItem, scoreQuiz } from '../lib/quiz'
import { recordAttempt } from '../lib/store'

export function Quiz({ items, moduleId, onFinish }: {
  items: QuizItem[]
  moduleId: string
  onFinish: () => void
}) {
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    for (const item of items) {
      recordAttempt({
        itemId: item.id,
        moduleId,
        competency: item.competency,
        correct: gradeItem(item, responses[item.id]),
        at: new Date().toISOString(),
        context: 'formative',
      })
    }
    setSubmitted(true)
  }

  const result = submitted ? scoreQuiz(items, responses) : null
  const ready = items.every(i => responses[i.id] !== undefined)

  return (
    <section style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 14, padding: 16, maxWidth: '60ch',
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 14px' }}>Check your understanding</h2>

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
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)',
                border: `1px solid ${submitted && i === item.answer ? 'var(--pass)' : 'transparent'}`,
              }}>
                <input type="radio" name={item.id} disabled={submitted}
                  checked={answered === i}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: i }))}
                  style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
                <span>{opt}</span>
              </label>
            ))}

            {item.kind === 'truefalse' && [true, false].map(v => (
              <label key={String(v)} style={{
                display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 13.5,
                color: 'var(--ink-2)',
                border: `1px solid ${submitted && v === item.answer ? 'var(--pass)' : 'transparent'}`,
              }}>
                <input type="radio" name={item.id} disabled={submitted}
                  checked={answered === v}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: v }))}
                  style={{ accentColor: 'var(--accent)' }} />
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
        <button onClick={submit} className="tile"
          disabled={!ready}
          style={{
            background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 10,
            padding: '11px 18px', fontSize: 14, fontWeight: 620, minHeight: 44,
            cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5,
          }}>Check answers</button>
      ) : (
        <div>
          <p style={{ fontSize: 14, fontWeight: 620, margin: '0 0 12px' }}>
            You scored {result!.correct} out of {result!.total}.
          </p>
          <button onClick={onFinish} className="tile" style={{
            background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 10,
            padding: '11px 18px', fontSize: 14, fontWeight: 620, cursor: 'pointer', minHeight: 44,
          }}>Mark this outcome complete</button>
        </div>
      )}
    </section>
  )
}

function OrderInput({ item, disabled, onChange }: {
  item: Extract<QuizItem, { kind: 'order' }>
  disabled: boolean
  onChange: (seq: string[]) => void
}) {
  // Deterministic shuffle: reverse. Keeps the exercise real without adding
  // randomness that would make the student's experience irreproducible.
  const [pool, setPool] = useState<string[]>(() => [...item.steps].reverse())
  const [chosen, setChosen] = useState<string[]>([])

  function pick(step: string) {
    const nextChosen = [...chosen, step]
    setChosen(nextChosen)
    setPool(p => p.filter(s => s !== step))
    onChange(nextChosen)
  }

  function reset() {
    setPool([...item.steps].reverse())
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
