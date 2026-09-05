# EPAS Flagship Simulations, M2 and M3: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The two remaining flagship simulations, each proven by the module that needs it. A student configures a regulated DC supply and watches the waveform change at every stage, and diagnoses a dead electric fan by choosing tests rather than guessing.

**Architecture:** Two new pure engines beside `lib/measure`, each authorable as data and unit tested. Two SVG presentation components that mount through a new sim registry rather than an if-chain in the block renderer. Two content modules consuming them. No new dependencies.

**Tech Stack:** Existing only. Vite, React, TypeScript, React Router (hash), Zustand is present but unused, Vitest, SVG.

**Spec:** `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`
**Visual authority:** `docs/DESIGN.md`
**Deferred items from Plan 1:** `docs/superpowers/plans/CARRY-FORWARD.md`
**Reference implementation:** Plan 1 shipped `src/lib/measure.ts` and `src/interactives/MultimeterTrainer.tsx`. Match their shape.

## Global Constraints

Every task's requirements implicitly include these.

- **No new dependencies.** No new npm packages for any reason.
- **No CDN, no external runtime asset.** The app must work with the network off.
- **SVG only.** No canvas, no WebGL.
- **Engines are pure.** No randomness, no clock, no module state. Same inputs, same outputs, always. Students compare readings with each other and a teacher marks against them.
- **Engines never throw.** Any combination of inputs returns a value.
- **One accent:** `var(--accent)`. **`--danger` is reserved for electrical safety** and nothing else. Wrong answers use `var(--caution)`.
- **Instrument literals** (`#141A21` ground, `#0C1015` screen, `#5FE3B0` reading, `#F2A93B` active control) are authorised only inside an instrument panel, and any such panel carries `className="instrument"` so the focus ring stays visible. Everything outside uses tokens.
- **Radius:** cards and tiles 14px, controls 10px, pills full. Decorative sub-elements may go smaller.
- **Motion:** only `transform` and `opacity`, only the existing `.tile` press. No new transitions, no celebration on success.
- **Touch targets 44px minimum** on every interactive element.
- **No em dashes, no emoji** in any user-visible string.
- **Only `src/lib/store.ts` touches localStorage.**
- **New modules ship `teacherReviewed: false`.**
- **Competency strings are quoted verbatim** from `docs/reference/G12-TechPro-EPAS-budget-of-work.txt`. They are cited in a research paper. Never paraphrase, never fix grammar, keep trailing full stops.
- Compiles under `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`. `npm run build` runs `tsc -b && vite build`.

## Decision carried from Plan 1: `onEvent` stays unwired

`CARRY-FORWARD.md` flags that `BlockRenderer` never passes `onEvent`, so `progress` and `attempt` events go nowhere. The resolution is **not** to plumb them into storage, which would need a schema migration for data the export does not use. Instead: **each simulation records its own attempt trail inside `evidence` on the single `recordSim` call it already makes.** `MultimeterTrainer` already does this with `evidence.verdicts`. Both new simulations follow the same convention. `onEvent` remains in `InteractiveProps` for lesson-level UI reactions and stays optional.

---

## File Structure

```
src/
  lib/
    signal.ts        power supply waveform model, pure
    diagnose.ts      fault tree over declared test points, pure
  interactives/
    registry.ts      simId -> component, replaces the if-chain
    PowerSupplySim.tsx
    SystemTroubleshooter.tsx
  content/
    scenarios/
      fan.ts         the electric fan fault scenario, data
    m2.ts
    m3.ts
    index.ts         MODIFY: register m2 and m3
  ui/blocks/
    BlockRenderer.tsx  MODIFY: use the registry
tests/
  signal.test.ts  diagnose.test.ts  registry.test.tsx
```

---

### Task 1: Sim registry

**Files:**
- Create: `src/interactives/registry.ts`
- Modify: `src/ui/blocks/BlockRenderer.tsx`
- Test: `tests/registry.test.tsx`

**Interfaces:**
- Consumes: `InteractiveProps` from `src/interactives/types.ts`, `MultimeterTrainer` from `src/interactives/MultimeterTrainer.tsx`
- Produces: `SIMS: Record<string, ComponentType<InteractiveProps>>` and `getSim(id): ComponentType<InteractiveProps> | undefined`

Adding a simulation must become a one-line registry entry. Today `BlockRenderer` has `if (b.simId === 'multimeter')` and would grow a branch per sim.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/registry.test.tsx
import { render, screen } from '@testing-library/react'
import { getSim, SIMS } from '../src/interactives/registry'
import { BlockRenderer } from '../src/ui/blocks/BlockRenderer'
import type { Block } from '../src/lib/types'

