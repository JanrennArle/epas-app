# EPAS Sequence Activity and Modules 5 to 7: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The signal-flow activity the Budget of Work keeps asking for, plus Modules 5, 6 and 7 in full. A student traces video from a camera to a monitor, traces a fire alarm signal from a detector to a sounder, and diagnoses a dead CCTV channel and an open fire alarm zone.

**Architecture:** A third activity format over the existing scorer, since a chain position is just one prompt with one correct answer. Two more fault scenarios as pure data against the unchanged diagnose engine. Three content modules.

**Tech Stack:** Existing only. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`
**Visual authority:** `docs/DESIGN.md`
**Deferred items:** `docs/superpowers/plans/CARRY-FORWARD.md`
**Reference implementations:** `src/lib/activity.ts` for the scorer, `src/interactives/MatchActivity.tsx` for component shape, `src/content/scenarios/lamp.ts` for scenario shape. Read all three before starting.

## Global Constraints

- **No new dependencies.** None, for any reason.
- **No CDN, no external runtime asset.** Must work with the network off.
- **SVG only, authored as typed data. No `dangerouslySetInnerHTML`.**
- **No drag and drop.** Cheap Android phones and assistive technology. Sequence uses real `<button>` elements.
- **Engines pure and total.** No randomness, no clock, no module state, never throw.
- **`--danger` is reserved for electrical safety.** Wrong answers use `var(--caution)`.
- Accent button text uses `var(--on-accent)`, never a literal.
- **Instrument literals** only inside a panel carrying `className="instrument"`. Nothing here is an instrument.
- **Radius:** cards and tiles 14px, controls 10px, pills full.
- **Motion:** only `transform` and `opacity`, only the existing `.tile` press. No new transitions, no celebration.
- **Touch targets 44px minimum** on every interactive element.
- **No em dashes, no emoji** in any user-visible string.
- **Only `src/lib/store.ts` touches localStorage.**
- **`SimRecord.score` is a fraction from 0 to 1.**
- **`config` is spread FIRST into `evidence`.** House rule.
- **New modules ship `teacherReviewed: false`.**
- **Competency strings are quoted verbatim** from `docs/reference/G12-TechPro-EPAS-budget-of-work.txt`, source lines 339, 343, 407, 408, 441 and 444. Preserve the source exactly.
- Compiles under `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`.

## Carried forward, and how this plan handles it

From `CARRY-FORWARD.md` and the Plan 3 ledger:

1. **Every non-implicating test point needs a `'*'` reading.** A missing one renders blank, silently. Task 4 checks every one.
2. **Safety lines must be distinct strings** within a scenario. Task 4 checks.
3. **Test points are authored in service order,** because `requiredTests` returns the position of the last implicating one. Task 4 orders them the way the module teaches the sweep.
4. **Fault labels are lower-cased mid-sentence** by the troubleshooter's wrong-answer message. Avoid labels whose meaning depends on capitals. **This now bites: "CCTV", "BNC", "DVR" and "EOL" would render lower-cased.** Task 4 words every fault label so it survives lower-casing.
5. **`simId` alone no longer identifies an exercise.** This plan adds a third `troubleshoot` and a third activity id, deepening that. No code change; already recorded.
6. **Not addressed here:** the `Shape` polygon gap and the `Drawing` exhaustiveness guard stay deferred, because no task in this plan authors a diagram.

---

## File Structure

```
src/
  lib/
    activity.ts            MODIFY: add SequenceActivityData, extend Activity
  content/
    activities/
      cctv-signal.ts       sequence: camera to monitor
      fas-signal.ts        sequence: detector to sounder
      index.ts             MODIFY: register both
    scenarios/
      cctv.ts              fault scenario: one camera shows no picture
      fas-zone.ts          fault scenario: zone 2 reads open circuit
      index.ts             MODIFY: register both
    m5.ts  m6.ts  m7.ts
    index.ts               MODIFY: register all three
  interactives/
    SequenceActivity.tsx
    registry.ts            MODIFY: one entry
tests/
  activities.test.ts       MODIFY: handle three kinds, add two sequence invariants
```

---

### Task 1: The sequence activity type

**Files:**
- Modify: `src/lib/activity.ts`, `tests/activities.test.ts`

**Interfaces:**
- Consumes: the existing `ActivityItem`, `Choice`, `Activity` union
- Produces: `SequenceActivityData`, and `Activity` widened to three members

A chain position is one prompt with one correct answer, so `scoreActivity` needs no change at all. Only the union widens. That is the whole point of building the scorer generically in Plan 3.

- [ ] **Step 1: Add the type to src/lib/activity.ts**

Insert after the `HotspotActivityData` interface, and widen the union:

```ts
export interface SequenceActivityData {
  kind: 'sequence'
  id: string
  instruction: string
  /**
   * The blocks a student arranges. Authored in display order, which must
   * NOT be the chain order, or the exercise answers itself.
   */
  choices: Choice[]
  /**
   * One item per position in the chain, authored in chain order. Each
   * `answer` is the id of the choice belonging at that position. Choices
   * with no matching answer are deliberate distractors: parts that are in
   * the box but not in the signal path.
   */
  items: ActivityItem[]
}

export type Activity = MatchActivityData | HotspotActivityData | SequenceActivityData
```

Delete the old two-member `Activity` union. Change nothing else in the file, and do not touch `scoreActivity`.

- [ ] **Step 2: Update the existing guard test for three kinds**

`tests/activities.test.ts` currently narrows with `activity.kind === 'match' ? activity.choices : activity.regions`, which does not compile once a third kind exists. In BOTH places it appears, the answer-resolution test and the unique-target-ids test, invert the narrowing so `hotspot` is the special case:

```ts
      const valid = activity.kind === 'hotspot'
        ? activity.regions.map(r => r.id)
        : activity.choices.map(c => c.id)
```

and

```ts
      const targetIds = activity.kind === 'hotspot'
        ? activity.regions.map(r => r.id)
        : activity.choices.map(c => c.id)
