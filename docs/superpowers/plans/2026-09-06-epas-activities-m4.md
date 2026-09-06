# EPAS Light Interactives and Module 4: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The two light-interactive formats the Budget of Work keeps asking for, identification and labelling, plus Module 4 in full. A student labels the parts of a flat iron on a diagram, sorts lighting components by function, and diagnoses a dead flat iron and a rechargeable lamp that will not charge.

**Architecture:** One pure scorer serves both new activity formats, beside the existing `measure`, `signal` and `diagnose` engines. Activities are typed data files looked up by id, exactly as troubleshooter scenarios already are, so the component never parses untyped config. Two SVG presentation components mount through the existing sim registry.

**Tech Stack:** Existing only. Vite, React, TypeScript, React Router (hash), Vitest, SVG. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`
**Visual authority:** `docs/DESIGN.md`
**Deferred items:** `docs/superpowers/plans/CARRY-FORWARD.md`
**Reference implementations:** `src/lib/diagnose.ts` for engine shape, `src/content/scenarios/fan.ts` for data-file shape, `src/interactives/SystemTroubleshooter.tsx` for component shape. Read them before starting.

## Global Constraints

- **No new dependencies.** None, for any reason.
- **No CDN, no external runtime asset.** The app must work with the network off.
- **SVG only,** authored as typed shape data. **No `dangerouslySetInnerHTML` anywhere.**
- **No drag and drop.** Students use cheap Android phones and some use assistive technology. Matching uses native `<select>`; hotspots are real `<button>` elements. Both are keyboard operable and both work with a screen reader.
- **Engines are pure and total.** No randomness, no clock, no module state, and they never throw.
- **`--danger` is reserved for electrical safety.** A wrong answer uses `var(--caution)`, never red.
- Accent button text uses `var(--on-accent)`, never a literal.
- **Instrument literals** are authorised only inside a panel carrying `className="instrument"`. The two new components are not instruments and use tokens only.
- **Radius:** cards and tiles 14px, controls 10px, pills full. Decorative sub-elements may go smaller.
- **Motion:** only `transform` and `opacity`, only the existing `.tile` press. No new transitions, no celebration on success.
- **Touch targets 44px minimum** on every interactive element, including every hotspot button.
- **No em dashes, no emoji** in any user-visible string.
- **Only `src/lib/store.ts` touches localStorage.**
- **`SimRecord.score` is a fraction from 0 to 1.** Both new components must honour that.
- **`config` is spread FIRST into `evidence`,** so measured fields cannot be overwritten by a content file. House rule, established in Plan 2.
- **Every simulation records a row whether the student succeeded or not,** so a missing row means "never attempted". Established in Plan 2; see the recording-policy note in `CARRY-FORWARD.md`.
- **New modules ship `teacherReviewed: false`.**
- **Competency strings are quoted verbatim** from `docs/reference/G12-TechPro-EPAS-budget-of-work.txt`. **The source is internally inconsistent and those inconsistencies must be preserved.** In Module 4 specifically: competency 2 reads "Apply procedure" singular, where Module 3 read "Apply procedures" plural; and competency 4 reads "electronic controlled" unhyphenated, where competency 3 reads "electronic-controlled" hyphenated. Both are correct as written.
- Compiles under `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`.

## Carried forward, and how this plan handles it

`CARRY-FORWARD.md` records three scenario-authoring hazards from Plan 2. Task 5 must honour all three:

1. **Every non-implicating test point needs a `'*'` reading.** A missing one renders a blank reading instead of failing, and neither TypeScript nor the engine can catch it.
2. **Safety lines within a scenario must be distinct strings.** `acked` is keyed by the text, so duplicates collide and break the gate count.
3. **Fault labels are lower-cased mid-sentence** by the troubleshooter's incorrect-answer message, so avoid labels whose meaning depends on capitals.

---

## File Structure

```
src/
  lib/
    activity.ts          shared scorer and activity types, pure
  content/
    activities/
      index.ts           id -> Activity registry
      flat-iron-parts.ts hotspot: label the parts of a flat iron
      lighting-parts.ts  match: sort lighting components by function
    scenarios/
      flat-iron.ts       fault scenario: iron does not heat
      lamp.ts            fault scenario: rechargeable lamp will not charge
      index.ts           MODIFY: register both
    m4.ts                Module 4
    index.ts             MODIFY: register m4
  interactives/
    MatchActivity.tsx
    HotspotActivity.tsx
    registry.ts          MODIFY: two entries
tests/
  activity.test.ts
```

---

### Task 1: The activity scorer

**Files:**
- Create: `src/lib/activity.ts`
- Test: `tests/activity.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface ActivityItem { id: string; prompt: string; answer: string }`
  - `interface Choice { id: string; label: string }`
  - `interface Shape` union and `interface Region`
  - `interface MatchActivity`, `interface HotspotActivity`, `type Activity`
  - `interface ActivityResult { correct: number; total: number; wrong: string[] }`
  - `scoreActivity(items: ActivityItem[], responses: Record<string, string>): ActivityResult`

One scorer serves both formats, because both are "N prompts, each with exactly one correct answer". `wrong` carries the item ids so a component can show which ones to revisit and the export can see which concepts a cohort missed.

- [ ] **Step 1: Write the failing test**

```ts
// tests/activity.test.ts
import { scoreActivity } from '../src/lib/activity'
import type { ActivityItem } from '../src/lib/activity'

const items: ActivityItem[] = [
  { id: 'a', prompt: 'Which part heats the plate?', answer: 'element' },
  { id: 'b', prompt: 'Which part limits the temperature?', answer: 'thermostat' },
  { id: 'c', prompt: 'Which part cuts power permanently on overheat?', answer: 'fuse' },
]

