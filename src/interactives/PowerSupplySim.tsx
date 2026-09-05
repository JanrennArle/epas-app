import { useState } from 'react'
import { waveform, REGULATOR_DROPOUT } from '../lib/signal'
import type { PsuConfig, PsuStage, RectifierKind } from '../lib/signal'
import { recordSim } from '../lib/store'
import type { InteractiveProps } from './types'

const STAGES: { id: PsuStage; label: string }[] = [
  { id: 'secondary', label: 'Secondary' },
  { id: 'rectified', label: 'Rectifier' },
  { id: 'filtered', label: 'Filter' },
  { id: 'regulated', label: 'Output' },
]

const CAPS = [100, 470, 2200, 4700]
const TARGET_V = 12
const LOAD_MA = 500

const FIXED = {
  secondaryVrms: 15,
  loadMa: LOAD_MA,
  regulatorV: TARGET_V,
  mains: 60,
} as const

/** Flat within 100 mV across the whole cycle is a stable supply. */
function isStable(cfg: PsuConfig): boolean {
  const out = waveform('regulated', cfg)
  return out.ripple < 0.1 && out.vMin > TARGET_V - 0.1
}

function Scope({ points, vRef }: { points: number[]; vRef: number }) {
  const w = 300
  const h = 110
  const top = Math.max(vRef, ...points, 1)
  const bottom = Math.min(0, ...points)
  const range = top - bottom || 1
  const y = (v: number) => h - ((v - bottom) / range) * h
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${((i / (points.length - 1)) * w).toFixed(1)},${y(p).toFixed(1)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img"
      aria-label={`Waveform, peak ${Math.max(...points).toFixed(1)} volts, trough ${Math.min(...points).toFixed(1)} volts`}>
      <rect x="0" y="0" width={w} height={h} fill="#0C1015" />
      <line x1="0" y1={y(0)} x2={w} y2={y(0)} stroke="#232D39" strokeWidth="1" />
      <line x1="0" y1={y(vRef)} x2={w} y2={y(vRef)} stroke="#F2A93B" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <path d={d} fill="none" stroke="#5FE3B0" strokeWidth="1.6" />
    </svg>
  )
}

export function PowerSupplySim({ moduleId, config, onEvent }: InteractiveProps) {
  const [rectifier, setRectifier] = useState<RectifierKind>('half')
  const [filterUf, setFilterUf] = useState<number>(100)
  const [stage, setStage] = useState<PsuStage>('secondary')
  const [tried, setTried] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const cfg: PsuConfig = { ...FIXED, rectifier, filterUf }
  const w = waveform(stage, cfg)
  const out = waveform('regulated', cfg)
  const stable = isStable(cfg)

  function test() {
    if (done) return
    const attempt = `${rectifier}/${filterUf}uF`
    const next = tried.includes(attempt) ? tried : [...tried, attempt]
    setTried(next)
    onEvent?.({ type: 'attempt', correct: stable })
    if (!stable) return

    setDone(true)
    // First try scores full marks; each further configuration costs a fifth.
    const score = Math.max(0.2, 1 - 0.2 * (next.length - 1))
    const evidence = { attempts: next, solvedWith: attempt, ...(config ?? {}) }
    recordSim({ simId: 'psu', moduleId, score, at: new Date().toISOString(), evidence })
    onEvent?.({ type: 'complete', score, evidence })
  }

  return (
    <section aria-label="Power Supply Simulator" style={{
      border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden',
      margin: '0 0 20px', maxWidth: '60ch',
    }}>
      <header style={{ padding: '11px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 660, margin: 0 }}>Power Supply Simulator</h3>
        <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '2px 0 0' }}>
          Build a supply that holds {TARGET_V}.0 V steady at {LOAD_MA} mA. Transformer secondary is 15 V RMS.
        </p>
      </header>

      <div className="instrument" style={{ background: '#141A21', padding: 14 }}>
        <Scope points={w.points} vRef={stage === 'regulated' ? TARGET_V : 0} />
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7A8798',
        }}>
          <span>PEAK {w.vMax.toFixed(2)} V</span>
          <span>DC {w.vDc.toFixed(2)} V</span>
          <span>RIPPLE {w.ripple.toFixed(2)} V</span>
        </div>

        <div role="group" aria-label="Stage" style={{ display: 'flex', gap: 5, marginTop: 10 }}>
          {STAGES.map(s => (
            <button key={s.id} onClick={() => setStage(s.id)} aria-pressed={stage === s.id}
              style={{
                flex: 1, minHeight: 44, borderRadius: 8, border: 0, cursor: 'pointer',
                fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
                background: stage === s.id ? '#F2A93B' : '#1D2630',
                color: stage === s.id ? '#141A21' : '#8E9CAC',
                fontWeight: stage === s.id ? 700 : 400,
              }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 14, background: 'var(--surface)' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>
          Rectifier
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['half', 'full'] as RectifierKind[]).map(r => (
            <button key={r} onClick={() => { setRectifier(r); setDone(false) }} aria-pressed={rectifier === r}
              disabled={done}
              style={{
                flex: 1, minHeight: 44, borderRadius: 10, cursor: done ? 'default' : 'pointer',
                background: 'var(--paper)', font: 'inherit', fontSize: 13,
                border: `1px solid ${rectifier === r ? 'var(--accent)' : 'var(--line)'}`,
                color: 'var(--ink)',
              }}>{r === 'half' ? 'Half wave' : 'Full wave bridge'}</button>
          ))}
        </div>

        <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>
          Filter capacitor
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {CAPS.map(c => (
            <button key={c} onClick={() => { setFilterUf(c); setDone(false) }} aria-pressed={filterUf === c}
              disabled={done}
              style={{
                flex: 1, minHeight: 44, borderRadius: 10, cursor: done ? 'default' : 'pointer',
                background: 'var(--paper)', font: 'inherit', fontSize: 12.5,
                fontFamily: 'var(--font-mono)',
                border: `1px solid ${filterUf === c ? 'var(--accent)' : 'var(--line)'}`,
                color: 'var(--ink)',
              }}>{c}u</button>
          ))}
        </div>

        {!done ? (
          <button onClick={test} className="tile" style={{
            background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 10,
            padding: '11px 18px', fontSize: 14, fontWeight: 620, cursor: 'pointer', minHeight: 44,
          }}>Test the output</button>
        ) : (
          <p role="status" style={{ fontSize: 13, color: 'var(--pass)', margin: 0, lineHeight: 1.55 }}>
            Stable at {out.vDc.toFixed(2)} V with {out.ripple.toFixed(2)} V of ripple. You reached it in {tried.length} {tried.length === 1 ? 'configuration' : 'configurations'}.
          </p>
        )}

        {tried.length > 0 && !done && (
          <p role="status" style={{ fontSize: 12.5, color: 'var(--caution)', marginTop: 10, lineHeight: 1.55 }}>
            Output falls to {out.vMin.toFixed(2)} V at the bottom of the ripple. The regulator needs at least {REGULATOR_DROPOUT} V above {TARGET_V} V at every instant, so look at the Filter stage and see how far it dips.
          </p>
        )}
      </div>
    </section>
  )
}
