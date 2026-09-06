import { useState } from 'react'
import { scoreActivity } from '../lib/activity'
import { ACTIVITIES } from '../content/activities'
import { recordSim } from '../lib/store'
import type { InteractiveProps } from './types'

export function MatchActivity({ moduleId, config, onEvent }: InteractiveProps) {
  const key = typeof config?.activity === 'string' ? config.activity : ''
  const activity = ACTIVITIES[key]
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  if (!activity || activity.kind !== 'match') {
    return (
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-3)', maxWidth: '60ch' }}>
        This activity is not available yet.
      </p>
    )
  }

  const answered = activity.items.every(i => responses[i.id] !== undefined && responses[i.id] !== '')
  const result = checked ? scoreActivity(activity.items, responses) : null

  const check = () => {
    if (checked || !answered) return
    const r = scoreActivity(activity.items, responses)
    setChecked(true)
    onEvent?.({ type: 'attempt', correct: r.wrong.length === 0 })
    const score = r.total > 0 ? r.correct / r.total : 0
    const evidence = {
      ...(config ?? {}),
      activity: activity.id, responses, wrong: r.wrong,
    }
    recordSim({ simId: 'match', moduleId, score, at: new Date().toISOString(), evidence })
    onEvent?.({ type: 'complete', score, evidence })
  }

  return (
    <section aria-label={`Matching activity, ${activity.id}`} style={{
      border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)',
      padding: 14, margin: '0 0 20px', maxWidth: '60ch',
    }}>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 14px' }}>
        {activity.instruction}
      </p>

      {activity.items.map(item => {
        const wrong = result?.wrong.includes(item.id)
        return (
          <div key={item.id} style={{ marginBottom: 14 }}>
            <label htmlFor={`${activity.id}-${item.id}`} style={{
              display: 'block', fontSize: 13.5, lineHeight: 1.5,
              color: 'var(--ink)', marginBottom: 6,
            }}>{item.prompt}</label>
            <select
              id={`${activity.id}-${item.id}`}
              value={responses[item.id] ?? ''}
              disabled={checked}
              onChange={e => setResponses(r => ({ ...r, [item.id]: e.target.value }))}
              style={{
                width: '100%', minHeight: 44, borderRadius: 10, padding: '0 10px',
                font: 'inherit', fontSize: 13.5, background: 'var(--paper)', color: 'var(--ink)',
                border: `1px solid ${checked ? (wrong ? 'var(--caution)' : 'var(--pass)') : 'var(--line)'}`,
              }}>
              <option value="">Choose a part</option>
              {activity.choices.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {checked && wrong && (
              <p style={{ fontSize: 12.5, color: 'var(--caution)', margin: '6px 0 0', lineHeight: 1.5 }}>
                The answer is {activity.choices.find(c => c.id === item.answer)?.label ?? item.answer}.
              </p>
            )}
          </div>
        )
      })}

      {!checked ? (
        <button onClick={check} disabled={!answered} className="tile" style={{
          background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 10,
          padding: '11px 18px', fontSize: 14, fontWeight: 620, minHeight: 44,
          cursor: answered ? 'pointer' : 'default', opacity: answered ? 1 : 0.5,
        }}>Check answers</button>
      ) : (
        <p role="status" style={{ fontSize: 13.5, fontWeight: 620, margin: 0, color: 'var(--ink)' }}>
          You matched {result!.correct} of {result!.total} correctly.
        </p>
      )}
    </section>
  )
}
