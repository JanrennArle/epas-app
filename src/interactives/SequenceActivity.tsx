import { useState } from 'react'
import { scoreActivity } from '../lib/activity'
import { ACTIVITIES } from '../content/activities'
import { recordSim } from '../lib/store'
import { PlateButton } from '../ui/board/Plate'
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
    <section aria-label={`Signal path activity, ${activity.id}`} className="sign" style={{ margin: '0 0 20px', maxWidth: '60ch' }}>
      <h3 className="label" style={{ fontSize: '1.2rem', color: 'var(--ink)', margin: '0 0 14px' }}>
        {activity.instruction}
      </h3>

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
          const borderColor = checked ? (wrong ? 'var(--caution)' : 'var(--pass)') : 'var(--chrome)'
          return (
            <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', padding: '7px 10px', borderRadius: 3,
                fontSize: 12.5, lineHeight: 1.3, color: 'var(--ink)',
                background: 'var(--paper)',
                border: `2px solid ${borderColor}`,
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
              <button key={c.id} onClick={() => place(c.id)} aria-disabled={full} className="press"
                style={{
                  width: '100%', textAlign: 'left', minHeight: 44, padding: '10px 12px',
                  borderRadius: 3, background: 'var(--paper)', font: 'inherit', fontSize: 13,
                  border: '2px solid var(--line)', color: 'var(--ink)',
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
          <PlateButton variant="primary" onClick={check} disabled={!full}>Check the path</PlateButton>
          {chain.length > 0 && (
            <PlateButton onClick={reset}>Start over</PlateButton>
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
