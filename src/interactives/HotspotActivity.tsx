import { useState } from 'react'
import { scoreActivity } from '../lib/activity'
import type { Shape } from '../lib/activity'
import { ACTIVITIES } from '../content/activities'
import { recordSim } from '../lib/store'
import type { InteractiveProps } from './types'

function Drawing({ shapes }: { shapes: Shape[] }) {
  return (
    <>
      {shapes.map((s, i) => {
        switch (s.kind) {
          case 'rect':
            return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0}
              fill={s.fill ?? 'none'} stroke={s.stroke ?? 'var(--ink-3)'} strokeWidth="1.5" />
          case 'line':
            return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke="var(--ink-2)" strokeWidth={s.width ?? 2} strokeLinecap="round" />
          case 'circle':
            return <circle key={i} cx={s.cx} cy={s.cy} r={s.r}
              fill={s.fill ?? 'none'} stroke={s.stroke ?? 'var(--ink-3)'} strokeWidth="1.5" />
          case 'text':
            return <text key={i} x={s.x} y={s.y} textAnchor={s.anchor ?? 'start'}
              fill="var(--ink-3)" fontSize="11" fontFamily="var(--font-sans)">{s.text}</text>
        }
      })}
    </>
  )
}

export function HotspotActivity({ moduleId, config, onEvent }: InteractiveProps) {
  const key = typeof config?.activity === 'string' ? config.activity : ''
  const activity = ACTIVITIES[key]
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})

  if (!activity || activity.kind !== 'hotspot') {
    return (
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-3)', maxWidth: '60ch' }}>
        This activity is not available yet.
      </p>
    )
  }

  const item = activity.items[step]
  const done = step >= activity.items.length
  const answered = item ? responses[item.id] !== undefined : false

  const pick = (regionId: string) => {
    if (!item || answered) return
    const next = { ...responses, [item.id]: regionId }
    setResponses(next)
    onEvent?.({ type: 'attempt', correct: regionId === item.answer })

    if (Object.keys(next).length === activity.items.length) {
      const r = scoreActivity(activity.items, next)
      const score = r.total > 0 ? r.correct / r.total : 0
      const evidence = {
        ...(config ?? {}),
        activity: activity.id, responses: next, wrong: r.wrong,
      }
      recordSim({ simId: 'hotspot', moduleId, score, at: new Date().toISOString(), evidence })
      onEvent?.({ type: 'complete', score, evidence })
    }
  }

  const result = done ? scoreActivity(activity.items, responses) : null

  return (
    <section aria-label={`Labelling activity, ${activity.id}`} style={{
      border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)',
      padding: 14, margin: '0 0 20px', maxWidth: '60ch',
    }}>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 12px' }}>
        {activity.instruction}
      </p>

      {!done && item && (
        <>
          <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '14px 0 4px' }}>
            Question {step + 1} of {activity.items.length}
          </p>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 10px' }}>
            {item.prompt}
          </p>
        </>
      )}

      <div style={{ background: 'var(--paper)', borderRadius: 10, overflowX: 'auto', padding: 8 }}>
        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${activity.box.w} ${activity.box.h}`}
            style={{ width: '100%', height: 'auto', display: 'block', minWidth: 400 }}
            role="img" aria-label={activity.instruction}>
            <Drawing shapes={activity.shapes} />
          </svg>

          {activity.regions.map(region => {
            const chosen = item ? responses[item.id] === region.id : false
            const isAnswer = item ? region.id === item.answer : false
            const show = answered || done
            const border = show && isAnswer ? 'var(--pass)'
              : show && chosen ? 'var(--caution)'
                : 'var(--ink-3)'
            return (
              <button key={region.id} onClick={() => pick(region.id)}
                aria-label={region.label}
                aria-disabled={done || answered}
                style={{
                  position: 'absolute', left: `${region.xPct}%`, top: `${region.yPct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 44, height: 44, borderRadius: 9999,
                  background: 'transparent',
                  borderStyle: 'solid', borderColor: border,
                  borderWidth: show && isAnswer ? 3 : 2,
                  cursor: done || answered ? 'default' : 'pointer',
                }} />
            )
          })}
        </div>
      </div>

      {!done && item && (
        <>
          {answered && (
            <>
              <p role="status" style={{
                fontSize: 13, lineHeight: 1.55, margin: '0 0 10px',
                color: responses[item.id] === item.answer ? 'var(--pass)' : 'var(--caution)',
              }}>
                {responses[item.id] === item.answer
                  ? 'Correct. '
                  : `Not quite. That is the ${activity.regions.find(r => r.id === responses[item.id])?.label ?? 'wrong part'}. `}
                The answer is the {activity.regions.find(r => r.id === item.answer)?.label ?? item.answer}, ringed in green.
              </p>
              <button onClick={() => setStep(s => s + 1)} className="tile" style={{
                background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 10,
                padding: '11px 18px', fontSize: 14, fontWeight: 620, cursor: 'pointer', minHeight: 44,
              }}>{step + 1 === activity.items.length ? 'Finish' : 'Next question'}</button>
            </>
          )}
        </>
      )}

      {done && result && (
        <p role="status" style={{ fontSize: 13.5, fontWeight: 620, margin: '14px 0 0', color: 'var(--ink)' }}>
          You labelled {result.correct} of {result.total} correctly.
        </p>
      )}
    </section>
  )
}