```

`match` and `sequence` both carry `choices`, so this handles all three. Keep the assertion messages exactly as they are.

- [ ] **Step 3: Add two sequence invariants to the same describe block**

Append these two tests inside the first `describe`, after the existing ones:

```ts
  it('never presents a sequence in its own answer order', () => {
    for (const [key, activity] of entries) {
      if (activity.kind !== 'sequence') continue
      const shown = activity.choices.map(c => c.id)
      const answer = activity.items.map(i => i.answer)
      const prefix = shown.slice(0, answer.length)
      expect(prefix, `${key} display order`).not.toEqual(answer)
    }
  })

  it('never repeats a block within one sequence', () => {
    for (const [key, activity] of entries) {
      if (activity.kind !== 'sequence') continue
      const answers = activity.items.map(i => i.answer)
      expect(new Set(answers), `${key} chain`).toHaveProperty('size', answers.length)
    }
  })
```

The first stops an author shipping a chain whose pool is already in the right order, which would let a student solve it top to bottom without reading. The second stops the same block appearing twice in one chain, which no signal path does.

- [ ] **Step 4: Verify**

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 82 passing, the 80 existing plus the 2 added. Both new tests pass vacuously for now, since no sequence activity exists yet; Task 2 gives them something to check.

- [ ] **Step 5: Commit**

```bash
git add src/lib/activity.ts tests/activities.test.ts
git commit -m "feat: add the sequence activity type"
```

---

### Task 2: The two signal chains as data

**Files:**
- Create: `src/content/activities/cctv-signal.ts`, `src/content/activities/fas-signal.ts`
- Modify: `src/content/activities/index.ts`

**Interfaces:**
- Consumes: `SequenceActivityData` from `src/lib/activity`
- Produces: `cctvSignal`, `fasSignal`, both registered in `ACTIVITIES`

Both come from the Budget of Work: "Discuss how video signals travel from cameras to recording and monitoring units and the purpose of each component", and "Explain how signals are transmitted from detectors to the control panel and how the alarm activates".

Each chain carries one deliberate distractor: a part that is in the box and matters, but is not in the signal path. That is the teaching point.

- [ ] **Step 1: Write src/content/activities/cctv-signal.ts**

```ts
import type { SequenceActivityData } from '../../lib/activity'

export const cctvSignal: SequenceActivityData = {
  kind: 'sequence',
  id: 'cctv-signal',
  instruction: 'Build the path a picture takes, from where it is captured to where someone watches it. One of these parts matters but is not in that path, so leave it out.',
  choices: [
    { id: 'recorder', label: 'Recorder, the DVR or NVR' },
    { id: 'psu', label: 'Camera power supply' },
    { id: 'camera', label: 'Camera' },
    { id: 'monitor', label: 'Monitor' },
    { id: 'cable', label: 'Cable run and connectors' },
  ],
  items: [
    { id: 'p1', prompt: 'First', answer: 'camera' },
    { id: 'p2', prompt: 'Second', answer: 'cable' },
    { id: 'p3', prompt: 'Third', answer: 'recorder' },
    { id: 'p4', prompt: 'Fourth', answer: 'monitor' },
  ],
}
```

- [ ] **Step 2: Write src/content/activities/fas-signal.ts**

```ts
import type { SequenceActivityData } from '../../lib/activity'

export const fasSignal: SequenceActivityData = {
  kind: 'sequence',
  id: 'fas-signal',
  instruction: 'Build the path an alarm takes, from the thing that notices a fire to the thing that warns the building. One of these parts matters but is not in that path, so leave it out.',
  choices: [
    { id: 'panel', label: 'Control panel' },
    { id: 'detector', label: 'Smoke detector' },
    { id: 'battery', label: 'Standby battery' },
    { id: 'sounder', label: 'Sounder and strobe' },
    { id: 'loop', label: 'Zone wiring' },
  ],
  items: [
    { id: 'p1', prompt: 'First', answer: 'detector' },
    { id: 'p2', prompt: 'Second', answer: 'loop' },
    { id: 'p3', prompt: 'Third', answer: 'panel' },
    { id: 'p4', prompt: 'Fourth', answer: 'sounder' },
  ],
}
```

- [ ] **Step 3: Register both in src/content/activities/index.ts**

Add the two imports and two entries, keeping the existing two:

```ts
  'cctv-signal': cctvSignal,
  'fas-signal': fasSignal,