describe('sim registry', () => {
  it('resolves a registered sim', () => {
    expect(getSim('multimeter')).toBe(SIMS.multimeter)
  })

  it('returns undefined for an unknown sim', () => {
    expect(getSim('nope')).toBeUndefined()
  })

  it('renders a registered sim through the block renderer', () => {
    const blocks: Block[] = [{ kind: 'interactive', simId: 'multimeter' }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getByLabelText('Multimeter Trainer')).toBeInTheDocument()
  })

  it('tells the student plainly when a sim is not registered', () => {
    const blocks: Block[] = [{ kind: 'interactive', simId: 'not-built' }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getByText('This activity is not available yet.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/registry.test.tsx`
Expected: FAIL, cannot resolve `../src/interactives/registry`.

- [ ] **Step 3: Write src/interactives/registry.ts**

```ts
import type { ComponentType } from 'react'
import type { InteractiveProps } from './types'
import { MultimeterTrainer } from './MultimeterTrainer'

/**
 * Every simulation in the app. Adding one is a single entry here plus the
 * component file; nothing else in the app needs to know it exists.
 */
export const SIMS: Record<string, ComponentType<InteractiveProps>> = {
  multimeter: MultimeterTrainer,
}

export function getSim(id: string): ComponentType<InteractiveProps> | undefined {
  return SIMS[id]
}
```

- [ ] **Step 4: Rewrite the interactive case in BlockRenderer**

Replace the `import { MultimeterTrainer } ...` line with `import { getSim } from '../../interactives/registry'`, and replace the whole `case 'interactive':` body with:

```tsx
          case 'interactive': {
            const Sim = getSim(b.simId)
            if (Sim) {
              return <Sim key={i} moduleId={moduleId} config={b.config} />
            }
            return (
              <p key={i} style={{ ...text, color: 'var(--ink-3)' }}>
                This activity is not available yet.
              </p>
            )
          }
```

Change nothing else in the file.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/registry.test.tsx`
Expected: 4 passing.
Run: `npm test`
Expected: 34 passing.

- [ ] **Step 6: Commit**

```bash
git add src/interactives/registry.ts src/ui/blocks/BlockRenderer.tsx tests/registry.test.tsx
git commit -m "feat: add sim registry so block renderer stops growing branches"
```

---

### Task 2: The signal engine

**Files:**
- Create: `src/lib/signal.ts`
- Test: `tests/signal.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type PsuStage = 'secondary' | 'rectified' | 'filtered' | 'regulated'`
  - `type RectifierKind = 'half' | 'full'`
  - `interface PsuConfig { secondaryVrms: number; rectifier: RectifierKind; filterUf: number; loadMa: number; regulatorV: number; mains: number }`
  - `interface Waveform { points: number[]; vMax: number; vMin: number; vDc: number; ripple: number }`
  - `waveform(stage: PsuStage, cfg: PsuConfig, samples?: number, cycles?: number): Waveform`
  - `REGULATOR_DROPOUT: number`

The engine models the four stages of a linear regulated supply. Its teaching job is to make the causal chain visible: too small a filter capacitor produces large ripple, and when the ripple trough falls below the regulator's dropout voltage the regulated output sags instead of holding steady. That is the exact failure a student will meet on the bench.

- [ ] **Step 1: Write the failing test**

```ts
// tests/signal.test.ts
import { waveform, REGULATOR_DROPOUT } from '../src/lib/signal'
import type { PsuConfig } from '../src/lib/signal'

const base: PsuConfig = {
  secondaryVrms: 15,
  rectifier: 'full',
  filterUf: 2200,
  loadMa: 500,
  regulatorV: 12,
  mains: 60,
}

const cfg = (over: Partial<PsuConfig> = {}): PsuConfig => ({ ...base, ...over })

describe('secondary', () => {
  it('peaks at the RMS value times root two', () => {
    const w = waveform('secondary', cfg())
    expect(w.vMax).toBeCloseTo(21.21, 1)
  })

  it('swings symmetrically about zero', () => {
    const w = waveform('secondary', cfg())
    expect(w.vMin).toBeCloseTo(-w.vMax, 1)
    expect(w.vDc).toBeCloseTo(0, 1)
  })
})

describe('rectified', () => {
  it('never goes negative', () => {
    const w = waveform('rectified', cfg())
    expect(w.vMin).toBeGreaterThanOrEqual(0)
  })

  it('loses two diode drops through a bridge', () => {
    const w = waveform('rectified', cfg({ rectifier: 'full' }))
    expect(w.vMax).toBeCloseTo(21.21 - 1.4, 1)
  })

  it('loses one diode drop through a half wave rectifier', () => {
    const w = waveform('rectified', cfg({ rectifier: 'half' }))
    expect(w.vMax).toBeCloseTo(21.21 - 0.7, 1)
  })
})

describe('filtered', () => {
  it('a large capacitor leaves little ripple', () => {
    const w = waveform('filtered', cfg({ filterUf: 4700 }))
    expect(w.ripple).toBeLessThan(1)
  })

  it('a small capacitor leaves large ripple', () => {
    const big = waveform('filtered', cfg({ filterUf: 4700 })).ripple
    const small = waveform('filtered', cfg({ filterUf: 100 })).ripple
    expect(small).toBeGreaterThan(big * 5)
  })

  it('a heavier load increases ripple', () => {
    const light = waveform('filtered', cfg({ loadMa: 100 })).ripple
    const heavy = waveform('filtered', cfg({ loadMa: 500 })).ripple
    expect(heavy).toBeGreaterThan(light)
  })

  it('half wave ripples twice as much as full wave, all else equal', () => {
    const full = waveform('filtered', cfg({ rectifier: 'full' })).ripple
    const half = waveform('filtered', cfg({ rectifier: 'half' })).ripple
    expect(half).toBeCloseTo(full * 2, 1)
  })

  it('with no capacitor fitted it is the rectified waveform', () => {
    const rect = waveform('rectified', cfg({ filterUf: 0 }))
    const filt = waveform('filtered', cfg({ filterUf: 0 }))
    expect(filt.vMax).toBeCloseTo(rect.vMax, 3)
    expect(filt.vMin).toBeCloseTo(rect.vMin, 3)
  })
})

describe('regulated', () => {
  it('holds flat at the regulator voltage when there is headroom', () => {
    const w = waveform('regulated', cfg({ filterUf: 4700 }))
    expect(w.vMax).toBeCloseTo(12, 2)
    expect(w.vMin).toBeCloseTo(12, 2)
    expect(w.ripple).toBeLessThan(0.01)
  })

  it('sags when the ripple trough falls below dropout', () => {
    const w = waveform('regulated', cfg({ filterUf: 100 }))
    expect(w.vMin).toBeLessThan(12)
    expect(w.ripple).toBeGreaterThan(0.5)
  })

  it('never exceeds the regulator voltage', () => {
    const w = waveform('regulated', cfg({ secondaryVrms: 30 }))
    expect(w.vMax).toBeLessThanOrEqual(12.001)
  })

  it('cannot output more than its input less the dropout', () => {
    const w = waveform('regulated', cfg({ secondaryVrms: 9, filterUf: 4700 }))
    const filt = waveform('filtered', cfg({ secondaryVrms: 9, filterUf: 4700 }))
    expect(w.vMax).toBeLessThanOrEqual(filt.vMax - REGULATOR_DROPOUT + 0.001)
  })
})

describe('shape and totality', () => {
  it('returns the requested number of samples', () => {
    expect(waveform('secondary', cfg(), 120).points).toHaveLength(120)
  })

  it('does not throw on absurd input', () => {
    const wild = cfg({ secondaryVrms: 0, filterUf: 0, loadMa: 0, mains: 0, regulatorV: 0 })
    expect(() => waveform('regulated', wild)).not.toThrow()
    expect(Number.isFinite(waveform('regulated', wild).vDc)).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/signal.test.ts`
Expected: FAIL, cannot resolve `../src/lib/signal`.

- [ ] **Step 3: Write src/lib/signal.ts**

```ts
export type PsuStage = 'secondary' | 'rectified' | 'filtered' | 'regulated'
export type RectifierKind = 'half' | 'full'

export interface PsuConfig {
  /** RMS volts on the transformer secondary. */
  secondaryVrms: number
  rectifier: RectifierKind
  /** Filter capacitance in microfarads. Zero means no capacitor fitted. */
  filterUf: number
  /** Load current in milliamps. */
  loadMa: number
  /** Regulator output volts, for example 12 for a 7812. */
  regulatorV: number
  /** Mains frequency in hertz. 60 in the Philippines. */
  mains: number
}

export interface Waveform {
  /** Volts, evenly spaced across `cycles` mains cycles. */
  points: number[]
  vMax: number
  vMin: number
  /** Mean value, which is what a DC meter reads. */
  vDc: number
  /** Peak to peak ripple. */
  ripple: number
}

/** A 78xx series regulator needs roughly two volts of headroom. */
export const REGULATOR_DROPOUT = 2

const DIODE_DROP = { half: 0.7, full: 1.4 } as const

function safe(n: number, fallback = 0): number {
  return Number.isFinite(n) ? n : fallback
}

function summarise(points: number[]): Waveform {
  if (points.length === 0) {
    return { points, vMax: 0, vMin: 0, vDc: 0, ripple: 0 }
  }
  let vMax = points[0]!
  let vMin = points[0]!
  let sum = 0
  for (const p of points) {
    if (p > vMax) vMax = p
    if (p < vMin) vMin = p
    sum += p
  }
  return { points, vMax, vMin, vDc: sum / points.length, ripple: vMax - vMin }
}

/** Peak volts on the secondary, before any rectifier loss. */
function secondaryPeak(cfg: PsuConfig): number {
  return safe(cfg.secondaryVrms) * Math.SQRT2
}

/** Peak volts after the rectifier. */
function rectifiedPeak(cfg: PsuConfig): number {
  return Math.max(0, secondaryPeak(cfg) - DIODE_DROP[cfg.rectifier])
}

/** Ripple frequency. A bridge charges the capacitor twice per mains cycle. */
function rippleHz(cfg: PsuConfig): number {
  return safe(cfg.mains) * (cfg.rectifier === 'full' ? 2 : 1)
}

/**
 * Peak to peak ripple across the filter capacitor, from the standard
 * approximation Vpp = I / (f * C). With no capacitor fitted the output
 * swings the full rectified waveform.
 */
function rippleVolts(cfg: PsuConfig): number {
  const peak = rectifiedPeak(cfg)
  if (cfg.filterUf <= 0) return peak
  const f = rippleHz(cfg)
  if (f <= 0) return peak
  const i = safe(cfg.loadMa) / 1000
  const c = cfg.filterUf / 1e6
  return Math.min(peak, safe(i / (f * c), peak))
}

function sampleSecondary(cfg: PsuConfig, t: number): number {
  return secondaryPeak(cfg) * Math.sin(2 * Math.PI * safe(cfg.mains) * t)
}

function sampleRectified(cfg: PsuConfig, t: number): number {
  const raw = sampleSecondary(cfg, t)
  const drop = DIODE_DROP[cfg.rectifier]
  const conducting = cfg.rectifier === 'full' ? Math.abs(raw) : Math.max(0, raw)
  return Math.max(0, conducting - drop)
}

function sampleFiltered(cfg: PsuConfig, t: number): number {
  if (cfg.filterUf <= 0) return sampleRectified(cfg, t)
  const f = rippleHz(cfg)
  if (f <= 0) return rectifiedPeak(cfg)
  // The capacitor charges to the peak, then droops roughly linearly until
  // the next peak arrives. A sawtooth is the honest simple picture.
  const phase = (t * f) % 1
  return rectifiedPeak(cfg) - rippleVolts(cfg) * phase
}

function sampleRegulated(cfg: PsuConfig, t: number): number {
  const headroom = sampleFiltered(cfg, t) - REGULATOR_DROPOUT
  return Math.max(0, Math.min(safe(cfg.regulatorV), headroom))
}

const SAMPLERS: Record<PsuStage, (cfg: PsuConfig, t: number) => number> = {
  secondary: sampleSecondary,
  rectified: sampleRectified,
  filtered: sampleFiltered,
  regulated: sampleRegulated,
}

export function waveform(
  stage: PsuStage,
  cfg: PsuConfig,
  samples = 240,
  cycles = 2,
): Waveform {
  const n = Math.max(1, Math.floor(samples))
  const hz = safe(cfg.mains)
  const span = hz > 0 ? cycles / hz : 1
  const sampler = SAMPLERS[stage]
  const points: number[] = []
  for (let i = 0; i < n; i++) {
    points.push(safe(sampler(cfg, (i / n) * span)))
  }
  return summarise(points)
}
```

- [ ] **Step 4: Run to verify all pass**

Run: `npx vitest run tests/signal.test.ts`
Expected: 15 passing.
Run: `npm test`
Expected: 49 passing.

If a test fails, the bug is in your transcription. Do not adjust `DIODE_DROP`, `REGULATOR_DROPOUT`, or the ripple formula to make a test go green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/signal.ts tests/signal.test.ts
git commit -m "feat: add power supply waveform engine"
```

---

### Task 3: Power Supply Simulator

**Files:**
- Create: `src/interactives/PowerSupplySim.tsx`
- Modify: `src/interactives/registry.ts`

**Interfaces:**
- Consumes: `waveform`, `REGULATOR_DROPOUT`, `PsuConfig`, `PsuStage` from `src/lib/signal`; `recordSim` from `src/lib/store`; `InteractiveProps` from `./types`
- Produces: `PowerSupplySim`, registered as `'psu'`

The student builds a supply that must hold 12.0 V at 500 mA. They pick a rectifier and a filter capacitor, then read the scope at each stage. The task completes when the regulated stage is flat at 12 V under full load. Evidence records every configuration they tried, so the export can show how many attempts it took.

- [ ] **Step 1: Write src/interactives/PowerSupplySim.tsx**

```tsx
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
```

- [ ] **Step 2: Register it**

In `src/interactives/registry.ts`, add the import and one entry:

```ts
import { PowerSupplySim } from './PowerSupplySim'
```
```ts
  psu: PowerSupplySim,
```

- [ ] **Step 3: Verify**

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 49 passing, unchanged

- [ ] **Step 4: Commit**

```bash
git add src/interactives/PowerSupplySim.tsx src/interactives/registry.ts
git commit -m "feat: add Power Supply Simulator"
```

---

### Task 4: The diagnose engine

**Files:**
- Create: `src/lib/diagnose.ts`
- Test: `tests/diagnose.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface Fault { id: string; label: string; remedy: string }`
  - `interface TestPoint { id: string; label: string; action: string; readings: Record<string, string>; implicates: string[] }`
  - `interface Scenario { id: string; appliance: string; symptom: string; safety: string[]; faults: Fault[]; actualFault: string; testPoints: TestPoint[] }`
  - `readingAt(s: Scenario, testPointId: string): string`
  - `isConclusive(s: Scenario, testPointId: string): boolean`
  - `requiredTests(s: Scenario): number`
  - `scoreDiagnosis(s: Scenario, testsUsed: string[], faultId: string): { correct: boolean; score: number; remedy: string }`

`TestPoint.readings` is keyed by fault id, with `'*'` as the reading when the named fault is not the one present. Adding a scenario is a data file; no engine change.

- [ ] **Step 1: Write the failing test**

```ts
// tests/diagnose.test.ts
import { readingAt, isConclusive, requiredTests, scoreDiagnosis } from '../src/lib/diagnose'
import type { Scenario } from '../src/lib/diagnose'

const s: Scenario = {
  id: 'test',
  appliance: 'Test appliance',
  symptom: 'Nothing happens.',
  safety: ['Unplug it.'],
  faults: [
    { id: 'cord', label: 'Broken cord', remedy: 'Replace the cord.' },
    { id: 'fuse', label: 'Blown fuse', remedy: 'Fit a fuse of the same rating.' },
    { id: 'winding', label: 'Open winding', remedy: 'Rewind or replace the motor.' },
  ],
  actualFault: 'fuse',
  testPoints: [
    { id: 'tp-cord', label: 'Cord', action: 'Continuity across the plug pins.',
      readings: { cord: 'OL', '*': '0.4 ohm, beeps' }, implicates: ['cord'] },
    { id: 'tp-fuse', label: 'Fuse', action: 'Continuity across the fuse.',
      readings: { fuse: 'OL', '*': '0.2 ohm, beeps' }, implicates: ['fuse'] },
    { id: 'tp-wind', label: 'Winding', action: 'Resistance across the winding.',
      readings: { winding: 'OL', '*': '38 ohm' }, implicates: ['winding'] },
  ],
}

describe('readingAt', () => {
  it('gives the fault reading at the test point that exposes it', () => {
    expect(readingAt(s, 'tp-fuse')).toBe('OL')
  })

  it('gives the healthy reading everywhere else', () => {
    expect(readingAt(s, 'tp-cord')).toBe('0.4 ohm, beeps')
    expect(readingAt(s, 'tp-wind')).toBe('38 ohm')
  })

  it('returns an empty string for an unknown test point rather than throwing', () => {
    expect(readingAt(s, 'nope')).toBe('')
  })
})

describe('isConclusive', () => {
  it('is true at the test point that implicates the actual fault', () => {
    expect(isConclusive(s, 'tp-fuse')).toBe(true)
  })

  it('is false elsewhere', () => {
    expect(isConclusive(s, 'tp-cord')).toBe(false)
  })

  it('is false for an unknown test point', () => {
    expect(isConclusive(s, 'nope')).toBe(false)
  })
})

describe('requiredTests', () => {
  it('counts the test points that implicate the actual fault', () => {
    expect(requiredTests(s)).toBe(1)
  })
})

describe('scoreDiagnosis', () => {
  it('gives full marks for the right fault found with the minimum tests', () => {
    const r = scoreDiagnosis(s, ['tp-fuse'], 'fuse')
    expect(r.correct).toBe(true)
    expect(r.score).toBe(1)
    expect(r.remedy).toBe('Fit a fuse of the same rating.')
  })

  it('deducts for each extra test beyond the minimum', () => {
    expect(scoreDiagnosis(s, ['tp-cord', 'tp-fuse'], 'fuse').score).toBeCloseTo(0.85, 5)
    expect(scoreDiagnosis(s, ['tp-cord', 'tp-wind', 'tp-fuse'], 'fuse').score).toBeCloseTo(0.7, 5)
  })

  it('never drops a correct diagnosis below a floor', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    expect(scoreDiagnosis(s, many, 'fuse').score).toBe(0.4)
  })

  it('scores zero for the wrong fault, however few tests were used', () => {
    const r = scoreDiagnosis(s, ['tp-fuse'], 'cord')
    expect(r.correct).toBe(false)
    expect(r.score).toBe(0)
  })

  it('still names the correct remedy when the student got it wrong', () => {
    expect(scoreDiagnosis(s, [], 'cord').remedy).toBe('Fit a fuse of the same rating.')
  })

  it('does not throw for an unknown fault id', () => {
    expect(() => scoreDiagnosis(s, [], 'nonsense')).not.toThrow()
    expect(scoreDiagnosis(s, [], 'nonsense').correct).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/diagnose.test.ts`
Expected: FAIL, cannot resolve `../src/lib/diagnose`.

- [ ] **Step 3: Write src/lib/diagnose.ts**

```ts
export interface Fault {
  id: string
  label: string
  /** What the student does about it once it is identified. */
  remedy: string
}

export interface TestPoint {
  id: string
  label: string
  /** What the student physically does, in the imperative. */
  action: string
  /**
   * Reading keyed by fault id. The key '*' is the reading when the fault
   * present in this scenario is not one this test point exposes.
   */
  readings: Record<string, string>
  /** Fault ids this test point conclusively implicates. */
  implicates: string[]
}

export interface Scenario {
  id: string
  appliance: string
  symptom: string
  /** Steps that must be acknowledged before any test is allowed. */
  safety: string[]
  faults: Fault[]
  /** The fault actually present. */
  actualFault: string
  testPoints: TestPoint[]
}

/** Each test beyond the minimum costs this much. */
const PENALTY = 0.15
/** A correct diagnosis never scores below this, however long it took. */
const FLOOR = 0.4

function point(s: Scenario, id: string): TestPoint | undefined {
  return s.testPoints.find(t => t.id === id)
}

export function readingAt(s: Scenario, testPointId: string): string {
  const tp = point(s, testPointId)
  if (!tp) return ''
  return tp.readings[s.actualFault] ?? tp.readings['*'] ?? ''
}

export function isConclusive(s: Scenario, testPointId: string): boolean {
  const tp = point(s, testPointId)
  if (!tp) return false
  return tp.implicates.includes(s.actualFault)
}

export function requiredTests(s: Scenario): number {
  const n = s.testPoints.filter(t => t.implicates.includes(s.actualFault)).length
  return Math.max(1, n)
}

export function scoreDiagnosis(
  s: Scenario,
  testsUsed: string[],
  faultId: string,
): { correct: boolean; score: number; remedy: string } {
  const actual = s.faults.find(f => f.id === s.actualFault)
  const remedy = actual?.remedy ?? ''
  const correct = faultId === s.actualFault
  if (!correct) return { correct: false, score: 0, remedy }
  const extra = Math.max(0, testsUsed.length - requiredTests(s))
  const score = Math.max(FLOOR, 1 - PENALTY * extra)
  return { correct: true, score, remedy }
}
```

- [ ] **Step 4: Run to verify all pass**

Run: `npx vitest run tests/diagnose.test.ts`
Expected: 14 passing.
Run: `npm test`
Expected: 63 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diagnose.ts tests/diagnose.test.ts
git commit -m "feat: add fault diagnosis engine"
```

---

### Task 5: System Troubleshooter and the electric fan scenario

**Files:**
- Create: `src/content/scenarios/fan.ts`, `src/interactives/SystemTroubleshooter.tsx`
- Modify: `src/interactives/registry.ts`

**Interfaces:**
- Consumes: everything exported by `src/lib/diagnose`, `recordSim` from `src/lib/store`, `InteractiveProps`
- Produces: `fanScenario: Scenario`, `SystemTroubleshooter` registered as `'troubleshoot'`, and `SCENARIOS: Record<string, Scenario>` exported from `src/content/scenarios/index.ts`

The component reads `config.scenario` to choose which scenario to run, so Plan 3 adds the other seven appliances as data files and registry entries with no component change.

**Safety gate:** the student must acknowledge every safety step before any test point unlocks. This is the app's model of the habit the subject is trying to build, so it is not skippable.

- [ ] **Step 1: Write src/content/scenarios/fan.ts**

```ts
import type { Scenario } from '../../lib/diagnose'

export const fanScenario: Scenario = {
  id: 'fan',
  appliance: 'Electric fan',
  symptom: 'The fan is plugged in and switched on, but nothing happens. No noise, no movement, no smell of burning.',
  safety: [
    'Unplug the fan from the outlet before opening any part of it.',
    'Set your multimeter to continuity or resistance, never to volts, for a dead unit you have isolated.',
    'Check the capacitor is discharged before touching the motor terminals.',
  ],
  faults: [
    { id: 'cord', label: 'Broken supply cord', remedy: 'Replace the cord, or re-terminate it if the break is at the plug.' },
    { id: 'fuse', label: 'Open thermal fuse', remedy: 'Fit a thermal fuse of the same rating and temperature. Never bridge it.' },
    { id: 'switch', label: 'Faulty speed switch', remedy: 'Clean or replace the switch assembly.' },
    { id: 'capacitor', label: 'Failed run capacitor', remedy: 'Replace with the same microfarad and voltage rating.' },
    { id: 'winding', label: 'Open motor winding', remedy: 'Rewind or replace the motor. Usually not economical on a small fan.' },
  ],
  actualFault: 'fuse',
  testPoints: [
    {
      id: 'tp-plug', label: 'Supply cord', action: 'Continuity across the plug pins with the switch on speed 1.',
      readings: { cord: 'OL', '*': '0.6 ohm, meter beeps' },
      implicates: ['cord'],
    },
    {
      id: 'tp-switch', label: 'Speed switch', action: 'Continuity across the switch contacts, worked through each speed.',
      readings: { switch: 'OL on every speed', '*': 'Beeps on each speed in turn' },
      implicates: ['switch'],
    },
    {
      id: 'tp-fuse', label: 'Thermal fuse', action: 'Continuity across the thermal fuse buried in the motor windings.',
      readings: { fuse: 'OL', '*': '0.2 ohm, meter beeps' },
      implicates: ['fuse'],
    },
    {
      id: 'tp-cap', label: 'Run capacitor', action: 'Capacitance across the run capacitor, discharged first.',
      readings: { capacitor: '0.1 uF against a marked 1.5 uF', '*': '1.48 uF against a marked 1.5 uF' },
      implicates: ['capacitor'],
    },
    {
      id: 'tp-wind', label: 'Motor winding', action: 'Resistance across the main winding.',
      readings: { winding: 'OL', '*': '312 ohm' },
      implicates: ['winding'],
    },
  ],
}
```

- [ ] **Step 2: Write src/content/scenarios/index.ts**

```ts
import type { Scenario } from '../../lib/diagnose'
import { fanScenario } from './fan'

export const SCENARIOS: Record<string, Scenario> = {
  fan: fanScenario,
}
```

- [ ] **Step 3: Write src/interactives/SystemTroubleshooter.tsx**

```tsx
import { useState } from 'react'
import { readingAt, scoreDiagnosis } from '../lib/diagnose'
import { recordSim } from '../lib/store'
import { SCENARIOS } from '../content/scenarios'
import type { InteractiveProps } from './types'

const label: React.CSSProperties = {
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

  function runTest(id: string) {
    if (result || used.includes(id)) return
    setUsed(u => [...u, id])
  }

  function accuse(faultId: string) {
    if (result) return
    const r = scoreDiagnosis(scenario, used, faultId)
    setResult(r)
    onEvent?.({ type: 'attempt', correct: r.correct })
    const evidence = {
      scenario: scenario.id, testsUsed: used, answered: faultId,
      correct: r.correct, ...(config ?? {}),
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
                <button onClick={() => runTest(tp.id)} disabled={!safe || done || !!result}
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
                  <p style={{
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
              : 'Not quite. The fault was the thermal fuse. '}
            {result.remedy}
          </p>
        )}
      </div>
    </section>
  )
}
```

Note the hardcoded fault name in the incorrect branch is wrong for other scenarios. Replace that string with a lookup before Plan 3 adds more scenarios:
`${scenario.faults.find(f => f.id === scenario.actualFault)?.label ?? 'another component'}.` Apply that lookup now rather than shipping the literal.

- [ ] **Step 4: Register it**

In `src/interactives/registry.ts` add the import and the entry `troubleshoot: SystemTroubleshooter,`.

- [ ] **Step 5: Verify**

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 63 passing

- [ ] **Step 6: Commit**

```bash
git add src/content/scenarios src/interactives/SystemTroubleshooter.tsx src/interactives/registry.ts
git commit -m "feat: add System Troubleshooter with the electric fan scenario"
```

---

### Task 6: Module 2 content

**Files:**
- Create: `src/content/m2.ts`
- Modify: `src/content/index.ts`

**Interfaces:**
- Consumes: `Module` from `src/lib/types`
- Produces: `m2: Module`, registered in `MODULES`

Four outcomes, one per Budget of Work competency. The fourth embeds the Power Supply Simulator.

- [ ] **Step 1: Write src/content/m2.ts**

```ts
import type { Module } from '../lib/types'

export const m2: Module = {
  id: 'm2',
  week: 'Week 2',
  title: 'PCB, Soldering and Power Supplies',
  tint: 'm2',
  teacherReviewed: false,
  competencies: [
    'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
    'Discuss soldering and desoldering.',
    'Discuss the different types of power supplies.',
    'Perform variable regulated power supply assembly.',
  ],
  outcomes: [
    {
      id: 'lo1',
      title: 'Discuss the procedures for PCB designing',
      lessons: [{
        id: 'l1',
        title: 'From schematic to copper',
        blocks: [
          { kind: 'text', md: 'A printed circuit board turns a schematic into physical copper. The schematic says what connects to what. The layout says where each part sits and which path the copper takes between them. Those are two different problems, and confusing them is why a first board often works on paper and not on the bench.' },
          { kind: 'text', md: 'Design software such as KiCad or Fritzing keeps the two in step. You draw the schematic, assign a footprint to every component so the software knows its real size and pin spacing, then place and route on the board layer. The software checks that every connection in the schematic exists in copper.' },
          { kind: 'table',
            headers: ['Stage', 'What you decide', 'What goes wrong if you rush'],
            rows: [
              ['Schematic', 'What connects to what', 'A missing net that no amount of routing will fix'],
              ['Footprints', 'Real pad size and pin spacing', 'A part that will not physically fit its holes'],
              ['Placement', 'Where each part sits', 'Tracks that cannot reach without crossing'],
              ['Routing', 'The copper path between pads', 'Tracks too thin for the current they carry'],
              ['Transfer', 'Getting the artwork onto copper', 'Broken or bridged tracks before you even etch'],
            ] },
          { kind: 'text', md: 'Transfer is the step where a good design becomes a bad board. In toner transfer you print the layout mirrored onto glossy paper, iron it onto cleaned copper, and soak the paper away. In UV exposure you print onto transparent film and expose a photoresist-coated board through it. Both depend on the copper being clean: a fingerprint is enough to lift a track.' },
          { kind: 'steps', items: [
            'Print the layout at exactly 100 percent scale, mirrored for toner transfer.',
            'Clean the copper with fine abrasive and then with alcohol, and do not touch it again.',
            'Transfer the artwork by heat or by UV exposure, following the time your materials call for.',
            'Inspect every track under good light and repair breaks with a resist pen.',
            'Etch, then rinse thoroughly and remove the resist.',
            'Drill the holes, checking the bit against the largest lead you must fit.',
          ] },
          { kind: 'note', md: 'Track width carries current. A track that is fine for a signal will overheat on a power rail. Widen the tracks between the transformer, rectifier and filter capacitor before you route anything else.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm2-lo1-q1', competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
          stem: 'Your design software reports that a net in the schematic has no matching copper track. What does that mean?',
          options: [
            'The board is finished and the message can be ignored',
            'Two pads that the schematic says are connected have no copper path between them',
            'A track is too thin for its current',
            'A footprint is the wrong physical size',
          ],
          answer: 1,
          rationale: [
            'An unrouted net is a real gap. The board will not work as drawn.',
            'Correct. The schematic and the copper disagree, and the copper is what gets built.',
            'Track width is a separate check, usually reported as a design rule violation.',
            'A wrong footprint is a footprint error, not an unrouted net.',
          ] },
        { kind: 'mcq', id: 'm2-lo1-q2', competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
          stem: 'Why is the layout printed mirrored for toner transfer?',
          options: [
            'To save toner',
            'Because the printed side is pressed face down onto the copper',
            'Because the etchant works from the back',
            'To make the tracks thinner',
          ],
          answer: 1,
          rationale: [
            'Mirroring uses exactly the same amount of toner.',
            'Correct. The artwork is flipped when it is pressed onto the board, so it must be printed reversed to come out the right way round.',
            'Etchant removes exposed copper from the front. It has no direction.',
            'Mirroring does not change track width.',
          ] },
        { kind: 'order', id: 'm2-lo1-q3', competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
          stem: 'Arrange the board fabrication steps in the correct order.',
          steps: [
            'Print the layout at full scale',
            'Clean the copper surface',
            'Transfer the artwork onto the copper',
            'Inspect and repair broken tracks',
            'Etch away the exposed copper',
            'Drill the component holes',
          ] },
      ],
    },
    {
      id: 'lo2',
      title: 'Discuss soldering and desoldering',
      lessons: [{
        id: 'l1',
        title: 'Heat the joint, not the solder',
        blocks: [
          { kind: 'safety', md: 'A soldering iron tip runs between 300 and 400 degrees Celsius and gives no visual warning. Rest it in its stand every single time you put it down, work in ventilated air, and never flick molten solder off the tip.' },
          { kind: 'text', md: 'A good joint is made by heating the pad and the lead together and letting them melt the solder. If you melt solder on the tip and drop it onto a cold pad, it sits on top as a grey ball and conducts badly or not at all. That is a cold joint, and it is the single most common fault in student work.' },
          { kind: 'steps', items: [
            'Tin the tip with a little fresh solder and wipe it on a damp sponge or brass wool.',
            'Press the tip so it touches both the pad and the component lead at once.',
            'Count about two seconds, then feed solder into the joint, not onto the tip.',
            'Remove the solder first, then the iron, and let the joint cool without moving it.',
            'Look at the result: a good joint is shiny and slopes smoothly from pad to lead.',
          ] },
          { kind: 'table',
            headers: ['What you see', 'What it means', 'What to do'],
            rows: [
              ['Shiny, concave, wets the pad', 'A sound joint', 'Nothing'],
              ['Dull grey ball sitting on the pad', 'Cold joint, the pad was never hot enough', 'Reheat with the iron on the pad and lead together'],
              ['Solder bridging two adjacent pads', 'Too much solder, or the tip dragged', 'Remove with braid, then re-solder one pad'],
              ['Pad lifted from the board', 'Too much heat for too long', 'Repair with a wire link to the next point on the net'],
              ['Cracked ring around the lead', 'The joint moved while cooling', 'Reheat and let it cool untouched'],
            ] },
          { kind: 'text', md: 'Desoldering runs the same rules backwards. Heat the joint until the solder is fully liquid, then remove it in one action with a pump or with braid. Braid works by capillary action, so it must be pressed flat against the molten joint by the tip. Repeated half-hearted attempts cook the pad and lift it.' },
          { kind: 'note', md: 'Flux is not optional. It cleans the oxide off the metal at soldering temperature so the solder can wet it. Most solder wire has flux in its core, but an old joint you are reworking usually needs more.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm2-lo2-q1', competency: 'Discuss soldering and desoldering.',
          stem: 'A joint is a dull grey ball sitting on top of the pad. What happened?',
          options: [
            'Too much flux was used',
            'The solder was melted on the iron and dropped onto a cold pad',
            'The iron was too hot',
            'The lead was too thin for the hole',
          ],
          answer: 1,
          rationale: [
            'Excess flux leaves a sticky residue, not a grey ball.',
            'Correct. That is a cold joint. The pad never reached soldering temperature, so the solder never wet it.',
            'An over-hot iron tends to lift pads or burn flux, and the joint still wets.',
            'A loose lead makes a mechanically weak joint, but the solder still flows onto a hot pad.',
          ] },
        { kind: 'truefalse', id: 'm2-lo2-q2', competency: 'Discuss soldering and desoldering.',
          stem: 'When desoldering with braid, the braid should be pressed flat against the joint by the iron tip.',
          answer: true,
          rationale: 'Braid lifts solder by capillary action, which only works when the braid, the molten solder and the heat are all in contact at once. Holding the braid above the joint just wastes it.' },
        { kind: 'order', id: 'm2-lo2-q3', competency: 'Discuss soldering and desoldering.',
          stem: 'Arrange the steps for making a sound solder joint.',
          steps: [
            'Tin and wipe the iron tip',
            'Touch the tip to the pad and the lead together',
            'Feed solder into the joint',
            'Remove the solder, then the iron',
            'Let the joint cool without moving it',
          ] },
      ],
    },
    {
      id: 'lo3',
      title: 'Discuss the different types of power supplies',
      lessons: [{
        id: 'l1',
        title: 'What each kind of supply is for',
        blocks: [
          { kind: 'text', md: 'Every supply does the same job: take the power that is available and deliver the power a circuit needs. They differ in how they do it, and each way of doing it costs something.' },
          { kind: 'table',
            headers: ['Type', 'How it works', 'Strength', 'Cost'],
            rows: [
              ['Unregulated linear', 'Transformer, rectifier, filter capacitor', 'Simple, cheap, quiet', 'Output sags as the load rises'],
              ['Regulated linear', 'Adds a regulator after the filter', 'Steady output, very low noise', 'Wastes the surplus as heat'],
              ['Switching', 'Chops the input at high frequency', 'Small, light, efficient', 'Electrical noise, more parts to fail'],
              ['Battery', 'Stored chemical energy', 'Portable, no mains hazard', 'Voltage falls as it discharges'],
            ] },
          { kind: 'text', md: 'A linear regulator holds its output steady by dropping whatever is left over across itself. That surplus becomes heat, which is why a 12 volt regulator fed from 20 volts at half an amp needs a heatsink. A switching supply avoids that waste by chopping and only delivering the energy needed, but the chopping puts noise on the output that sensitive audio and radio circuits will pick up.' },
          { kind: 'note', md: 'The reason a regulated supply matters for servicing is that it lets you feed a repaired board a known, clean voltage. A sagging or noisy bench supply will make a working board look faulty.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm2-lo3-q1', competency: 'Discuss the different types of power supplies.',
          stem: 'Why does a linear regulator need a heatsink when the input voltage is much higher than the output?',
          options: [
            'Because it switches at high frequency',
            'Because it dissipates the surplus voltage as heat',
            'Because the filter capacitor warms it',
            'Because the transformer conducts heat into it',
          ],
          answer: 1,
          rationale: [
            'Switching is what a switching supply does. A linear regulator does not switch.',
            'Correct. The regulator drops the difference between input and output, and that dropped voltage times the current is heat it must shed.',
            'The capacitor stores charge. It is not the heat source here.',
            'Transformer heat is a separate and much smaller effect.',
          ] },
        { kind: 'mcq', id: 'm2-lo3-q2', competency: 'Discuss the different types of power supplies.',
          stem: 'Which supply would you avoid for a sensitive audio preamplifier, and why?',
          options: [
            'Regulated linear, because it wastes power',
            'Switching, because its chopping puts noise on the output',
            'Battery, because it is portable',
            'Unregulated linear, because it uses a transformer',
          ],
          answer: 1,
          rationale: [
            'Wasted power is an efficiency problem, not an audio problem.',
            'Correct. The high frequency switching couples noise onto the rail, and an audio stage will amplify it.',
            'Batteries are among the quietest supplies available.',
            'A transformer is not itself a noise source of concern here.',
          ] },
        { kind: 'truefalse', id: 'm2-lo3-q3', competency: 'Discuss the different types of power supplies.',
          stem: 'An unregulated linear supply holds its output voltage steady as the load current increases.',
          answer: false,
          rationale: 'It does not. With no regulator, the output falls as the load draws more current and the filter capacitor discharges further between peaks. Holding the voltage steady is exactly what the regulator adds.' },
      ],
    },
    {
      id: 'lo4',
      title: 'Perform variable regulated power supply assembly',
      lessons: [{
        id: 'l1',
        title: 'Building a supply that holds its voltage',
        blocks: [
          { kind: 'safety', md: 'The transformer primary side carries mains voltage. Wire and insulate the primary completely before the board goes anywhere near an outlet, and never work on the primary side with the unit plugged in.' },
          { kind: 'text', md: 'A regulated supply is four stages in a line. The transformer steps the mains down. The rectifier turns alternating current into one-directional pulses. The filter capacitor fills the gaps between those pulses. The regulator shaves whatever is left down to a flat, exact voltage.' },
          { kind: 'text', md: 'The stage that students get wrong is the filter. A capacitor that is too small lets the voltage fall a long way between pulses, and if it falls to within about two volts of the target the regulator runs out of headroom and the output sags with it. The simulator below lets you see that happen and fix it.' },
          { kind: 'interactive', simId: 'psu', config: { preset: 'assembly' } },
          { kind: 'steps', items: [
            'Lay the components out on the board in the order the signal flows through them.',
            'Mount and solder the transformer and the rectifier first, keeping the power tracks short.',
            'Fit the filter capacitor, observing polarity. The negative stripe goes to the negative rail.',
            'Fit the regulator on its heatsink, checking the pinout against its datasheet.',
            'Inspect every joint before applying power for the first time.',
            'Power up with no load and confirm the output voltage, then repeat under load.',
          ] },
          { kind: 'note', md: 'An electrolytic filter capacitor fitted backwards will heat, vent and sometimes burst. Check the stripe twice. It is the one polarity mistake in this build that is both easy to make and loud.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm2-lo4-q1', competency: 'Perform variable regulated power supply assembly.',
          stem: 'Your 12 volt regulated output is steady with no load but drops to 10.5 volts and hums under a 500 mA load. What is the most likely cause?',
          options: [
            'The regulator is faulty and must be replaced',
            'The filter capacitor is too small for the load, so the ripple trough falls below the regulator dropout',
            'The transformer secondary voltage is too high',
            'The rectifier diodes are fitted backwards',
          ],
          answer: 1,
          rationale: [
            'A faulty regulator usually fails to a fixed wrong value or to nothing, not to a load-dependent hum.',
            'Correct. Under load the capacitor discharges further between peaks, and once the trough is within about two volts of 12 the regulator cannot hold.',
            'Too high a secondary makes the regulator run hot, but the output would still hold at 12.',
            'Reversed diodes would give no useful output at all, loaded or not.',
          ] },
        { kind: 'mcq', id: 'm2-lo4-q2', competency: 'Perform variable regulated power supply assembly.',
          stem: 'A full wave bridge rectifier charges the filter capacitor twice per mains cycle rather than once. What does that buy you?',
          options: [
            'A higher peak voltage',
            'Less ripple for the same capacitor and load',
            'Fewer components',
            'A lower transformer temperature',
          ],
          answer: 1,
          rationale: [
            'The peak is actually slightly lower, because the current passes through two diodes instead of one.',
            'Correct. The capacitor is topped up twice as often, so it has half as long to droop between peaks.',
            'A bridge uses four diodes rather than one, so it is more components, not fewer.',
            'Transformer temperature is set by the load, not by the rectifier arrangement.',
          ] },
        { kind: 'order', id: 'm2-lo4-q3', competency: 'Perform variable regulated power supply assembly.',
          stem: 'Arrange the assembly steps for a regulated DC supply.',
          steps: [
            'Plan the component layout following the signal path',
            'Mount and solder the transformer and rectifier',
            'Fit the filter capacitor, observing polarity',
            'Fit the regulator on its heatsink',
            'Inspect every joint before applying power',
            'Test the output with no load, then under load',
          ] },
      ],
    },
  ],
}
```

- [ ] **Step 2: Register it**

In `src/content/index.ts`, import `m2` and change the array to `export const MODULES: Module[] = [m1, m2]`.

- [ ] **Step 3: Verify the curriculum strings survived**

Run each and report the real number:
```bash
grep -c "Discuss the procedures for PCB designing" src/content/m2.ts
grep -c "Discuss soldering and desoldering." src/content/m2.ts
grep -c "Discuss the different types of power supplies." src/content/m2.ts
grep -c "Perform variable regulated power supply assembly." src/content/m2.ts
grep -c "—" src/content/m2.ts
```
Each of the first four must be at least 1. The last must be 0.

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 63 passing

- [ ] **Step 4: Commit**

```bash
git add src/content/m2.ts src/content/index.ts
git commit -m "content: add Module 2, PCB, soldering and power supplies"
```

---

### Task 7: Module 3 content

**Files:**
- Create: `src/content/m3.ts`
- Modify: `src/content/index.ts`

**Interfaces:**
- Consumes: `Module` from `src/lib/types`
- Produces: `m3: Module`, registered in `MODULES`

Two outcomes. The second embeds the System Troubleshooter with the electric fan scenario.

- [ ] **Step 1: Write src/content/m3.ts**

```ts
import type { Module } from '../lib/types'

export const m3: Module = {
  id: 'm3',
  week: 'Week 3',
  title: 'Appliances with Electric Motors',
  tint: 'm3',
  teacherReviewed: false,
  competencies: [
    'Discuss the procedures in servicing appliances with electric motors.',
    'Apply procedures in servicing appliances with electric motors.',
  ],
  outcomes: [
    {
      id: 'lo1',
      title: 'Discuss the procedures in servicing appliances with electric motors',
      lessons: [{
        id: 'l1',
        title: 'What is inside a small appliance motor',
        blocks: [
          { kind: 'safety', md: 'Unplug the appliance before opening it, every time, with no exception for a quick look. A fan or blender that appears dead can still hold charge in its run capacitor, and a motor that starts unexpectedly while your hand is near the blades causes serious injury.' },
          { kind: 'text', md: 'Most household appliances use one of two motor types. A shaded pole motor, found in fans and small blowers, is cheap, quiet and has no brushes to wear out. A universal motor, found in blenders and drills, is more powerful for its size and uses carbon brushes that press against a rotating commutator. Brushes wear out, so a universal motor is a serviceable motor.' },
          { kind: 'table',
            headers: ['Part', 'What it does', 'How it usually fails'],
            rows: [
              ['Stator winding', 'Creates the rotating magnetic field', 'Opens from overheating, or shorts turn to turn'],
              ['Rotor', 'Turns inside the field and drives the shaft', 'Rarely fails, but the shaft can seize'],
              ['Bearings or bushes', 'Let the shaft turn freely', 'Dry out, then run hot and noisy'],
              ['Run capacitor', 'Shifts the phase so the motor starts and runs', 'Loses capacitance, so the motor hums but will not start'],
              ['Thermal fuse', 'Cuts power if the winding overheats', 'Opens permanently once it has done its job'],
              ['Carbon brushes', 'Carry current to the spinning commutator', 'Wear down until they no longer touch'],
            ] },
          { kind: 'text', md: 'The thermal fuse is worth understanding properly, because it is the part most often blamed and most often misunderstood. It is a one-shot device buried in the windings. When the winding gets too hot it opens and never closes again. An open thermal fuse is usually a symptom rather than the disease: something made the motor run hot, and if you fit a new fuse without finding out what, the new one will open too.' },
          { kind: 'note', md: 'Never bridge a thermal fuse to get an appliance working. It is the only thing standing between an overheating winding and a fire, and bridging it moves the failure from an inconvenience to a house fire.' },
          { kind: 'steps', items: [
            'Unplug the appliance and let any capacitor discharge.',
            'Open the housing and photograph the wiring before disturbing it.',
            'Turn the shaft by hand and feel for roughness, tightness or play.',
            'Inspect for burnt smell, discoloured windings and dried out bearings.',
            'Test electrically from the plug inward: cord, switch, thermal fuse, capacitor, winding.',
            'Clean, lubricate and reassemble, then run the appliance and watch it under load.',
          ] },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm3-lo1-q1', competency: 'Discuss the procedures in servicing appliances with electric motors.',
          stem: 'An electric fan hums but the blades do not turn, and they spin freely by hand. What is the most likely cause?',
          options: [
            'An open thermal fuse',
            'A failed run capacitor',
            'A broken supply cord',
            'Worn carbon brushes',
          ],
          answer: 1,
          rationale: [
            'An open thermal fuse cuts the circuit completely, so there would be no hum at all.',
            'Correct. The hum means current is reaching the winding, but without the capacitor there is no phase shift to start rotation.',
            'A broken cord would give no hum, because no current would reach the motor.',
            'A shaded pole fan motor has no brushes.',
          ] },
        { kind: 'truefalse', id: 'm3-lo1-q2', competency: 'Discuss the procedures in servicing appliances with electric motors.',
          stem: 'If a thermal fuse has opened, fitting a new one is a complete repair.',
          answer: false,
          rationale: 'It is not. The fuse opened because something made the winding overheat: a dry bearing, a blocked airflow, or a failing capacitor. Fit a new fuse without finding that cause and the new fuse will open too.' },
        { kind: 'order', id: 'm3-lo1-q3', competency: 'Discuss the procedures in servicing appliances with electric motors.',
          stem: 'Arrange the steps for servicing a motor-driven appliance.',
          steps: [
            'Unplug the appliance and let any capacitor discharge',
            'Open the housing and photograph the wiring',
            'Turn the shaft by hand and feel for roughness',
            'Inspect for burnt smell and discoloured windings',
            'Test electrically from the plug inward',
            'Clean, lubricate, reassemble and run under load',
          ] },
      ],
    },
    {
      id: 'lo2',
      title: 'Apply procedures in servicing appliances with electric motors',
      lessons: [{
        id: 'l1',
        title: 'Working from the plug inward',
        blocks: [
          { kind: 'text', md: 'Testing in a fixed order matters more than testing cleverly. Start at the plug and work toward the motor, and each test you pass rules out everything behind it. Jumping straight to the winding tells you nothing useful if the cord is broken, because you would find a healthy winding on an appliance that still does not work.' },
          { kind: 'text', md: 'For a dead unit that you have unplugged and isolated, almost every test is a continuity or resistance test. You are asking one question over and over: is there an unbroken path here? Only when you find the place where the path stops have you found the fault.' },
          { kind: 'interactive', simId: 'troubleshoot', config: { scenario: 'fan' } },
          { kind: 'table',
            headers: ['Test point', 'A healthy reading', 'What a bad reading means'],
            rows: [
              ['Plug pins, switch on', 'Under an ohm, meter beeps', 'Open cord, or the switch is not making'],
              ['Switch contacts, each speed', 'Beeps on every speed', 'Worn or dirty contacts'],
              ['Thermal fuse', 'Under an ohm, meter beeps', 'Fuse has opened, and something made it open'],
              ['Run capacitor', 'Close to its marked value', 'Lost capacitance, motor will hum but not start'],
              ['Main winding', 'Tens to hundreds of ohms', 'Open winding, usually the end of the motor'],
            ] },
          { kind: 'safety', md: 'Discharge the run capacitor through a resistor before you put a meter or a finger on its terminals. A capacitor in a fan can hold enough charge to hurt you long after the fan is unplugged, and shorting it with a screwdriver damages both the capacitor and the screwdriver.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm3-lo2-q1', competency: 'Apply procedures in servicing appliances with electric motors.',
          stem: 'Why test from the plug inward rather than starting at the motor winding?',
          options: [
            'The winding is harder to reach',
            'Each test you pass rules out everything behind it',
            'The winding test needs mains power',
            'It is the order the manufacturer prints in the manual',
          ],
          answer: 1,
          rationale: [
            'Access is a convenience, not the reason for the order.',
            'Correct. Working outward in means every healthy reading narrows the search, and you never mistake a healthy winding for a working appliance.',
            'A winding test is a resistance test on an isolated unit. It needs no mains power.',
            'Manuals vary. The reasoning holds whether or not one is available.',
          ] },
        { kind: 'mcq', id: 'm3-lo2-q2', competency: 'Apply procedures in servicing appliances with electric motors.',
          stem: 'Your meter reads OL across the thermal fuse of a dead fan. What is the correct conclusion?',
          options: [
            'The fuse is fine, since OL means no resistance',
            'The fuse has opened, and you should also find out what made it overheat',
            'The winding is open',
            'The capacitor has failed',
          ],
          answer: 1,
          rationale: [
            'OL means an open circuit, the opposite of no resistance. A healthy fuse reads close to zero ohms.',
            'Correct. The fuse has done its job, and the job implies the winding got too hot for a reason you have not found yet.',
            'The winding is tested separately, and this reading says nothing about it.',
            'A failed capacitor gives a hum, not a completely dead unit.',
          ] },
        { kind: 'truefalse', id: 'm3-lo2-q3', competency: 'Apply procedures in servicing appliances with electric motors.',
          stem: 'A run capacitor should be discharged before you measure it.',
          answer: true,
          rationale: 'Yes. A charged capacitor can injure you and can damage a meter set to measure capacitance. Discharge it through a resistor, never by shorting it with a screwdriver.' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Register it**

In `src/content/index.ts`, import `m3` and change the array to `export const MODULES: Module[] = [m1, m2, m3]`.

- [ ] **Step 3: Verify**

```bash
grep -c "Discuss the procedures in servicing appliances with electric motors." src/content/m3.ts
grep -c "Apply procedures in servicing appliances with electric motors." src/content/m3.ts
grep -c "—" src/content/m3.ts
```
First two at least 1, last must be 0.

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 63 passing

- [ ] **Step 4: Walk the whole thing in a browser**

Run `npm run dev` and confirm each of these, reporting what you actually saw:
- The module map shows three tiles, in three different tints, each at 0 percent
- `/#/m/m2/lo/lo4` renders the Power Supply Simulator
- Selecting half wave with a 100 uF capacitor and pressing Test the output fails, and the message points at the Filter stage
- The Filter stage visibly dips further than the Output stage can tolerate
- Selecting full wave with 4700 uF and testing succeeds, and the success line reports the number of configurations
- `/#/m/m3/lo/lo2` renders the Troubleshooter with the test buttons disabled until all three safety boxes are ticked
- Testing the thermal fuse reads OL, and naming the thermal fuse scores correct
- Reloading keeps all progress

- [ ] **Step 5: Commit**

```bash
git add src/content/m3.ts src/content/index.ts
git commit -m "content: add Module 3, appliances with electric motors"
```

---

## Self-Review

**Spec coverage for this plan.** `lib/signal` and the Power Supply Assembly Simulator, Tasks 2 and 3. `lib/diagnose` and the System Troubleshooter, Tasks 4 and 5. The scenario-as-data architecture that lets Plan 3 add seven more appliances without touching a component, Task 5. Modules 2 and 3 with competencies quoted verbatim, Tasks 6 and 7. The sim registry that stops `BlockRenderer` growing a branch per simulation, Task 1. The Plan 1 carry-forward item about `onEvent` is resolved by decision, recorded at the top of this plan, and both new simulations follow the evidence convention it settles on.

Deliberately out of this plan and carried to Plan 3: the Match, Hotspot and Sequence engines, Modules 4 through 9, the remaining seven troubleshooter scenarios, and every item in `CARRY-FORWARD.md` not named above.

**Placeholder scan.** No TBDs. Every code step carries runnable code. Task 5 contains one deliberate correction instruction, the hardcoded fault name in the incorrect-answer branch, which must be replaced with the lookup given there rather than shipped as written.

**Type consistency.** `PsuConfig`, `PsuStage`, `RectifierKind` and `Waveform` are defined once in Task 2 and imported unchanged in Task 3. `Scenario`, `Fault` and `TestPoint` are defined once in Task 4 and imported unchanged in Task 5. `InteractiveProps` and `SimEvent` are the existing Plan 1 exports and are not redeclared. `recordSim` is called with the existing `SimRecord` shape in both new simulations, with `score` as the documented 0 to 1 fraction. `Module`, `Block` and `QuizItem` are the existing Plan 1 exports; Tasks 6 and 7 use only the `mcq`, `truefalse` and `order` quiz kinds and the `text`, `table`, `steps`, `safety`, `note` and `interactive` block kinds, all of which already exist.

**Test counts.** Plan 1 ended at 30. Task 1 adds 4 (34), Task 2 adds 15 (49), Task 4 adds 14 (63). Tasks 3, 5, 6 and 7 add no unit tests, by design: they are UI and data, which the spec excludes from unit testing, and Task 7 closes with a manual walkthrough instead.
