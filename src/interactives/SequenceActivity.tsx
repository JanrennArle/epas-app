import { useState } from 'react'
import { scoreActivity } from '../lib/activity'
import { ACTIVITIES } from '../content/activities'
import { recordSim } from '../lib/store'
import type { InteractiveProps } from './types'

export function SequenceActivity({ moduleId, config, onEvent }: InteractiveProps) {
  const key = typeof config?.activity === 'string' ? config.activity : ''
  const activity = ACTIVITIES[key]
  const [chain, setChain] = useState<string[]>([])
  const [checked, setChecked] = useState(false)

  if (!activity || activity.kind !== 'sequence') {
    return (
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-3)', maxWidth: '60ch' }}>
        This activity is not available yet.
      </p>
    )
  }

  const full = chain.length === activity.items.length
  const pool = activity.choices.filter(c => !chain.includes(c.id))
  const labelOf = (id: string) => activity.choices.find(c => c.id === id)?.label ?? id

  const responses: Record<string, string> = {}
  activity.items.forEach((item, i) => {
    const picked = chain[i]
    if (picked !== undefined) responses[item.id] = picked
  })
  const result = checked ? scoreActivity(activity.items, responses) : null

  const place = (id: string) => {
    if (checked || full) return
    setChain(c => [...c, id])
  }

  const reset = () => {
    if (checked) return
    setChain([])
  }

  const check = () => {
    if (checked || !full) return
    const r = scoreActivity(activity.items, responses)
    setChecked(true)
    onEvent?.({ type: 'attempt', correct: r.wrong.length === 0 })
    const score = r.total > 0 ? r.correct / r.total : 0
    const evidence = {
      ...(config ?? {}),
      activity: activity.id, chain, wrong: r.wrong,
    }
    recordSim({ simId: 'sequence', moduleId, score, at: new Date().toISOString(), evidence })
    onEvent?.({ type: 'complete', score, evidence })
  }

  return (
    <section aria-label={`Signal path activity, ${activity.id}`} style={{
      border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)',
      padding: 14, margin: '0 0 20px', maxWidth: '60ch',
    }}>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 14px' }}>
        {activity.instruction}
      </p>

      <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>
        The path so far
      </p>
      <ol style={{
        listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex',
        flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 44,
      }}>
        {chain.length === 0 && (
          <li style={{ fontSize: 13, color: 'var(--ink-3)' }}>Nothing placed yet.</li>
        )}
        {chain.map((id, i) => {
          const item = activity.items[i]
          const wrong = checked && item ? result?.wrong.includes(item.id) : false
          return (
            <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', padding: '7px 10px', borderRadius: 10,
                fontSize: 12.5, lineHeight: 1.3, color: 'var(--ink)',
                background: 'var(--paper)',
                border: `1px solid ${checked ? (wrong ? 'var(--caution)' : 'var(--pass)') : 'var(--line)'}`,
              }}>{labelOf(id)}</span>
              {i < chain.length - 1 && (
                <span aria-hidden style={{ color: 'var(--ink-3)', fontSize: 13 }}>to</span>
              )}
            </li>
          )
        })}
      </ol>

      {!checked && (
        <>
          <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>
            Parts to choose from
          </p>
          <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
            {pool.map(c => (
              <button key={c.id} onClick={() => place(c.id)} aria-disabled={full} className="tile"
                style={{
                  width: '100%', textAlign: 'left', minHeight: 44, padding: '10px 12px',
                  borderRadius: 10, background: 'var(--paper)', font: 'inherit', fontSize: 13,
                  border: '1px solid var(--line)', color: 'var(--ink)',
                  cursor: full ? 'default' : 'pointer', opacity: full ? 0.5 : 1,
                }}>{c.label}</button>
            ))}
            {pool.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Every part has been placed.</p>
            )}
          </div>
        </>
      )}

      {!checked ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={check} disabled={!full} className="tile" style={{
            background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 10,
            padding: '11px 18px', fontSize: 14, fontWeight: 620, minHeight: 44,
            cursor: full ? 'pointer' : 'default', opacity: full ? 1 : 0.5,
          }}>Check the path</button>
          {chain.length > 0 && (
            <button onClick={reset} style={{
              background: 'none', border: 0, color: 'var(--accent)', fontSize: 13,
              cursor: 'pointer', padding: '0 8px', minHeight: 44, font: 'inherit',
            }}>Start over</button>
          )}
        </div>
      ) : (
        <div>
          <p role="status" style={{ fontSize: 13.5, fontWeight: 620, margin: '0 0 8px', color: 'var(--ink)' }}>
            You placed {result!.correct} of {result!.total} correctly.
          </p>
          {result!.wrong.length > 0 && (
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--caution)', margin: 0 }}>
              The signal goes {activity.items.map(i => labelOf(i.answer)).join(', then ')}.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