```

- [ ] **Step 4: Verify the guards actually bite**

Run: `npm test` → 82 passing. The two sequence invariants added in Task 1 now have data to check.

Then prove they are not vacuous. Temporarily reorder `cctv-signal`'s `choices` so the first four read camera, cable, recorder, monitor, run `npx vitest run tests/activities.test.ts`, and confirm the display-order test FAILS naming `cctv-signal`. **Revert that change and confirm `git status --short` is clean before committing.** Paste both outputs.

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `grep -c "—" src/content/activities/*.ts` → 0 for every file

- [ ] **Step 5: Commit**

```bash
git add src/content/activities
git commit -m "content: add the CCTV and fire alarm signal chains"
```

---

### Task 3: SequenceActivity component

**Files:**
- Create: `src/interactives/SequenceActivity.tsx`
- Modify: `src/interactives/registry.ts`

**Interfaces:**
- Consumes: `scoreActivity` from `src/lib/activity`, `ACTIVITIES`, `recordSim`, `InteractiveProps`
- Produces: `SequenceActivity` registered as `'sequence'`

The student picks blocks from a pool in order. Each pick appends to the chain and leaves the pool, which enforces that no block appears twice without any extra code. The chain renders left to right with arrows so the signal path is visible, which is the whole reason this is not just another matching exercise.

- [ ] **Step 1: Write src/interactives/SequenceActivity.tsx**

```tsx
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
              <button key={c.id} onClick={() => place(c.id)} disabled={full} className="tile"
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
```

- [ ] **Step 2: Register it**

In `src/interactives/registry.ts` add `import { SequenceActivity } from './SequenceActivity'` and the entry `sequence: SequenceActivity,`.

- [ ] **Step 3: Verify**

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 82 passing, unchanged

Then exercise it in jsdom with `config={{ activity: 'cctv-signal' }}` and report what you observed for: the pool shrinking as blocks are placed, Check disabled until four are placed, a wrong order marking the wrong positions in caution and naming the correct path, and exactly one `recordSim` row with `simId: 'sequence'`. Delete any temporary test file and confirm `git status --short` is clean before committing.

- [ ] **Step 4: Commit**

```bash
git add src/interactives/SequenceActivity.tsx src/interactives/registry.ts
git commit -m "feat: add signal path sequence activity"
```

---

### Task 4: Two more fault scenarios

**Files:**
- Create: `src/content/scenarios/cctv.ts`, `src/content/scenarios/fas-zone.ts`
- Modify: `src/content/scenarios/index.ts`

**Interfaces:**
- Consumes: `Scenario` from `src/lib/diagnose`
- Produces: `cctvScenario`, `fasZoneScenario`, both registered in `SCENARIOS`

**The four authoring hazards, all mandatory, all silent if wrong:**
1. Every test point needs a `'*'` reading.
2. Safety lines distinct within a scenario.
3. Test points authored in service order.
4. **New and biting here: fault labels are lower-cased mid-sentence** by the troubleshooter's wrong-answer message. Every label below is worded to survive that, which is why they read "connector at the camera" rather than "BNC connector" and "break in the zone wiring" rather than "EOL fault".

- [ ] **Step 1: Write src/content/scenarios/cctv.ts**

```ts
import type { Scenario } from '../../lib/diagnose'

export const cctvScenario: Scenario = {
  id: 'cctv',
  appliance: 'CCTV camera channel',
  symptom: 'Camera 3 shows a black screen on the monitor. The other three cameras are fine, and the recorder is running normally.',
  safety: [
    'Switch off the camera power supply before touching any camera wiring.',
    'Work from a stable platform when reaching a mounted camera, and never lean off a ladder to reach sideways.',
    'Treat every outdoor connector as wet until you have opened and looked at it.',
  ],
  faults: [
    { id: 'psu', label: 'no power reaching the camera', remedy: 'Restore the supply at the fault you found, then confirm the camera draws its rated current.' },
    { id: 'connector', label: 'corroded connector at the camera', remedy: 'Cut back to clean conductor, fit a new connector, and weatherproof the joint properly.' },
    { id: 'cable', label: 'damaged cable along the run', remedy: 'Replace the damaged section, or re-route the run away from whatever damaged it.' },
    { id: 'camera', label: 'failed camera', remedy: 'Replace the camera with one of the same supply voltage and signal type.' },
    { id: 'channel', label: 'faulty recorder input', remedy: 'Move the camera to a spare input if there is one, otherwise the recorder needs service.' },
  ],
  actualFault: 'connector',
  testPoints: [
    {
      id: 'tp-psu', label: 'Camera supply', action: 'DC volts at the camera end of the power pair.',
      readings: { psu: '0.0 V', '*': '12.1 V' },
      implicates: ['psu'],
    },
    {
      id: 'tp-conn', label: 'Connector at the camera', action: 'Open the connector and inspect it, then measure continuity through it.',
      readings: { connector: 'Green corrosion on the centre pin, and continuity is intermittent when moved', '*': 'Clean and dry, continuity solid' },
      implicates: ['connector'],
    },
    {
      id: 'tp-cable', label: 'Cable run', action: 'Continuity along the run with the far end shorted.',
      readings: { cable: 'OL on the centre conductor', '*': '2.4 ohm, meter beeps' },
      implicates: ['cable'],
    },
    {
      id: 'tp-cam', label: 'Camera', action: 'Substitute a camera known to be working, at the camera end.',
      readings: { camera: 'The substitute gives a picture', '*': 'The substitute gives the same black screen' },
      implicates: ['camera'],
    },
    {
      id: 'tp-chan', label: 'Recorder input', action: 'Move the cable to a recorder input known to be working.',
      readings: { channel: 'The picture appears on the other input', '*': 'The other input is black too' },
      implicates: ['channel'],
    },
  ],
}
```

- [ ] **Step 2: Write src/content/scenarios/fas-zone.ts**

```ts
import type { Scenario } from '../../lib/diagnose'

export const fasZoneScenario: Scenario = {
  id: 'fas-zone',
  appliance: 'Fire alarm zone',
  symptom: 'The control panel shows an open circuit fault on zone 2. Detectors on that zone do not respond when tested, and every other zone is healthy.',
  safety: [
    'Tell the building occupants and the responsible person before you put any zone out of service.',
    'Isolate the sounders at the panel so a test does not evacuate the building.',
    'Record the time the zone went out of service, and stay with the system until it is back.',
  ],
  faults: [
    { id: 'endline', label: 'missing end of line resistor', remedy: 'Fit the resistor value the panel calls for, at the last device on the zone and nowhere else.' },
    { id: 'wiring', label: 'break in the zone wiring', remedy: 'Repair the break in a proper enclosure, then confirm the zone reads its normal standing resistance.' },
    { id: 'base', label: 'detector not seated in its base', remedy: 'Seat the head correctly until it latches, then retest that device.' },
    { id: 'head', label: 'failed detector head', remedy: 'Replace the head with the same type, and record its position and date.' },
    { id: 'card', label: 'faulty panel zone card', remedy: 'The panel needs service. Do not leave the zone disabled without telling the responsible person.' },
  ],
  actualFault: 'wiring',
  testPoints: [
    {
      id: 'tp-panel', label: 'Panel terminals', action: 'Resistance across the zone 2 terminals with the zone disconnected at the panel.',
      readings: { card: '6.8 kilohm, the zone itself is healthy', '*': 'OL' },
      implicates: ['card'],
    },
    {
      id: 'tp-first', label: 'First junction', action: 'Resistance looking outward from the first junction box on the zone.',
      readings: { wiring: 'OL', '*': '6.8 kilohm' },
      implicates: ['wiring'],
    },
    {
      id: 'tp-base', label: 'Detector bases', action: 'Check each head is latched into its base and its base terminals are tight.',
      readings: { base: 'One head turns freely in its base and does not latch', '*': 'Every head is latched and every terminal is tight' },
      implicates: ['base'],
    },
    {
      id: 'tp-endline', label: 'End of line', action: 'Resistance across the end of line resistor at the last device.',
      readings: { endline: 'OL, and no resistor is fitted', '*': '6.8 kilohm' },
      implicates: ['endline'],
    },
    {
      id: 'tp-head', label: 'Detector heads', action: 'Substitute a head known to be working, one device at a time.',
      readings: { head: 'The zone reads normally with the substitute fitted', '*': 'No change with the substitute fitted' },
      implicates: ['head'],
    },
  ],
}
```

**Note on the panel test point.** Its `'*'` reading is `OL`, which is the reading in every case except a faulty card. That is correct: the symptom is an open circuit, so the panel sees OL for every fault except the one where the wiring is fine and the panel itself is at fault. This is the first scenario in the project where `'*'` is the abnormal reading rather than the healthy one, and it is deliberate.

- [ ] **Step 3: Update src/content/scenarios/index.ts**

Add the two imports and two entries, keeping the existing three:

```ts
  cctv: cctvScenario,
  'fas-zone': fasZoneScenario,
```

- [ ] **Step 4: Verify the four hazards**

For EACH new scenario, report explicitly:
- The test point count, and confirmation every one has a `'*'` key. Both have 5.
- That the three safety strings are distinct.
- What `requiredTests` evaluates to, by applying `src/lib/diagnose.ts`: the 1-based position of the last test point whose `implicates` contains `actualFault`. For `cctv` the actual fault is `connector`, implicated by test point 2 of 5, so it is 2. For `fas-zone` the actual fault is `wiring`, implicated by test point 2 of 5, so it is 2. State both.
- That every fault label reads correctly when lower-cased mid-sentence, since the troubleshooter renders "The fault was the {label}.". Read each aloud in that sentence and confirm.

Run: `npx tsc -b` → clean
Run: `npm run build` → succeeds
Run: `npm test` → 82 passing
Run: `grep -c "—" src/content/scenarios/cctv.ts src/content/scenarios/fas-zone.ts` → 0 for each

- [ ] **Step 5: Commit**

```bash
git add src/content/scenarios
git commit -m "content: add CCTV channel and fire alarm zone fault scenarios"
```

---

### Task 5: Module 5, CCTV systems

**Files:**
- Create: `src/content/m5.ts`
- Modify: `src/content/index.ts`

**Interfaces:**
- Consumes: `Module` from `src/lib/types`
- Produces: `m5: Module`, registered in `MODULES`

Competency strings are verbatim from source lines 339 and 343.

- [ ] **Step 1: Write src/content/m5.ts**

```ts
import type { Module } from '../lib/types'

export const m5: Module = {
  id: 'm5',
  week: 'Week 6',
  title: 'CCTV Systems',
  tint: 'm5',
  teacherReviewed: false,
  competencies: [
    'Demonstrate the procedure in CCTV system installation.',
    'Perform CCTV system servicing.',
  ],
  outcomes: [
    {
      id: 'lo1',
      title: 'Demonstrate the procedure in CCTV system installation',
      lessons: [{
        id: 'l1',
        title: 'Planning before you drill',
        blocks: [
          { kind: 'text', md: 'An installation is decided before any hole is made. Where a camera goes fixes what it can see, and no adjustment afterwards recovers a bad position. Work out the coverage first, on paper, then mount to that plan.' },
          { kind: 'interactive', simId: 'sequence', config: { activity: 'cctv-signal' } },
          { kind: 'table',
            headers: ['Decision', 'What it settles', 'The usual mistake'],
            rows: [
              ['Camera position', 'What is in view and how large a face appears', 'Mounting high for safety, so every face is a hat'],
              ['Direction', 'Whether the sun or a window is behind the subject', 'Pointing at a doorway that is bright behind'],
              ['Cable route', 'Signal quality and how easy repair will be', 'The shortest route, through the wettest place'],
              ['Power', 'Whether every camera holds its voltage', 'One small supply feeding more cameras than it can'],
              ['Recorder position', 'Whether a thief can take the evidence with them', 'The recorder beside the front door'],
            ] },
          { kind: 'steps', items: [
            'Agree what the system must actually see, in writing, with whoever is paying for it.',
            'Walk the site and choose positions that meet that, at a height a person can be identified from.',
            'Plan cable routes that stay dry and stay reachable.',
            'Mount the cameras and run the cable without pulling it tight around corners.',
            'Terminate the connectors properly and weatherproof every outdoor joint.',
            'Power up, aim each camera against the plan, and record the final positions.',
          ] },
          { kind: 'safety', md: 'Most CCTV injuries are falls, not shocks. Use a stable platform, keep your hips inside the ladder rails, and have someone with you when you work at height. Isolate the supply before you touch any camera wiring.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm5-lo1-q1', competency: 'Demonstrate the procedure in CCTV system installation.',
          stem: 'A camera is mounted high on a wall, above head height, looking down at a doorway. What is the likely complaint?',
          options: [
            'The picture will be too bright',
            'Faces will not be identifiable, because the camera sees the tops of heads',
            'The cable run will be too long',
            'The recorder will fill too quickly',
          ],
          answer: 1,
          rationale: [
            'Height does not set exposure. What is behind the subject does.',
            'Correct. A camera mounted well above head height records hats and shoulders. Identification needs the camera near face height on the approach.',
            'Height adds very little to a cable run.',
            'Retention depends on disk size, camera count and quality, not on mounting height.',
          ] },
        { kind: 'mcq', id: 'm5-lo1-q2', competency: 'Demonstrate the procedure in CCTV system installation.',
          stem: 'Four cameras share one power supply and the picture on all four breaks up at night. What should you suspect first?',
          options: [
            'All four cameras have failed together',
            'The supply cannot hold its voltage once the night-time infrared load comes on',
            'The recorder disk is full',
            'The monitor input is faulty',
          ],
          answer: 1,
          rationale: [
            'Four simultaneous identical failures is far less likely than one shared cause.',
            'Correct. Infrared illuminators draw much more current after dark, and an undersized shared supply sags exactly then.',
            'A full disk overwrites old footage. It does not break up a live picture.',
            'A faulty monitor input would affect what is displayed, not all four pictures at a particular time of day.',
          ] },
        { kind: 'order', id: 'm5-lo1-q3', competency: 'Demonstrate the procedure in CCTV system installation.',
          stem: 'Arrange the installation steps in the correct order.',
          steps: [
            'Agree in writing what the system must see',
            'Walk the site and choose camera positions',
            'Plan cable routes that stay dry and reachable',
            'Mount the cameras and run the cable',
            'Terminate and weatherproof every joint',
            'Power up, aim against the plan, and record the positions',
          ] },
      ],
    },
    {
      id: 'lo2',
      title: 'Perform CCTV system servicing',
      lessons: [{
        id: 'l1',
        title: 'Finding which part of the chain is broken',
        blocks: [
          { kind: 'text', md: 'A CCTV fault is nearly always in one link of a chain you already know: camera, cable and connectors, recorder, monitor. The useful question is not what is broken but where the picture stops, and every test you run should move that boundary.' },
          { kind: 'text', md: 'One camera dark while the others are fine tells you the fault is in that camera path, not in the recorder or the monitor. All cameras dark tells you the opposite. Getting that distinction right before you climb a ladder saves most of the job.' },
          { kind: 'interactive', simId: 'troubleshoot', config: { scenario: 'cctv' } },
          { kind: 'note', md: 'Outdoor connectors are where most CCTV faults live. Water gets into a joint that was never properly sealed, corrodes the centre pin, and produces a picture that works in dry weather and fails in the rain. Always open the connector and look.' },
          { kind: 'safety', md: 'Isolate the camera supply before disconnecting anything, and never work at height alone. A fall from a two metre ladder does more harm than any voltage in this system.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm5-lo2-q1', competency: 'Perform CCTV system servicing.',
          stem: 'One camera of four is black and the other three are normal. What does that rule out immediately?',
          options: [
            'The camera itself',
            'The recorder and the monitor',
            'The cable to that camera',
            'The connector at that camera',
          ],
          answer: 1,
          rationale: [
            'The camera is one of the things still in scope, not ruled out.',
            'Correct. Both are shared by all four channels, so a fault in either would affect more than one camera.',
            'That cable serves only the dark camera, so it stays in scope.',
            'That connector serves only the dark camera, so it stays in scope.',
          ] },
        { kind: 'truefalse', id: 'm5-lo2-q2', competency: 'Perform CCTV system servicing.',
          stem: 'A camera that works in dry weather and fails in the rain most likely has a water damaged connector.',
          answer: true,
          rationale: 'Yes. A fault that tracks the weather is a fault that water reaches. The usual place is an outdoor joint that was never properly sealed, where corrosion on the centre pin makes contact that comes and goes.' },
        { kind: 'order', id: 'm5-lo2-q3', competency: 'Perform CCTV system servicing.',
          stem: 'Arrange the steps for finding why one camera shows no picture.',
          steps: [
            'Confirm the other cameras are normal',
            'Isolate the camera supply',
            'Check the voltage at the camera end',
            'Open and inspect the connector at the camera',
            'Test the cable run',
            'Substitute a camera known to be working',
          ] },
      ],
    },
  ],
}
```

- [ ] **Step 2: Register it**

In `src/content/index.ts`, import `m5` and change the array to `[m1, m2, m3, m4, m5]`.

- [ ] **Step 3: Verify**

```bash
grep -c "Demonstrate the procedure in CCTV system installation." src/content/m5.ts
grep -c "Perform CCTV system servicing." src/content/m5.ts
grep -c "—" src/content/m5.ts
```
First two at least 1, third 0.

Run: `npx tsc -b`, `npm run build`, `npm test` → 82 passing.

- [ ] **Step 4: Commit**

```bash
git add src/content/m5.ts src/content/index.ts
git commit -m "content: add Module 5, CCTV systems"
```

---

### Task 6: Module 6, fire alarm principles and installation

**Files:**
- Create: `src/content/m6.ts`
- Modify: `src/content/index.ts`

**Interfaces:**
- Consumes: `Module` from `src/lib/types`
- Produces: `m6: Module`, registered in `MODULES`

Competency strings verbatim from source lines 407 and 408.

- [ ] **Step 1: Write src/content/m6.ts**

```ts
import type { Module } from '../lib/types'

export const m6: Module = {
  id: 'm6',
  week: 'Week 7',
  title: 'Fire Alarm Principles and Installation',
  tint: 'm6',
  teacherReviewed: false,
  competencies: [
    'Discuss the principles of fire alarm systems.',
    'Perform the procedure in fire alarm system installation.',
  ],
  outcomes: [
    {
      id: 'lo1',
      title: 'Discuss the principles of fire alarm systems',
      lessons: [{
        id: 'l1',
        title: 'How a fire alarm knows and how it tells',
        blocks: [
          { kind: 'text', md: 'A fire alarm system does two things. It notices, through detectors and manual call points, and it warns, through sounders and strobes. A control panel sits between them, watching every zone and deciding what happens when one of them activates.' },
          { kind: 'interactive', simId: 'sequence', config: { activity: 'fas-signal' } },
          { kind: 'table',
            headers: ['Device', 'What it responds to', 'Where it belongs'],
            rows: [
              ['Smoke detector', 'Smoke particles in the chamber', 'Escape routes, corridors, sleeping areas'],
              ['Heat detector', 'Temperature, or a fast rise in it', 'Kitchens and garages, where smoke is normal'],
              ['Manual call point', 'A person deciding to raise the alarm', 'On every exit route, at a height anyone can reach'],
              ['Sounder', 'The panel telling it to sound', 'Everywhere the alarm must be heard, including bathrooms'],
              ['Control panel', 'Every zone, all the time', 'Near the main entrance, where the fire service will look'],
            ] },
          { kind: 'text', md: 'The panel does not only watch for fire. It watches the wiring itself. A conventional zone carries an end of line resistor at the last device, and the panel reads that standing resistance continuously. Break the wire and the resistance goes open, so the panel reports a fault. Short the wire and the resistance goes to zero, so the panel reports an alarm. That is why a fire alarm can tell the difference between a fire and a broken cable, and why the end of line resistor is not optional.' },
          { kind: 'note', md: 'A heat detector in a kitchen is not a downgrade. A smoke detector there would go off every time someone fries fish, and a system people disable is worse than no system.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm6-lo1-q1', competency: 'Discuss the principles of fire alarm systems.',
          stem: 'Why does a conventional zone need an end of line resistor?',
          options: [
            'It limits the current through the detectors',
            'It gives the panel a standing resistance to monitor, so a break reads as a fault',
            'It powers the last detector on the zone',
            'It makes the sounders louder',
          ],
          answer: 1,
          rationale: [
            'Detector current is set by the panel and the devices, not by the end of line resistor.',
            'Correct. The panel watches that resistance continuously, so an open wire reads as a fault and a short reads as an alarm.',
            'Detectors are powered from the zone pair, not by the resistor.',
            'Sounders are on their own circuit and the resistor has no effect on them.',
          ] },
        { kind: 'mcq', id: 'm6-lo1-q2', competency: 'Discuss the principles of fire alarm systems.',
          stem: 'Which detector belongs in a kitchen?',
          options: [
            'A smoke detector, because kitchens are high risk',
            'A heat detector, because normal cooking would set off a smoke detector',
            'No detector, because kitchens are always occupied',
            'A manual call point only',
          ],
          answer: 1,
          rationale: [
            'The risk is real, but a detector that cries wolf gets disabled, and a disabled detector protects nobody.',
            'Correct. A heat detector ignores cooking smoke and still responds to an actual fire.',
            'A kitchen is one of the likeliest places for a fire to start and must be covered.',
            'A call point needs a person present and deciding. It is not detection.',
          ] },
        { kind: 'truefalse', id: 'm6-lo1-q3', competency: 'Discuss the principles of fire alarm systems.',
          stem: 'A short circuit across a conventional zone makes the panel report a fault.',
          answer: false,
          rationale: 'It reports an alarm, not a fault. A detector activating is exactly a short across the zone, so the panel cannot tell an accidental short from a real activation. An open circuit is what reads as a fault.' },
      ],
    },
    {
      id: 'lo2',
      title: 'Perform the procedure in fire alarm system installation',
      lessons: [{
        id: 'l1',
        title: 'Installing a zone that the panel will trust',
        blocks: [
          { kind: 'safety', md: 'Tell the responsible person before you put any part of a fire alarm out of service, isolate the sounders so testing does not evacuate the building, and never leave a system disabled at the end of a day without telling someone in writing.' },
          { kind: 'text', md: 'Installation is mostly about making a circuit the panel can monitor honestly. Devices go in order along the zone, the end of line resistor goes at the last one and nowhere else, and every joint is made in an enclosure that can be found again.' },
          { kind: 'steps', items: [
            'Plan the zone so every device on it is in one identifiable area of the building.',
            'Run the cable in order, device to device, without spurs.',
            'Fit each base, keeping the wiring polarity consistent all the way along.',
            'Fit the end of line resistor at the last device on the zone.',
            'Fit the heads, check each one latches, and label every device with its position.',
            'Test each device in turn from the panel and record the result against the device list.',
          ] },
          { kind: 'note', md: 'Fitting the end of line resistor at the panel instead of the last device makes the panel read a healthy zone that it is not actually monitoring. Everything downstream could be cut and the panel would never know.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm6-lo2-q1', competency: 'Perform the procedure in fire alarm system installation.',
          stem: 'What is wrong with fitting the end of line resistor inside the panel?',
          options: [
            'It is harder to reach later',
            'The panel then reads a healthy zone whether or not the wiring beyond it is intact',
            'It draws too much current',
            'It makes the zone respond too slowly',
          ],
          answer: 1,
          rationale: [
            'Access is a nuisance, not the reason it is dangerous.',
            'Correct. The resistor is what the panel monitors, so putting it at the panel means the entire zone could be cut with no fault shown.',
            'The current through an end of line resistor is tiny wherever it sits.',
            'Position does not affect response time.',
          ] },
        { kind: 'truefalse', id: 'm6-lo2-q2', competency: 'Perform the procedure in fire alarm system installation.',
          stem: 'You may leave a fire alarm zone isolated overnight if you plan to finish the work tomorrow.',
          answer: false,
          rationale: 'Not without telling the responsible person in writing and agreeing what protects that area meanwhile. An isolated zone is an unprotected area, and the people sleeping in it do not know.' },
        { kind: 'order', id: 'm6-lo2-q3', competency: 'Perform the procedure in fire alarm system installation.',
          stem: 'Arrange the steps for installing a conventional zone.',
          steps: [
            'Plan the zone to cover one identifiable area',
            'Run the cable device to device, without spurs',
            'Fit each base with consistent polarity',
            'Fit the end of line resistor at the last device',
            'Fit and latch the heads, and label each position',
            'Test each device from the panel and record the result',
          ] },
      ],
    },
  ],
}
```

- [ ] **Step 2: Register it**

In `src/content/index.ts`, import `m6` and change the array to `[m1, m2, m3, m4, m5, m6]`.

- [ ] **Step 3: Verify**

```bash
grep -c "Discuss the principles of fire alarm systems." src/content/m6.ts
grep -c "Perform the procedure in fire alarm system installation." src/content/m6.ts
grep -c "—" src/content/m6.ts
```
First two at least 1, third 0.

Run: `npx tsc -b`, `npm run build`, `npm test` → 82 passing.

- [ ] **Step 4: Commit**

```bash
git add src/content/m6.ts src/content/index.ts
git commit -m "content: add Module 6, fire alarm principles and installation"
```

---

### Task 7: Module 7, fire alarm servicing and audio introduction

**Files:**
- Create: `src/content/m7.ts`
- Modify: `src/content/index.ts`

**Interfaces:**
- Consumes: `Module` from `src/lib/types`
- Produces: `m7: Module`, registered in `MODULES`

Competency strings verbatim from source lines 441 and 444.

- [ ] **Step 1: Write src/content/m7.ts**

```ts
import type { Module } from '../lib/types'

export const m7: Module = {
  id: 'm7',
  week: 'Week 8',
  title: 'Fire Alarm Servicing and Audio Introduction',
  tint: 'm7',
  teacherReviewed: false,
  competencies: [
    'Perform the procedure in fire alarm system servicing.',
    'Discuss audio products and systems.',
  ],
  outcomes: [
    {
      id: 'lo1',
      title: 'Perform the procedure in fire alarm system servicing',
      lessons: [{
        id: 'l1',
        title: 'Reading what the panel is telling you',
        blocks: [
          { kind: 'safety', md: 'Before any servicing, tell the responsible person, isolate the sounders so a test does not evacuate the building, and write down the time each zone goes out of service. Stay with the system until every zone is back in service, and never go home leaving one disabled without a signed handover.' },
          { kind: 'text', md: 'The panel has already done most of the diagnosis for you. A fault on one zone means the resistance it monitors has gone open, so the break is in that zone, between the panel and the end of line resistor. Your job is to find where along that path it stopped.' },
          { kind: 'text', md: 'Work outward from the panel, halving the zone as you go. Measure at the panel, then at the first junction, then further along, and each measurement tells you which side of that point the break is on. That is far quicker than opening every device in order.' },
          { kind: 'interactive', simId: 'troubleshoot', config: { scenario: 'fas-zone' } },
          { kind: 'table',
            headers: ['What the panel shows', 'What it means', 'Where to look'],
            rows: [
              ['Fault on one zone', 'That zone reads open', 'A break, a loose terminal, or a missing end of line resistor'],
              ['Fault on every zone', 'Something common has failed', 'Panel supply, standby battery, or the panel itself'],
              ['Alarm with no fire', 'That zone reads shorted', 'A wet or damaged device, or a pinched cable'],
              ['One device not responding', 'That device alone is not making the circuit', 'A head not latched, or a failed head'],
            ] },
          { kind: 'note', md: 'A missing end of line resistor and a broken wire look identical at the panel. Both read open. The difference shows up when you measure at the last device: the resistor is either there or it is not.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm7-lo1-q1', competency: 'Perform the procedure in fire alarm system servicing.',
          stem: 'The panel reports a fault on zone 2 only. What does that tell you?',
          options: [
            'The panel itself has failed',
            'The circuit zone 2 monitors has gone open somewhere between the panel and the end of line resistor',
            'A detector on zone 2 has activated',
            'The standby battery is flat',
          ],
          answer: 1,
          rationale: [
            'A panel fault would show on every zone, not one.',
            'Correct. A fault on a single zone is that zone reading open, and the break is somewhere along its path.',
            'An activation reads as a short, which the panel reports as an alarm, not a fault.',
            'A flat battery is a common fault affecting the whole panel, not one zone.',
          ] },
        { kind: 'mcq', id: 'm7-lo1-q2', competency: 'Perform the procedure in fire alarm system servicing.',
          stem: 'You find the zone reads open at the panel and open at the first junction, but correct at the last device. Where is the break?',
          options: [
            'Between the last device and the end of line resistor',
            'Between the panel and the first junction',
            'Inside the panel',
            'There is no break',
          ],
          answer: 1,
          rationale: [
            'The last device reads correctly, so everything from there back through the resistor is intact.',
            'Correct. The reading is bad at the panel and at the first junction but good further along, so the break is in the section you have not yet proved, between the panel and that junction.',
            'A panel fault would not clear when you measure further along the zone.',
            'A zone reading open at two points is a break.',
          ] },
        { kind: 'truefalse', id: 'm7-lo1-q3', competency: 'Perform the procedure in fire alarm system servicing.',
          stem: 'A missing end of line resistor and a broken zone wire look the same at the panel.',
          answer: true,
          rationale: 'They do. Both make the zone read open, so the panel reports the same fault for either. Only a measurement at the last device separates them.' },
      ],
    },
    {
      id: 'lo2',
      title: 'Discuss audio products and systems',
      lessons: [{
        id: 'l1',
        title: 'What a sound system is made of',
        blocks: [
          { kind: 'text', md: 'A sound system moves one thing along a chain, and every part of that chain either changes the signal on purpose or leaves it alone. Sound goes into a microphone and becomes a small electrical signal. A mixer combines and shapes it. An amplifier makes it powerful enough to move a cone. A speaker turns it back into sound.' },
          { kind: 'table',
            headers: ['Stage', 'What it does', 'Its usual fault'],
            rows: [
              ['Microphone', 'Turns sound into a very small signal', 'Damaged cable at the connector, from being pulled'],
              ['Mixer', 'Combines sources and sets levels', 'A channel left muted, or gain set far too high'],
              ['Amplifier', 'Raises the signal enough to drive a speaker', 'Protection cuts in from a shorted speaker line'],
              ['Speaker', 'Turns the signal back into sound', 'A blown driver from long term overdriving'],
              ['Cabling', 'Carries the signal between stages', 'Intermittent joints, especially at plugs'],
            ] },
          { kind: 'text', md: 'Two ideas explain most of what goes wrong. Gain structure means setting each stage so it passes a healthy signal without pushing the next one into distortion, and most bad sound is a gain set wrong somewhere earlier in the chain. Feedback is the howl you get when a microphone hears its own speaker, and it is fixed by moving or aiming, not by turning things down.' },
          { kind: 'note', md: 'Before diagnosing a fault, check what is muted. A muted channel, a wrong input selected, and a speaker unplugged account for more silent systems than every genuine electronic failure put together.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm7-lo2-q1', competency: 'Discuss audio products and systems.',
          stem: 'A public address system howls whenever the speaker is turned up. What is the cause?',
          options: [
            'The amplifier is faulty',
            'The microphone is hearing the speaker, so the signal goes round the loop',
            'The speaker cable is too long',
            'The mixer channel is muted',
          ],
          answer: 1,
          rationale: [
            'The amplifier is doing exactly what it is asked to do.',
            'Correct. That is feedback. The cure is to move or aim the microphone and the speaker so one does not hear the other.',
            'Cable length affects losses, not feedback.',
            'A muted channel produces silence, not a howl.',
          ] },
        { kind: 'mcq', id: 'm7-lo2-q2', competency: 'Discuss audio products and systems.',
          stem: 'A system sounds distorted at every volume setting. Where should you look first?',
          options: [
            'The speaker',
            'The gain structure, starting at the first stage the signal enters',
            'The mains supply',
            'The room acoustics',
          ],
          answer: 1,
          rationale: [
            'A blown driver distorts, but distortion at every level usually arrives already in the signal.',
            'Correct. If a stage early in the chain is overdriven, everything after it faithfully reproduces that distortion, so turning down later changes nothing.',
            'A supply problem usually shows as hum or as the unit shutting down.',
            'Room acoustics change tone and clarity, not distortion at every level.',
          ] },
        { kind: 'truefalse', id: 'm7-lo2-q3', competency: 'Discuss audio products and systems.',
          stem: 'Before diagnosing a silent audio system, it is worth checking for a muted channel or a wrong input.',
          answer: true,
          rationale: 'Always. A muted channel, a wrong input selected and an unplugged speaker account for more silent systems than genuine electronic faults do, and all three take seconds to rule out.' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Register it**

In `src/content/index.ts`, import `m7` and change the array to `[m1, m2, m3, m4, m5, m6, m7]`.

- [ ] **Step 3: Verify**

```bash
grep -c "Perform the procedure in fire alarm system servicing." src/content/m7.ts
grep -c "Discuss audio products and systems." src/content/m7.ts
grep -c "—" src/content/m7.ts
```
First two at least 1, third 0.

Run: `npx tsc -b`, `npm run build`, `npm test` → 82 passing.

- [ ] **Step 4: Walk the whole thing in a browser**

Run `npm run dev` and confirm each, reporting what you actually saw:
- The module map shows seven tiles in seven different tints
- `/#/m/m5/lo/lo1` renders the CCTV signal chain, and the pool shrinks as blocks are placed
- Placing the four blocks in the wrong order and checking marks the wrong positions in caution and names the correct path
- `/#/m/m5/lo/lo2` renders the troubleshooter with the CCTV scenario, and inspecting the connector reports corrosion
- `/#/m/m6/lo/lo1` renders the fire alarm signal chain
- `/#/m/m7/lo/lo1` renders the troubleshooter with the fire alarm zone scenario, and the panel terminals read OL
- Reloading keeps all progress, and the map shows partial progress on m5, m6 and m7

- [ ] **Step 5: Commit**

```bash
git add src/content/m7.ts src/content/index.ts
git commit -m "content: add Module 7, fire alarm servicing and audio introduction"
```

---

## Self-Review

**Spec coverage for this plan.** The third light-interactive engine named in the spec, Tasks 1 to 3, built as a third UI over the Plan 3 scorer rather than a fourth engine. Modules 5, 6 and 7 with competencies quoted verbatim, Tasks 5 to 7. Two more troubleshooter scenarios as data, Task 4. Of the four scenario-authoring hazards recorded in `CARRY-FORWARD.md`, all four are addressed explicitly in Task 4 step 4, including the lower-casing hazard which bites for the first time in this plan and drove the wording of every fault label.

Deliberately out of this plan: Modules 8 and 9, the remaining three scenarios, the assessment layer, the evaluation survey, the export, and PWA packaging. Also still deferred: the `Shape` polygon gap and the `Drawing` exhaustiveness guard, because no task here authors a diagram.

**Placeholder scan.** No TBDs. Every code step carries runnable code. Task 2 step 4 requires deliberately breaking the data to prove a guard bites, then reverting and confirming a clean tree before commit.

**Type consistency.** `SequenceActivityData` is defined once in Task 1 and imported unchanged in Task 2. `Activity` widens to three members in Task 1, and the two narrowing sites in `tests/activities.test.ts` are updated in the same task, which is what keeps the tree compiling. `scoreActivity` is unchanged and takes the same arguments from all three activity components. `Scenario` is the existing export, not redeclared. `Module`, `Block` and `QuizItem` are existing exports; Tasks 5 to 7 use only the `mcq`, `truefalse` and `order` quiz kinds and the `text`, `table`, `steps`, `safety`, `note` and `interactive` block kinds. The new `simId` value `'sequence'` does not collide with `multimeter`, `psu`, `troubleshoot`, `match` or `hotspot`.

**Test counts.** The branch starts at 80. Task 1 adds 2, reaching 82. Tasks 2 to 7 add none, by design: they are UI and data, which the spec excludes from unit testing, and Task 7 closes with a manual walkthrough instead.
