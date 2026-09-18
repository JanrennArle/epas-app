import { useEffect, useState } from 'react'
import { readingAt, scoreDiagnosis } from '../lib/diagnose'
import { recordSim } from '../lib/store'
import { SCENARIOS } from '../content/scenarios'
import { PixelScene } from './service/PixelScene'
import type { InteractiveProps } from './types'

export function SystemTroubleshooter({ moduleId, config, onEvent }: InteractiveProps) {
  const key = typeof config?.scenario === 'string' ? config.scenario : 'fan'
  const scenario = SCENARIOS[key]

  const [acked, setAcked] = useState<string[]>([])
  const [used, setUsed] = useState<string[]>([])
  const [result, setResult] = useState<ReturnType<typeof scoreDiagnosis> | null>(null)

  const symptom = scenario?.symptom ?? ''
  const [typed, setTyped] = useState(() =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches ? symptom.length : 0)
  useEffect(() => {
    if (typed >= symptom.length) return
    const finish = () => setTyped(symptom.length)
    const ch = symptom[typed - 1]
    const t = setTimeout(() => setTyped(n => n + 1), typed === 0 ? 500 : ch === ',' || ch === '.' ? 240 : 30)
    const events = ['pointerdown', 'keydown'] as const
    for (const e of events) addEventListener(e, finish, { once: true })
    return () => { clearTimeout(t); for (const e of events) removeEventListener(e, finish) }
  }, [typed, symptom])

  if (!scenario) {
    return (
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-3)', maxWidth: '60ch' }}>
        This activity is not available yet.
      </p>
    )
  }

  const safe = acked.length === scenario.safety.length
  // Naming a fault with no evidence is a guess, and a guess that happens to
  // be right would score the same as a diagnosis. Require one test first.
  const canAccuse = safe && used.length > 0

  const runTest = (id: string) => {
    if (!safe || result || used.includes(id)) return
    setUsed(u => [...u, id])
  }

  const accuse = (faultId: string) => {
    if (!canAccuse || result) return
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

  const actual = scenario.faults.find(f => f.id === scenario.actualFault)

  return (
    <section aria-label={`Troubleshooter, ${scenario.appliance}`} className="service" style={{ margin: '0 0 20px', maxWidth: 1100 }}>
      <div className="service-stage">
        <PixelScene scenarioId={scenario.id} appliance={scenario.appliance} />
        <div className="win service-talk">
          <h3 className="win-title">Troubleshooter: {scenario.appliance}</h3>
          <p style={{ margin: 0 }}>
            <span className="sr-only">{scenario.symptom}</span>
            <span aria-hidden>{scenario.symptom.slice(0, typed)}</span>
            <span className="cursor" aria-hidden />
          </p>
        </div>
      </div>

      <div className="service-grid">
        <div className="win win--danger">
          <p className="win-title">Before you test</p>
          {scenario.safety.map(s => (
            <label key={s} className="check" style={{ cursor: result ? 'default' : 'pointer' }}>
              <input type="checkbox" checked={acked.includes(s)} disabled={!!result}
                onChange={e => setAcked(a => e.target.checked ? [...a, s] : a.filter(x => x !== s))} />
              <span>{s}</span>
            </label>
          ))}
        </div>

        <div className="win">
          <p className="win-title">Tests {safe ? `(${used.length} used)` : '(locked until the safety steps are ticked)'}</p>
          <ul className="menu">
            {scenario.testPoints.map(tp => {
              const done = used.includes(tp.id)
              return (
                <li key={tp.id}>
                  <button onClick={() => runTest(tp.id)} aria-disabled={!safe || done || !!result}
                    className={done ? 'used' : undefined}>
                    <strong style={{ fontWeight: 400 }}>{tp.label}. </strong>{tp.action}
                  </button>
                  {done && <p role="status" className="reading">Reading: {readingAt(scenario, tp.id)}</p>}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="win">
          <p className="win-title">Name the fault</p>
          {safe && used.length === 0 && (
            <p style={{ margin: '0 0 8px', color: 'var(--grey)' }}>
              Run at least one test first. A fault named without evidence is a guess.
            </p>
          )}
          <ul className="menu">
            {scenario.faults.map(f => (
              <li key={f.id}>
                <button onClick={() => accuse(f.id)} disabled={!canAccuse || !!result}
                  style={result && f.id === scenario.actualFault ? { color: 'var(--phosphor)' } : undefined}>
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {result && (
          <div className="win" role="status" style={{ gridColumn: '1 / -1' }}>
            <p style={{ margin: 0, color: result.correct ? 'var(--phosphor)' : 'var(--amber)' }}>
              {result.correct
                ? `Correct, after ${used.length} ${used.length === 1 ? 'test' : 'tests'}. `
                : `Not quite. The fault was the ${actual?.label.toLowerCase() ?? 'another component'}. `}
              {result.remedy}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