describe('scoreActivity', () => {
  it('scores a fully correct set', () => {
    const r = scoreActivity(items, { a: 'element', b: 'thermostat', c: 'fuse' })
    expect(r.correct).toBe(3)
    expect(r.total).toBe(3)
    expect(r.wrong).toEqual([])
  })

  it('names the items answered wrongly', () => {
    const r = scoreActivity(items, { a: 'element', b: 'fuse', c: 'thermostat' })
    expect(r.correct).toBe(1)
    expect(r.wrong).toEqual(['b', 'c'])
  })

  it('counts an unanswered item as wrong rather than skipping it', () => {
    const r = scoreActivity(items, { a: 'element' })
    expect(r.correct).toBe(1)
    expect(r.total).toBe(3)
    expect(r.wrong).toEqual(['b', 'c'])
  })

  it('ignores responses for items that do not exist', () => {
    const r = scoreActivity(items, { a: 'element', b: 'thermostat', c: 'fuse', zzz: 'x' })
    expect(r.correct).toBe(3)
    expect(r.total).toBe(3)
  })

  it('handles an empty item list without dividing by anything', () => {
    const r = scoreActivity([], {})
    expect(r).toEqual({ correct: 0, total: 0, wrong: [] })
  })

  it('does not throw on a malformed response value', () => {
    const bad = { a: undefined as unknown as string, b: '', c: 'fuse' }
    expect(() => scoreActivity(items, bad)).not.toThrow()
    expect(scoreActivity(items, bad).correct).toBe(1)
  })

  it('is order independent for the same answers', () => {
    const one = scoreActivity(items, { a: 'element', b: 'thermostat', c: 'fuse' })
    const two = scoreActivity(items, { c: 'fuse', b: 'thermostat', a: 'element' })
    expect(one).toEqual(two)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/activity.test.ts`
Expected: FAIL, cannot resolve `../src/lib/activity`.

- [ ] **Step 3: Write src/lib/activity.ts**

```ts
export interface ActivityItem {
  id: string
  /** What the student is asked. */
  prompt: string
  /** The id of the correct choice or region. */
  answer: string
}

export interface Choice {
  id: string
  label: string
}

/**
 * A diagram is authored as typed shapes rather than raw SVG markup, so no
 * component ever needs dangerouslySetInnerHTML and a teacher can read and
 * edit the drawing.
 */
export type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string }
  | { kind: 'text'; x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }

export interface Region {
  id: string
  label: string
  /** Position as a percentage of the diagram box, so overlay buttons align at any width. */
  xPct: number
  yPct: number
}

export interface MatchActivity {
  kind: 'match'
  id: string
  instruction: string
  choices: Choice[]
  items: ActivityItem[]
}

export interface HotspotActivity {
  kind: 'hotspot'
  id: string
  instruction: string
  /** Width and height of the drawing space, used as the SVG viewBox. */
  box: { w: number; h: number }
  shapes: Shape[]
  regions: Region[]
  items: ActivityItem[]
}

export type Activity = MatchActivity | HotspotActivity

export interface ActivityResult {
  correct: number
  total: number
  /** Ids of the items answered wrongly or left blank, in item order. */
  wrong: string[]
}

export function scoreActivity(
  items: ActivityItem[],
  responses: Record<string, string>,
): ActivityResult {
  const wrong: string[] = []
  let correct = 0
  for (const item of items) {
    if (responses[item.id] === item.answer) correct++
    else wrong.push(item.id)
  }
  return { correct, total: items.length, wrong }
}
```

- [ ] **Step 4: Run to verify all pass**

Run: `npx vitest run tests/activity.test.ts`
Expected: 7 passing.
Run: `npm test`
Expected: 70 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/activity.ts tests/activity.test.ts
git commit -m "feat: add shared activity scorer for identification formats"
```

---

### Task 2: The two Module 4 activities as data

**Files:**
- Create: `src/content/activities/flat-iron-parts.ts`, `src/content/activities/lighting-parts.ts`, `src/content/activities/index.ts`

**Interfaces:**
- Consumes: `MatchActivity`, `HotspotActivity`, `Activity` from `src/lib/activity`
- Produces: `flatIronParts`, `lightingParts`, and `ACTIVITIES: Record<string, Activity>`

Both come from the Budget of Work's own Suggested Activities: "Heating Element Analysis Lab: examine appliances like irons, toasters and water heaters to identify heating elements and safety features", and "Component Identification and Safety Review: examine LED lamps, rechargeable torches and other electronic-controlled lighting units to identify batteries, circuits and controllers".

- [ ] **Step 1: Write src/content/activities/flat-iron-parts.ts**

The diagram is a side-on cross section. Coordinates are in a 400 by 200 box; region positions are percentages of it.

```ts
import type { HotspotActivity } from '../../lib/activity'

export const flatIronParts: HotspotActivity = {
  kind: 'hotspot',
  id: 'flat-iron-parts',
  instruction: 'A flat iron, seen from the side with the cover removed. Answer each question by clicking the part on the diagram.',
  box: { w: 400, h: 200 },
  shapes: [
    { kind: 'rect', x: 110, y: 22, w: 180, h: 20, r: 10, fill: 'var(--m4)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 122, y: 42, w: 18, h: 44, fill: 'var(--m4)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 262, y: 42, w: 18, h: 44, fill: 'var(--m4)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 78, y: 86, w: 252, h: 56, r: 6, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 58, y: 144, w: 292, h: 24, r: 4, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'line', x1: 78, y1: 156, x2: 330, y2: 156, width: 4 },
    { kind: 'rect', x: 232, y: 98, w: 40, h: 28, r: 4, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'circle', cx: 150, cy: 112, r: 13, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'line', x1: 78, y1: 100, x2: 26, y2: 86, width: 5 },
    { kind: 'text', x: 200, y: 190, text: 'Side view, cover removed', anchor: 'middle' },
  ],
  regions: [
    { id: 'element', label: 'Heating element', xPct: 50, yPct: 78 },
    { id: 'thermostat', label: 'Thermostat', xPct: 63, yPct: 56 },
    { id: 'fuse', label: 'Thermal fuse', xPct: 37, yPct: 56 },
    { id: 'cord', label: 'Cord entry', xPct: 13, yPct: 47 },
  ],
  items: [
    { id: 'q1', prompt: 'Which part turns electricity into the heat that reaches the plate?', answer: 'element' },
    { id: 'q2', prompt: 'Which part switches the heat on and off to hold the setting you chose?', answer: 'thermostat' },
    { id: 'q3', prompt: 'Which part cuts the power permanently if the iron overheats, and never closes again?', answer: 'fuse' },
    { id: 'q4', prompt: 'Where does flexing wear break the supply most often on an iron?', answer: 'cord' },
  ],
}
```

- [ ] **Step 2: Write src/content/activities/lighting-parts.ts**

```ts
import type { MatchActivity } from '../../lib/activity'

export const lightingParts: MatchActivity = {
  kind: 'match',
  id: 'lighting-parts',
  instruction: 'A rechargeable LED lamp contains these parts. Match each description to the part it names.',
  choices: [
    { id: 'cell', label: 'Rechargeable cell' },
    { id: 'charger', label: 'Charging circuit' },
    { id: 'driver', label: 'LED driver' },
    { id: 'led', label: 'LED array' },
    { id: 'switch', label: 'Control switch' },
  ],
  items: [
    { id: 'q1', prompt: 'Stores the energy that runs the lamp when it is unplugged.', answer: 'cell' },
    { id: 'q2', prompt: 'Controls how much current goes into the cell, and stops when it is full.', answer: 'charger' },
    { id: 'q3', prompt: 'Holds the current through the LEDs steady as the cell voltage falls.', answer: 'driver' },
    { id: 'q4', prompt: 'Turns electricity into light, and dims as it ages.', answer: 'led' },
    { id: 'q5', prompt: 'Selects brightness, and is the part a user wears out fastest.', answer: 'switch' },
  ],
}
```

- [ ] **Step 3: Write src/content/activities/index.ts**

```ts
import type { Activity } from '../../lib/activity'
import { flatIronParts } from './flat-iron-parts'
import { lightingParts } from './lighting-parts'

export const ACTIVITIES: Record<string, Activity> = {
  'flat-iron-parts': flatIronParts,
  'lighting-parts': lightingParts,
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 70 passing

- [ ] **Step 5: Commit**

```bash
git add src/content/activities
git commit -m "content: add the flat iron and lighting identification activities"
```

---

### Task 3: MatchActivity component

**Files:**
- Create: `src/interactives/MatchActivity.tsx`
- Modify: `src/interactives/registry.ts`

**Interfaces:**
- Consumes: `scoreActivity` and the activity types from `src/lib/activity`, `ACTIVITIES` from `src/content/activities`, `recordSim` from `src/lib/store`, `InteractiveProps` from `./types`
- Produces: `MatchActivity` component registered as `'match'`

Every item gets a native `<select>`. That is deliberate: a select is keyboard operable, works with every screen reader, and on Android opens the platform picker, which is a far better experience on a cheap phone than any drag target.

- [ ] **Step 1: Write src/interactives/MatchActivity.tsx**

```tsx
import { useState } from 'react'
import { scoreActivity } from '../lib/activity'
import { ACTIVITIES } from '../content/activities'
import { recordSim } from '../lib/store'
import type { InteractiveProps } from './types'

const label: React.CSSProperties = {}

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
```

Delete the unused `label` constant before committing; it is here only to warn you that `React.CSSProperties` does not compile in this project. If you need a style type, use `import type { CSSProperties } from 'react'`.

- [ ] **Step 2: Register it**

In `src/interactives/registry.ts` add `import { MatchActivity } from './MatchActivity'` and the entry `match: MatchActivity,`.

- [ ] **Step 3: Verify**

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 70 passing

- [ ] **Step 4: Commit**

```bash
git add src/interactives/MatchActivity.tsx src/interactives/registry.ts
git commit -m "feat: add matching activity component"
```

---

### Task 4: HotspotActivity component

**Files:**
- Create: `src/interactives/HotspotActivity.tsx`
- Modify: `src/interactives/registry.ts`

**Interfaces:**
- Consumes: `scoreActivity`, `Shape`, `HotspotActivity` type from `src/lib/activity`, `ACTIVITIES`, `recordSim`, `InteractiveProps`
- Produces: `HotspotActivity` component registered as `'hotspot'`

Questions are asked one at a time so the student always knows what they are looking for. Hotspots are real HTML buttons positioned over the SVG, not SVG click targets, so keyboard focus, screen reader labels and 44px touch targets all come free.

The SVG is set to `width: 100%` with `height: auto` and a viewBox matching `box`, so its rendered box exactly matches the drawing aspect with no letterboxing. That is what makes percentage-positioned overlay buttons land correctly at any width.

- [ ] **Step 1: Write src/interactives/HotspotActivity.tsx**

```tsx
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

      <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: 10, padding: 8 }}>
        <svg viewBox={`0 0 ${activity.box.w} ${activity.box.h}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
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
              disabled={done}
              style={{
                position: 'absolute', left: `${region.xPct}%`, top: `${region.yPct}%`,
                transform: 'translate(-50%, -50%)',
                width: 44, height: 44, borderRadius: 9999,
                background: 'transparent', border: `2px solid ${border}`,
                cursor: done || answered ? 'default' : 'pointer',
              }} />
          )
        })}
      </div>

      {!done && item && (
        <>
          <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '14px 0 4px' }}>
            Question {step + 1} of {activity.items.length}
          </p>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 10px' }}>
            {item.prompt}
          </p>
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
```

- [ ] **Step 2: Register it**

In `src/interactives/registry.ts` add `import { HotspotActivity } from './HotspotActivity'` and the entry `hotspot: HotspotActivity,`.

- [ ] **Step 3: Verify**

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 70 passing

- [ ] **Step 4: Commit**

```bash
git add src/interactives/HotspotActivity.tsx src/interactives/registry.ts
git commit -m "feat: add hotspot labelling activity component"
```

---

### Task 5: Two more troubleshooter scenarios

**Files:**
- Create: `src/content/scenarios/flat-iron.ts`, `src/content/scenarios/lamp.ts`
- Modify: `src/content/scenarios/index.ts`

**Interfaces:**
- Consumes: `Scenario` from `src/lib/diagnose`
- Produces: `flatIronScenario`, `lampScenario`, both registered in `SCENARIOS`

**Three authoring rules carried from Plan 2, all mandatory here:**
1. **Every test point must have a `'*'` reading.** Check each one. A missing `'*'` renders a blank reading, silently.
2. **Safety lines must be distinct strings** within a scenario.
3. **Test points are authored in service order,** because `requiredTests` scores against the position of the last implicating test point. Order them the way the module teaches the sweep.

- [ ] **Step 1: Write src/content/scenarios/flat-iron.ts**

```ts
import type { Scenario } from '../../lib/diagnose'

export const flatIronScenario: Scenario = {
  id: 'flat-iron',
  appliance: 'Electric flat iron',
  symptom: 'The iron is plugged in and the dial is turned up, but the plate stays cold. The indicator lamp does not light.',
  safety: [
    'Unplug the iron and let the plate cool completely before opening it.',
    'Check the cord along its whole length, because flexing wear hides under the sleeve near the strain relief.',
    'Keep the meter on continuity or resistance only, and never touch a plugged-in iron with a probe.',
  ],
  faults: [
    { id: 'cord', label: 'Broken supply cord', remedy: 'Replace the cord, or re-terminate it if the break is at the strain relief.' },
    { id: 'thermostat', label: 'Faulty thermostat', remedy: 'Clean the contacts if they are only dirty, otherwise fit the correct replacement thermostat.' },
    { id: 'fuse', label: 'Open thermal fuse', remedy: 'Fit a thermal fuse of the same rating and temperature. Never bridge it. Then find why the iron overheated, or the new one will open too.' },
    { id: 'element', label: 'Open heating element', remedy: 'Replace the sole plate assembly. On most irons the element is not separately serviceable.' },
  ],
  actualFault: 'element',
  testPoints: [
    {
      id: 'tp-cord', label: 'Supply cord', action: 'Continuity across the plug pins with the dial turned up.',
      readings: { cord: 'OL', '*': '1.1 ohm, meter beeps' },
      implicates: ['cord'],
    },
    {
      id: 'tp-stat', label: 'Thermostat', action: 'Continuity across the thermostat contacts with the dial turned up.',
      readings: { thermostat: 'OL with the dial at maximum', '*': '0.3 ohm, meter beeps' },
      implicates: ['thermostat'],
    },
    {
      id: 'tp-fuse', label: 'Thermal fuse', action: 'Continuity across the thermal fuse under the cover.',
      readings: { fuse: 'OL', '*': '0.2 ohm, meter beeps' },
      implicates: ['fuse'],
    },
    {
      id: 'tp-elem', label: 'Heating element', action: 'Resistance across the element terminals at the sole plate.',
      readings: { element: 'OL', '*': '48 ohm' },
      implicates: ['element'],
    },
  ],
}
```

- [ ] **Step 2: Write src/content/scenarios/lamp.ts**

```ts
import type { Scenario } from '../../lib/diagnose'

export const lampScenario: Scenario = {
  id: 'lamp',
  appliance: 'Rechargeable LED lamp',
  symptom: 'The lamp runs for only a few minutes off the battery. On charge, the charging indicator never comes on.',
  safety: [
    'Unplug the charger and switch the lamp off before opening the case.',
    'Treat the cell as live at all times, because a lithium cell cannot be switched off and a shorted one can vent or catch fire.',
    'Never puncture, bend or solder directly onto a lithium cell body.',
  ],
  faults: [
    { id: 'adaptor', label: 'Faulty charger adaptor', remedy: 'Replace the adaptor with one of the same output voltage and at least the same current rating.' },
    { id: 'jack', label: 'Broken charging jack', remedy: 'Resolder or replace the jack. The joints crack from repeated plugging.' },
    { id: 'charger', label: 'Failed charging circuit', remedy: 'Replace the charging board. Do not bypass it and charge the cell directly.' },
    { id: 'cell', label: 'Worn rechargeable cell', remedy: 'Fit a cell of the same chemistry, voltage and capacity, with its protection circuit intact.' },
    { id: 'led', label: 'Failed LED array', remedy: 'Replace the LED board.' },
  ],
  actualFault: 'cell',
  testPoints: [
    {
      id: 'tp-adaptor', label: 'Charger adaptor', action: 'DC volts across the adaptor output, unloaded.',
      readings: { adaptor: '0.0 V', '*': '5.1 V' },
      implicates: ['adaptor'],
    },
    {
      id: 'tp-jack', label: 'Charging jack', action: 'DC volts at the jack solder pads with the adaptor plugged in.',
      readings: { jack: '0.0 V, and the reading flickers when you wiggle the plug', '*': '5.0 V, steady' },
      implicates: ['jack'],
    },
    {
      id: 'tp-charge', label: 'Charging circuit output', action: 'DC volts at the charging board output, on charge.',
      readings: { charger: '0.0 V', '*': '4.1 V' },
      implicates: ['charger'],
    },
    {
      id: 'tp-cell', label: 'Cell', action: 'DC volts across the cell after ten minutes on charge.',
      readings: { cell: '3.1 V, and it falls to 2.8 V as soon as the lamp is switched on', '*': '4.0 V, steady under load' },
      implicates: ['cell'],
    },
    {
      id: 'tp-led', label: 'LED array', action: 'Diode test across the LED board input.',
      readings: { led: 'OL', '*': '2.71 V forward, the array glows faintly' },
      implicates: ['led'],
    },
  ],
}
```

- [ ] **Step 3: Update src/content/scenarios/index.ts**

```ts
import type { Scenario } from '../../lib/diagnose'
import { fanScenario } from './fan'
import { flatIronScenario } from './flat-iron'
import { lampScenario } from './lamp'

export const SCENARIOS: Record<string, Scenario> = {
  fan: fanScenario,
  'flat-iron': flatIronScenario,
  lamp: lampScenario,
}
```

- [ ] **Step 4: Verify the three authoring rules**

For each of the two new scenarios, confirm and report:
- Every test point has a `'*'` key. Count them: `flat-iron` has 4 test points, `lamp` has 5. Each must have `'*'`.
- The three safety strings in each scenario are distinct from each other.
- `requiredTests` for each: `flat-iron`'s actual fault is `element`, implicated by the fourth of four test points, so it is 4. `lamp`'s actual fault is `cell`, implicated by the fourth of five, so it is 4. Confirm by reading, and state both numbers in your report.

Then run these and report the real numbers. Both must be 0:
```bash
grep -c "—" src/content/scenarios/flat-iron.ts
grep -c "—" src/content/scenarios/lamp.ts
```

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 70 passing

- [ ] **Step 5: Commit**

```bash
git add src/content/scenarios
git commit -m "content: add flat iron and rechargeable lamp fault scenarios"
```

---

### Task 6: Module 4, heating components

**Files:**
- Create: `src/content/m4.ts`
- Modify: `src/content/index.ts`

**Interfaces:**
- Consumes: `Module` from `src/lib/types`
- Produces: `m4: Module` with its first two outcomes, registered in `MODULES`

This task creates Module 4 with two outcomes so it compiles and runs on its own. Task 7 adds the remaining three.

**The competency strings contain source inconsistencies that must be preserved.** Competency 2 is "Apply procedure" singular, not "procedures". Do not correct it.

- [ ] **Step 1: Write src/content/m4.ts**

```ts
import type { Module } from '../lib/types'

export const m4: Module = {
  id: 'm4',
  week: 'Week 4 to 5',
  title: 'Heating Appliances and Lighting Units',
  tint: 'm4',
  teacherReviewed: false,
  competencies: [
    'Discuss the procedures in servicing appliances with heating components.',
    'Apply procedure in servicing appliances with heating components.',
    'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
    'Demonstrate the procedure in servicing electronic controlled lighting units.',
    'Discuss the principles of Closed-Circuit Television (CCTV) system.',
  ],
  outcomes: [
    {
      id: 'lo1',
      title: 'Discuss the procedures in servicing appliances with heating components',
      lessons: [{
        id: 'l1',
        title: 'How a heating appliance protects itself',
        blocks: [
          { kind: 'safety', md: 'A heating appliance stays dangerously hot long after it is switched off, and a flat iron plate can burn you minutes after the power is gone. Unplug it, let it cool to the touch, and only then open it.' },
          { kind: 'text', md: 'A heating appliance turns electricity into heat on purpose, which means every one of them is built around the problem of stopping. An iron, a rice cooker, a toaster and a water heater all share the same chain: something makes the heat, something decides how much, and something cuts the power when the deciding fails.' },
          { kind: 'table',
            headers: ['Part', 'Its job', 'How it fails'],
            rows: [
              ['Heating element', 'Turns current into heat', 'Opens, usually where it enters the terminal'],
              ['Thermostat', 'Switches the element on and off to hold a setting', 'Contacts pit and stick, or stop closing at all'],
              ['Thermal fuse', 'Cuts power permanently if the appliance overheats', 'Opens once, and never closes again'],
              ['Indicator lamp', 'Shows the element is being fed', 'Fails open, which looks like a dead appliance'],
              ['Supply cord', 'Carries the current in', 'Breaks inside the sleeve near the strain relief'],
            ] },
          { kind: 'text', md: 'The thermostat and the thermal fuse are often confused, and telling them apart is most of this outcome. A thermostat is a switch that is meant to open and close thousands of times. A thermal fuse is meant to open exactly once, in an emergency, and then be replaced. If an appliance works again after cooling down, suspect the thermostat. If it never works again, suspect the fuse.' },
          { kind: 'interactive', simId: 'hotspot', config: { activity: 'flat-iron-parts' } },
          { kind: 'note', md: 'An element measured cold reads its full resistance. A 1000 watt element on 230 volts reads about 53 ohms. If you measure a few ohms, you are probably reading across the wrong pair of terminals.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm4-lo1-q1', competency: 'Discuss the procedures in servicing appliances with heating components.',
          stem: 'A rice cooker works for a while, then stops, then works again after an hour of cooling. Which part is most likely at fault?',
          options: [
            'The thermal fuse',
            'The thermostat',
            'The supply cord',
            'The heating element',
          ],
          answer: 1,
          rationale: [
            'A thermal fuse opens once and never closes again, so the appliance would not come back on its own.',
            'Correct. A thermostat that opens too early and resets on cooling produces exactly this pattern.',
            'A broken cord gives no power at all, and would not repair itself as the unit cools.',
            'An open element does not heal on cooling.',
          ] },
        { kind: 'truefalse', id: 'm4-lo1-q2', competency: 'Discuss the procedures in servicing appliances with heating components.',
          stem: 'A thermal fuse that has opened can be reset once the appliance has cooled.',
          answer: false,
          rationale: 'It cannot. A thermal fuse is a one-shot device. It opens once and must be replaced with one of the same current rating and the same temperature rating.' },
        { kind: 'mcq', id: 'm4-lo1-q3', competency: 'Discuss the procedures in servicing appliances with heating components.',
          stem: 'You measure 53 ohms across the element of a 1000 watt iron. What does that tell you?',
          options: [
            'The element is shorted',
            'The element is open',
            'The element is intact',
            'The thermostat is stuck closed',
          ],
          answer: 2,
          rationale: [
            'A shorted element would read close to zero ohms.',
            'An open element reads OL, not a sensible resistance.',
            'Correct. That is about what a 1000 watt element on 230 volts should read cold, so the element itself is fine and the fault is elsewhere.',
            'This measurement says nothing about the thermostat. Test it separately.',
          ] },
      ],
    },
    {
      id: 'lo2',
      title: 'Apply procedure in servicing appliances with heating components',
      lessons: [{
        id: 'l1',
        title: 'Finding the break in a cold iron',
        blocks: [
          { kind: 'text', md: 'The sweep for a heating appliance is the same one you learned on the fan: start at the plug and work inward, and each healthy reading rules out everything behind it. For an iron the order is cord, thermostat, thermal fuse, element.' },
          { kind: 'steps', items: [
            'Unplug the iron and let the plate cool completely.',
            'Check the cord for continuity, flexing it along its length as you measure.',
            'Check the thermostat contacts with the dial turned to maximum.',
            'Check the thermal fuse, which usually sits under the cover near the element terminals.',
            'Measure the element itself across the sole plate terminals.',
            'Replace only the part that failed, then run the iron and watch it cycle at least twice.',
          ] },
          { kind: 'interactive', simId: 'troubleshoot', config: { scenario: 'flat-iron' } },
          { kind: 'safety', md: 'Never bridge a thermal fuse to prove a diagnosis, not even for a moment. The fuse is the only protection against a runaway element in an appliance that a user leaves face down on a board.' },
          { kind: 'note', md: 'Flexing the cord while you measure is the step most people skip. A cord that reads fine at rest can open when it is bent the way it bends in use, and that intermittent fault will come back to you a week later.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm4-lo2-q1', competency: 'Apply procedure in servicing appliances with heating components.',
          stem: 'Your continuity test on an iron reads OL across the element but the cord, thermostat and thermal fuse all pass. What do you conclude?',
          options: [
            'The thermal fuse must be retested',
            'The element is open and the sole plate assembly needs replacing',
            'The iron is safe to return',
            'The thermostat is stuck open',
          ],
          answer: 1,
          rationale: [
            'The fuse already passed. Retesting a passing part before acting on a failing one is wasted work.',
            'Correct. Everything ahead of the element passes and the element does not, so the break is in the element.',
            'An iron that will not heat is not a repaired iron.',
            'The thermostat passed its own test.',
          ] },
        { kind: 'truefalse', id: 'm4-lo2-q2', competency: 'Apply procedure in servicing appliances with heating components.',
          stem: 'A supply cord should be flexed along its length while its continuity is measured.',
          answer: true,
          rationale: 'Yes. Cords break inside the insulation from flexing, most often near the plug or the strain relief, and a break can close again at rest. Flexing while measuring is what exposes an intermittent one.' },
        { kind: 'order', id: 'm4-lo2-q3', competency: 'Apply procedure in servicing appliances with heating components.',
          stem: 'Arrange the steps for finding why a flat iron will not heat.',
          steps: [
            'Unplug the iron and let the plate cool',
            'Test the supply cord, flexing it as you measure',
            'Test the thermostat contacts at maximum',
            'Test the thermal fuse',
            'Measure the heating element',
            'Replace the failed part and watch the iron cycle twice',
          ] },
      ],
    },
  ],
}
```

- [ ] **Step 2: Register it**

In `src/content/index.ts`, import `m4` and change the array to `[m1, m2, m3, m4]`.

- [ ] **Step 3: Verify the competency strings survived**

```bash
grep -c "Apply procedure in servicing appliances with heating components." src/content/m4.ts
grep -c "Apply procedures in servicing appliances with heating" src/content/m4.ts
grep -c "—" src/content/m4.ts
```
The first must be at least 1. **The second must be 0**, because the plural form is Module 3's wording, not Module 4's. The third must be 0.

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 70 passing

- [ ] **Step 4: Commit**

```bash
git add src/content/m4.ts src/content/index.ts
git commit -m "content: add Module 4 heating component outcomes"
```

---

### Task 7: Module 4, lighting units and CCTV principles

**Files:**
- Modify: `src/content/m4.ts`

**Interfaces:**
- Consumes: the `m4` object created in Task 6
- Produces: `m4` with all five outcomes

Append three outcomes to the existing `outcomes` array. Change nothing already there.

**Competency 4 reads "electronic controlled" with no hyphen, where competency 3 reads "electronic-controlled" with one. That is the source document's own inconsistency and both are correct as written.**

- [ ] **Step 1: Append the three outcomes to src/content/m4.ts**

Insert these after the `lo2` object, inside the same `outcomes` array.

```ts
    {
      id: 'lo3',
      title: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units',
      lessons: [{
        id: 'l1',
        title: 'What is inside a rechargeable lamp',
        blocks: [
          { kind: 'text', md: 'A rechargeable lamp is four blocks in a line. A charging circuit takes power from an adaptor and puts it into a cell at a rate the cell can accept. The cell stores it. A driver takes whatever the cell currently holds and pushes a steady current through the LEDs. The LEDs turn that current into light.' },
          { kind: 'text', md: 'Knowing that chain tells you what a symptom means. A lamp that runs briefly has a storage problem. A lamp that never charges has a problem before the cell. A lamp that lights unevenly or flickers has a driver or LED problem, because the cell cannot make light on its own.' },
          { kind: 'interactive', simId: 'match', config: { activity: 'lighting-parts' } },
          { kind: 'safety', md: 'A lithium cell cannot be switched off. Treat it as live whenever the case is open, never puncture or bend it, and never solder directly onto the cell body, because the heat can make it vent or catch fire. Fit replacements with their protection circuit intact.' },
          { kind: 'note', md: 'A cell that reads its normal voltage with nothing connected can still be worn out. Capacity shows up only under load, which is why a cell is judged by what its voltage does when the lamp is switched on, not by what it reads at rest.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm4-lo3-q1', competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
          stem: 'A rechargeable lamp lights normally but runs for only three minutes. Which block is at fault?',
          options: [
            'The LED array',
            'The cell',
            'The driver',
            'The control switch',
          ],
          answer: 1,
          rationale: [
            'The LEDs light normally, so they are receiving current and working.',
            'Correct. Normal brightness for a short time is a storage problem, which is the cell.',
            'A failing driver shows up as flicker or wrong brightness, not as a short run at the right brightness.',
            'A switch either passes current or does not. It does not limit how long the lamp runs.',
          ] },
        { kind: 'truefalse', id: 'm4-lo3-q2', competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
          stem: 'A cell that reads its rated voltage at rest is proven good.',
          answer: false,
          rationale: 'It is not. A worn cell can sit at its rated voltage with nothing drawing from it and then collapse the moment the lamp is switched on. Capacity is only visible under load.' },
        { kind: 'mcq', id: 'm4-lo3-q3', competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
          stem: 'Why should a replacement lithium cell keep its protection circuit?',
          options: [
            'It makes the lamp brighter',
            'It prevents over-charge, over-discharge and short circuit, any of which can make the cell vent or burn',
            'It is required for the charging indicator to work',
            'It increases the capacity of the cell',
          ],
          answer: 1,
          rationale: [
            'Protection has no effect on brightness.',
            'Correct. The protection board is the cell safety device, and a lamp is left charging unattended in a home.',
            'The indicator is driven by the charging circuit, not by the cell protection.',
            'Protection does not change capacity.',
          ] },
      ],
    },
    {
      id: 'lo4',
      title: 'Demonstrate the procedure in servicing electronic controlled lighting units',
      lessons: [{
        id: 'l1',
        title: 'Working through a lamp that will not charge',
        blocks: [
          { kind: 'text', md: 'The sweep runs the same direction as always, from the supply toward the load. For a lamp that is adaptor, jack, charging circuit, cell, then LEDs. Most lamps that reach a bench have one of the first two faults, because the jack takes mechanical stress every time someone plugs it in.' },
          { kind: 'steps', items: [
            'Unplug the charger and switch the lamp off before opening the case.',
            'Measure the adaptor output on its own, with nothing connected.',
            'Measure at the jack solder pads while wiggling the plug, watching for a reading that flickers.',
            'Measure the charging circuit output while the lamp is on charge.',
            'Measure the cell after ten minutes on charge, then again with the lamp switched on.',
            'Reassemble, charge fully, and run the lamp until it cuts off to confirm the runtime.',
          ] },
          { kind: 'interactive', simId: 'troubleshoot', config: { scenario: 'lamp' } },
          { kind: 'note', md: 'The last step is the one that gets skipped and the one that matters most to the owner. A lamp that charges is not a repaired lamp; a lamp that charges and then runs for its rated time is.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm4-lo4-q1', competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
          stem: 'At the charging jack you read 5.0 volts, but it drops out and returns as you wiggle the plug. What is the fault?',
          options: [
            'The adaptor is failing under load',
            'The jack solder joints are cracked',
            'The cell is worn',
            'The charging circuit has failed',
          ],
          answer: 1,
          rationale: [
            'The adaptor is upstream of the jack and its output was already measured on its own.',
            'Correct. A reading that changes with mechanical movement is a mechanical fault, and the jack is where the plugging stress lands.',
            'A worn cell affects runtime, not whether voltage reaches the jack.',
            'The charging circuit sits after the jack, so it cannot cause an intermittent reading at the jack itself.',
          ] },
        { kind: 'truefalse', id: 'm4-lo4-q2', competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
          stem: 'A lamp that charges again after repair can be returned without running it down.',
          answer: false,
          rationale: 'No. Charging proves the input side works. Only running the lamp until it cuts off proves the cell actually holds the capacity the owner is paying for.' },
        { kind: 'order', id: 'm4-lo4-q3', competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
          stem: 'Arrange the steps for servicing a rechargeable lamp that will not charge.',
          steps: [
            'Unplug the charger and switch the lamp off',
            'Measure the adaptor output on its own',
            'Measure at the jack while wiggling the plug',
            'Measure the charging circuit output on charge',
            'Measure the cell on charge and then under load',
            'Reassemble, charge fully and confirm the runtime',
          ] },
      ],
    },
    {
      id: 'lo5',
      title: 'Discuss the principles of Closed-Circuit Television (CCTV) system',
      lessons: [{
        id: 'l1',
        title: 'What a CCTV system is made of',
        blocks: [
          { kind: 'text', md: 'A CCTV system is a closed loop: cameras capture, cable carries, a recorder stores, and a monitor displays. Closed circuit means the picture goes only to that loop, which is what separates it from broadcast television and is where the name comes from.' },
          { kind: 'table',
            headers: ['Part', 'Its job', 'What goes wrong'],
            rows: [
              ['Camera', 'Captures the image and sends it down the cable', 'Lens fogs or dirties, infrared array fails at night'],
              ['Cable', 'Carries video and often power', 'Connector corrodes, or the run is too long for the signal'],
              ['Power supply', 'Feeds every camera', 'Sags when too many cameras share one supply'],
              ['Recorder', 'Stores footage and serves it to a monitor', 'Disk fills or fails, so nothing is retained'],
              ['Monitor', 'Displays live and recorded video', 'Wrong input selected, which looks like a dead system'],
            ] },
          { kind: 'text', md: 'Two ideas decide how a system is designed. Coverage is what the cameras can actually see, which depends on where they are mounted and how wide the lens is, and a camera pointed at a bright window will show you a silhouette and nothing else. Retention is how many days of footage the recorder holds before it overwrites, which depends on disk size, how many cameras there are and what quality they record at.' },
          { kind: 'note', md: 'Most CCTV complaints are not faults. A system that has quietly been overwriting after two days, or a camera that has drifted to point at a wall, will be reported as broken only when someone finally needs the footage.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm4-lo5-q1', competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
          stem: 'What does closed circuit mean in Closed-Circuit Television?',
          options: [
            'The cameras are wired in a ring',
            'The signal is carried only to its own recorder and monitors, and is not broadcast',
            'The system works without electricity',
            'The recorder is sealed and cannot be opened',
          ],
          answer: 1,
          rationale: [
            'Ring wiring is a cabling topology and has nothing to do with the name.',
            'Correct. The signal stays inside its own closed loop rather than being broadcast to anyone with a receiver.',
            'Every camera and recorder in the system needs power.',
            'Recorders are opened routinely to service or replace their disks.',
          ] },
        { kind: 'mcq', id: 'm4-lo5-q2', competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
          stem: 'An owner says the system is broken because last week is missing, though every camera shows a live picture. What is the most likely explanation?',
          options: [
            'Every camera has failed at once',
            'The recorder has been overwriting older footage sooner than the owner expected',
            'The monitor is on the wrong input',
            'The cable runs are too long',
          ],
          answer: 1,
          rationale: [
            'Live pictures from every camera prove the cameras are working.',
            'Correct. Retention depends on disk size, camera count and recording quality, and a system quietly overwriting after a few days looks fine until someone needs the past.',
            'A wrong input would stop the live picture too.',
            'Cable length affects picture quality, not how long recordings are kept.',
          ] },
        { kind: 'truefalse', id: 'm4-lo5-q3', competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
          stem: 'A camera aimed toward a bright window will still give a usable picture of anyone standing in front of it.',
          answer: false,
          rationale: 'It will not. The camera exposes for the bright background, so a person in front of it appears as a dark silhouette. Coverage means what a camera can usefully see, not merely where it points.' },
      ],
    },
```

- [ ] **Step 2: Verify**

```bash
grep -c "Demonstrate the procedure in servicing electronic controlled lighting units." src/content/m4.ts
grep -c "electronic-controlled lighting units" src/content/m4.ts
grep -c "—" src/content/m4.ts
```
The first must be at least 1, proving the unhyphenated form survived. The second must be at least 1, proving the hyphenated form in competency 3 also survived. The third must be 0.

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 70 passing

- [ ] **Step 3: Walk the whole thing in a browser**

Run `npm run dev` and confirm each, reporting what you actually saw:
- The module map shows four tiles in four different tints
- `/#/m/m4/lo/lo1` renders the flat iron diagram with four ringed hotspots
- Clicking a wrong hotspot marks it in amber and rings the correct one in green
- Tabbing reaches every hotspot and Enter selects one
- Answering all four questions shows a score line
- `/#/m/m4/lo/lo2` renders the troubleshooter with the flat iron scenario, and testing the element reads OL
- `/#/m/m4/lo/lo3` renders the matching activity with five selects, and Check answers is disabled until all five are chosen
- `/#/m/m4/lo/lo4` renders the troubleshooter with the lamp scenario
- Reloading keeps all progress, and the map shows partial progress on m4

- [ ] **Step 4: Commit**

```bash
git add src/content/m4.ts
git commit -m "content: add Module 4 lighting and CCTV principles outcomes"
```

---

## Self-Review

**Spec coverage for this plan.** Two of the three light-interactive engines named in the spec, Tasks 1, 3 and 4, sharing one scorer rather than two. Module 4 in full with competencies quoted verbatim including the source's own inconsistencies, Tasks 6 and 7. Two more troubleshooter scenarios as data, proving again that a scenario needs no component change, Task 5. All three scenario-authoring hazards recorded in `CARRY-FORWARD.md` are addressed explicitly in Task 5 step 4.

Deliberately out of this plan: the Sequence engine, which moves to the plan that ships Modules 5, 7 and 8, because signal-flow mapping is a CCTV, fire-alarm and audio need and the `order` quiz kind already covers ordering inside quizzes. Also out: Modules 5 through 9, the remaining five scenarios, the assessment layer, the evaluation survey, the export, and PWA packaging.

**Placeholder scan.** No TBDs. Every code step carries runnable code. Task 3 contains one deliberate trap: an unused `label` constant typed as `React.CSSProperties`, which must be deleted, and which exists to stop an implementer reintroducing the namespace form that does not compile in this project.

**Type consistency.** `ActivityItem`, `Choice`, `Shape`, `Region`, `MatchActivity`, `HotspotActivity`, `Activity` and `ActivityResult` are defined once in Task 1 and imported unchanged in Tasks 2, 3 and 4. `Scenario` is the existing Plan 2 export and is not redeclared. `InteractiveProps` and `recordSim` are existing exports. Both new components spread `config` first into `evidence`, matching the house rule, and both write `score` as a fraction from 0 to 1. Both record a row on completion rather than only on success, matching the policy recorded in `CARRY-FORWARD.md`. The `simId` values `'match'` and `'hotspot'` are new and do not collide with `'multimeter'`, `'psu'` or `'troubleshoot'`.

**Test counts.** The branch starts at 63. Task 1 adds 7, reaching 70. Tasks 2 through 7 add none, by design: they are UI and data, which the spec excludes from unit testing, and Task 7 closes with a manual walkthrough instead.
