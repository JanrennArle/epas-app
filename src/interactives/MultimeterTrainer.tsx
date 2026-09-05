import { useState } from 'react'
import { measure } from '../lib/measure'
import type { MeterMode, TestComponent } from '../lib/measure'
import { recordSim } from '../lib/store'
import type { InteractiveProps } from './types'

const BENCH: TestComponent[] = [
  { id: 'R1', kind: 'resistor', label: 'R1  4.7 kOhm 5%', nominal: 4700, tolerance: 0.05, fault: 'ok' },
  { id: 'R2', kind: 'resistor', label: 'R2  220 Ohm 5%', nominal: 220, tolerance: 0.05, fault: 'drift' },
  { id: 'F1', kind: 'fuse', label: 'F1  2 A', nominal: 0.2, tolerance: 0.5, fault: 'open' },
  { id: 'D1', kind: 'diode', label: 'D1  1N4007', nominal: 0.62, tolerance: 0.1, fault: 'ok' },
  { id: 'D2', kind: 'diode', label: 'D2  1N4148', nominal: 0.65, tolerance: 0.1, fault: 'short' },
]

const MODES: { id: MeterMode; label: string }[] = [
  { id: 'ohms', label: 'Ohms' },
  { id: 'continuity', label: 'Cont' },
  { id: 'diode', label: 'Diode' },
  { id: 'dcv', label: 'DCV' },
]

function isHealthy(c: TestComponent): boolean {
  return c.fault === 'ok'
}

export function MultimeterTrainer({ moduleId, config, onEvent }: InteractiveProps) {
  const [mode, setMode] = useState<MeterMode>('ohms')
  const [probed, setProbed] = useState<TestComponent | null>(null)
  const [verdicts, setVerdicts] = useState<Record<string, boolean>>({})

  const reading = probed ? measure(probed, mode) : null
  const judged = Object.keys(verdicts).length
  const correctCount = BENCH.filter(c => verdicts[c.id] === isHealthy(c)).length

  function judge(good: boolean) {
    if (!probed || verdicts[probed.id] !== undefined) return
    const next = { ...verdicts, [probed.id]: good }
    setVerdicts(next)
    onEvent?.({ type: 'attempt', correct: good === isHealthy(probed) })

    if (Object.keys(next).length === BENCH.length) {
      const score = BENCH.filter(c => next[c.id] === isHealthy(c)).length / BENCH.length
      recordSim({
        simId: 'multimeter',
        moduleId,
        score,
        at: new Date().toISOString(),
        evidence: { ...(config ?? {}), verdicts: next },
      })
      onEvent?.({ type: 'complete', score, evidence: { ...(config ?? {}), verdicts: next } })
    }
  }

  return (
    <section aria-label="Multimeter Trainer" style={{
      border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden',
      margin: '0 0 20px', maxWidth: '60ch',
    }}>
      <header style={{ padding: '11px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 660, margin: 0 }}>Multimeter Trainer</h3>
        <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '2px 0 0' }}>
          Probe each part, then decide whether it is good or faulty. {judged} of {BENCH.length} judged.
        </p>
      </header>

      <div className="instrument" style={{ background: '#141A21', padding: 14 }}>
        <div style={{
          background: '#0C1015', border: '1px solid #232D39', borderRadius: 8,
          padding: '12px 14px', textAlign: 'right',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600,
            color: '#5FE3B0', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {reading ? reading.display : '----'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#7A8798', marginTop: 5, letterSpacing: '0.06em' }}>
            {mode.toUpperCase()}{mode === 'continuity' && reading?.beep ? '  BEEP' : ''}
          </div>
        </div>

        <div role="group" aria-label="Meter mode" style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              style={{
                flex: 1, minHeight: 44, borderRadius: 8, border: 0, cursor: 'pointer',
                fontSize: 11.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                background: mode === m.id ? '#F2A93B' : '#1D2630',
                color: mode === m.id ? '#141A21' : '#8E9CAC',
                fontWeight: mode === m.id ? 700 : 400,
              }}>{m.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 14, background: 'var(--surface)' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>
          Bench
        </p>
        <div style={{ display: 'grid', gap: 6 }}>
          {BENCH.map(c => {
            const verdict = verdicts[c.id]
            const wasRight = verdict !== undefined && verdict === isHealthy(c)
            return (
              <button key={c.id} onClick={() => setProbed(c)}
                aria-pressed={probed?.id === c.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  minHeight: 44, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: 'var(--paper)', font: 'inherit', textAlign: 'left',
                  border: `1px solid ${probed?.id === c.id ? 'var(--accent)' : 'var(--line)'}`,
                  color: 'var(--ink)', fontSize: 13,
                }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{c.label}</span>
                {verdict !== undefined && (
                  <span style={{ fontSize: 11.5, fontWeight: 640, color: wasRight ? 'var(--pass)' : 'var(--caution)' }}>
                    {wasRight ? 'Correct' : 'Rethink this one'}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {probed && verdicts[probed.id] === undefined && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => judge(true)} className="tile" style={{
              flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--line)',
              background: 'var(--paper)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}>{probed.id} is good</button>
            <button onClick={() => judge(false)} className="tile" style={{
              flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--line)',
              background: 'var(--paper)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}>{probed.id} is faulty</button>
          </div>
        )}

        {judged === BENCH.length && (
          <p role="status" style={{ fontSize: 13, marginTop: 14, color: 'var(--ink)' }}>
            You judged {correctCount} of {BENCH.length} correctly.
          </p>
        )}
      </div>
    </section>
  )
}
