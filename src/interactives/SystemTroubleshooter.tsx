import { useState } from 'react'
import type { CSSProperties } from 'react'
import { readingAt, scoreDiagnosis } from '../lib/diagnose'
import { recordSim } from '../lib/store'
import { SCENARIOS } from '../content/scenarios'
import type { InteractiveProps } from './types'

const label: CSSProperties = {
  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--ink-3)', margin: '0 0 8px',
}

export function SystemTroubleshooter({ moduleId, config, onEvent }: InteractiveProps) {
  const key = typeof config?.scenario === 'string' ? config.scenario : 'fan'
  const scenario = SCENARIOS[key]

  const [acked, setAcked] = useState<string[]>([])
  const [used, setUsed] = useState<string[]>([])
  const [result, setResult] = useState<ReturnType<typeof scoreDiagnosis> | null>(null)

  if (!scenario) {
    return (
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-3)', maxWidth: '60ch' }}>
        This activity is not available yet.
      </p>
    )
  }

  const safe = acked.length === scenario.safety.length

  const runTest = (id: string) => {
    if (!safe || result || used.includes(id)) return
    setUsed(u => [...u, id])
  }

  const accuse = (faultId: string) => {
    if (!safe || result) return
    const r = scoreDiagnosis(scenario, used, faultId)
    setResult(r)
    onEvent?.({ type: 'attempt', correct: r.correct })
    const evidence = {
      ...(config ?? {}),
      scenario: scenario.id,
      testsUsed: used,
      answered: faultId,
      correct: r.correct,
    }
    recordSim({ simId: 'troubleshoot', moduleId, score: r.score, at: new Date().toISOString(), evidence })
    onEvent?.({ type: 'complete', score: r.score, evidence })
  }

  return (
    <section aria-label={`Troubleshooter, ${scenario.appliance}`} style={{
      border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden',
      margin: '0 0 20px', maxWidth: '60ch', background: 'var(--surface)',
    }}>
      <header style={{ padding: '11px 14px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 660, margin: 0 }}>Troubleshooter: {scenario.appliance}</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '6px 0 0', lineHeight: 1.55 }}>{scenario.symptom}</p>
      </header>

      <div style={{ padding: 14 }}>
        <div style={{
          border: '1px solid var(--line)', borderLeft: '3px solid var(--danger)',
          borderRadius: '0 10px 10px 0', padding: '11px 13px', marginBottom: 14,
        }}>
          <strong style={{ ...label, display: 'block', color: 'var(--danger)' }}>Before you test</strong>
          {scenario.safety.map(s => (
            <label key={s} style={{
              display: 'flex', gap: 9, alignItems: 'flex-start', minHeight: 44,
              fontSize: 13, lineHeight: 1.5, color: 'var(--ink)', cursor: result ? 'default' : 'pointer',
            }}>
              <input type="checkbox" checked={acked.includes(s)} disabled={!!result}
                onChange={e => setAcked(a => e.target.checked ? [...a, s] : a.filter(x => x !== s))}
                style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
              <span>{s}</span>
            </label>
          ))}
        </div>

        <p style={label}>Tests {safe ? `(${used.length} used)` : '(locked until the safety steps are ticked)'}</p>
        <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
          {scenario.testPoints.map(tp => {
            const done = used.includes(tp.id)
            return (
              <div key={tp.id}>
                <button onClick={() => runTest(tp.id)} aria-disabled={!safe || done || !!result}
                  className="tile"
                  style={{
                    width: '100%', textAlign: 'left', minHeight: 44, padding: '10px 12px',
                    borderRadius: 10, background: 'var(--paper)', font: 'inherit', fontSize: 13,
                    border: `1px solid ${done ? 'var(--accent)' : 'var(--line)'}`,
                    color: 'var(--ink)', cursor: !safe || done || result ? 'default' : 'pointer',
                    opacity: safe ? 1 : 0.5,
                  }}>
                  <strong style={{ fontWeight: 620 }}>{tp.label}. </strong>{tp.action}
                </button>
                {done && (
                  <p role="status" style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)',
                    margin: '6px 0 0 12px', lineHeight: 1.5,
                  }}>Reading: {readingAt(scenario, tp.id)}</p>
                )}
              </div>
            )
          })}
        </div>

        <p style={label}>Name the fault</p>
        <div style={{ display: 'grid', gap: 6 }}>
          {scenario.faults.map(f => (
            <button key={f.id} onClick={() => accuse(f.id)} disabled={!safe || !!result}
              className="tile"
              style={{
                width: '100%', textAlign: 'left', minHeight: 44, padding: '10px 12px',
                borderRadius: 10, background: 'var(--paper)', font: 'inherit', fontSize: 13,
                border: `1px solid ${result && f.id === scenario.actualFault ? 'var(--pass)' : 'var(--line)'}`,
                color: 'var(--ink)', cursor: !safe || result ? 'default' : 'pointer',
                opacity: safe ? 1 : 0.5,
              }}>{f.label}</button>
          ))}
        </div>

        {result && (
          <p role="status" style={{
            fontSize: 13, lineHeight: 1.55, marginTop: 14,
            color: result.correct ? 'var(--pass)' : 'var(--caution)',
          }}>
            {result.correct
              ? `Correct, after ${used.length} ${used.length === 1 ? 'test' : 'tests'}. `
              : `Not quite. The fault was the ${scenario.faults.find(f => f.id === scenario.actualFault)?.label.toLowerCase() ?? 'another component'}. `}
            {result.remedy}
          </p>
        )}
      </div>
    </section>
  )
}
