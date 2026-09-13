# EPAS Performance Tasks and Labs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture the practical half of the course, the eight Budget of Work performance tasks, and open the simulation gallery the navigation has been promising since the first plan.

**Architecture:** The eight tasks are typed data in `src/content/tasks/`, rendered by one screen at `/tasks/:taskId`, with ticks and notes held in a new `tasks` record on the store. `/labs` is a grid over the existing `SIMS` registry and `/labs/:simId` mounts one full screen, so adding a simulation still means one registry entry and nothing else. The export gains a column group per task, five engagement columns, and a separate rubric scoring sheet the teacher fills in by hand.

**Tech Stack:** Vite, React 19, TypeScript (strict), React Router (`createHashRouter`), Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` (sections 7 and 8 bind this plan)

**Prior plans:** foundation-and-m1, flagship-sims-m2-m3, activities-m4, sequence-m5-m7, m8-m9, assessment, research-output. All merged. Deferred items in `docs/superpowers/plans/CARRY-FORWARD.md`, two of which this plan closes.

## Global Constraints

- **The consent rule must not be touched.** `src/lib/merge.ts` decides who reaches the merged table. It broke three times on the previous branch, every time in glue code around it rather than in the rule. Any new export column is added to `csvRow`, never by changing who gets a row.
- **No em dashes, en dashes or horizontal bars** in any user-visible copy.
- **`var(--danger)` is reserved for physical safety hazards.** The task sheets DO carry real hazards, so this is the one plan where it belongs; use it for safety callouts and nowhere else.
- **Trace the power state of every procedure step by step as you write it.** A step list that isolates the supply and then requires a live measurement is impossible to perform. This shipped six times across five plans. Every transition must be named in the step text itself.
- All `localStorage` access goes through `src/lib/store.ts`. `schemaVersion` stays 1; the new field is additive and optional.
- Logic goes in pure, total, unit-tested functions under `src/lib/`. The UI is not unit-tested; it is checked in a browser.
- TypeScript strict, including `noUnusedLocals`, `noUnusedParameters` and `noUncheckedIndexedAccess`.
- No new dependencies. `createHashRouter` with Vite `base: './'`.
- `src/lib/diagnose.ts` is frozen.

## Design decisions this plan locks in

**The rubric is not scored by the app.** A performance task is judged by a teacher watching a student work at a bench. The app shows the rubric from the start so the student knows what they are being judged on, records which steps they ticked and what they noted, and exports a scoring sheet with a blank score column. Inventing a score from ticked checkboxes would produce a number that looks like an assessment and is not one.

**Ticks are the student's own record, not evidence.** A student can tick a step they did not do. That is fine and it is why ticks are exported as engagement rather than as achievement, and why the codebook says so in those words. The teacher's rubric score is the assessment.

**`/labs` runs a simulation with no lesson around it.** The same component, mounted standalone. Runs started from Labs are recorded like any other, because a student practising the multimeter is engagement and the export reports engagement separately from the pre and post tests, which are the only thing a gain is computed from.

**`/tools` and `/settings` are not built, and should leave the spec.** Section 7 lists both. Nothing in the app needs a calculator screen, and the two things a settings screen would hold already exist: the participant switch on the module map and the consent choice. A route list that promises screens indefinitely is worse than a shorter honest one. Task 8 removes them from the spec and says why.

---

## File Structure

**Create:**

| File | Responsibility |
|---|---|
| `src/content/tasks/index.ts` | `TASKS` registry and `getTask(id)` |
| `src/content/tasks/t1.ts` .. `t8.ts` | One Budget of Work performance task each |
| `src/routes/TaskSheet.tsx` | The `/tasks/:taskId` screen |
| `src/routes/Labs.tsx` | The `/labs` gallery and the `/labs/:simId` full screen |
| `tests/tasks.test.ts` | Guard suite over the eight task sheets |

**Modify:**

| File | Change |
|---|---|
| `src/lib/types.ts` | Add `RubricRow` and `PerformanceTask` |
| `src/lib/store.ts` | Add `tasks` to `StoreV1`, plus `taskProgress`, `setTaskProgress` |
| `src/lib/export.ts` | Task columns, engagement columns, `rubricRows` |
| `src/routes/Teacher.tsx` | A third download, the rubric scoring sheet |
| `src/routes/ModuleOverview.tsx` | Link to a module's performance task where it has one |
| `src/App.tsx` | Routes for `/tasks/:taskId`, `/labs`, `/labs/:simId` |
| `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` | Strike `/tools` and `/settings` from section 7 |

---

### Task 1: The task sheet model and its store

Types, the store record, and the guard suite, before any of the eight sheets exist. The suite comes first for the same reason it did in the assessment plan: eight sheets authored against a suite that is already watching is eight sheets whose mistakes are build failures rather than something a reviewer has to notice.

**Files:**
- Create: `src/content/tasks/index.ts`, `tests/tasks.test.ts`
- Modify: `src/lib/types.ts`, `src/lib/store.ts`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `RubricRow`, `PerformanceTask` (in `types.ts`); `TASKS: PerformanceTask[]`, `getTask(id)` (in `content/tasks/index.ts`); `TaskProgress`, `taskProgress(taskId)`, `setTaskProgress(taskId, progress)` (in `store.ts`).

- [ ] **Step 1: Add the types**

Append to `src/lib/types.ts`:

```ts
/** One line of a performance task rubric, scored by the teacher, not the app. */
export interface RubricRow {
  criterion: string
  /** What full marks looks like, shown to the student from the start. */
  descriptor: string
  points: number
}

/**
 * One Budget of Work performance task. `brief` is quoted from the Budget of
 * Work rather than paraphrased, because the task is the curriculum's and a
 * student should be able to match what they read here to what their teacher
 * was given.
 */
export interface PerformanceTask {
  id: string
  kind: 'individual' | 'group'
  title: string
  /** Quoted from the Budget of Work. */
  brief: string
  /** Modules whose lessons prepare a student for this task. */
  modules: string[]
  safety: string[]
  steps: string[]
  rubric: RubricRow[]
}
```

- [ ] **Step 2: Add the store record**

In `src/lib/store.ts`, add the field to `StoreV1`. It is optional, so a payload written before this plan loads unchanged and `schemaVersion` stays 1:

```ts
export interface StoreV1 {
  schemaVersion: 1
  participant: { code: string; name?: string; consentedAt?: string; research?: boolean }
  modules: Record<string, ModuleProgress>
  attempts: Attempt[]
  sims: SimRecord[]
  survey?: Record<string, number | string>
  tasks?: Record<string, TaskProgress>
}
```

and above it:

```ts
/**
 * What a student recorded against one performance task. Ticks are the
 * student's own record of what they did, not evidence that they did it: a
 * student can tick a step they skipped. The teacher's rubric score is the
 * assessment, and the export labels these as engagement for that reason.
 */
export interface TaskProgress {
  /** Indices of the steps the student has ticked. */
  checked: number[]
  notes?: string
  /** When the sheet was last touched. */
  at?: string
}
```

- [ ] **Step 3: Write the failing store tests**

Add `taskProgress` and `setTaskProgress` to the existing `../src/lib/store` import in `tests/store.test.ts`, then append:

```ts
describe('performance task progress', () => {
  beforeEach(() => localStorage.clear())

  it('starts with nothing ticked', () => {
    expect(taskProgress('t1')).toEqual({ checked: [] })
  })

  it('keeps what was ticked', () => {
    setTaskProgress('t1', { checked: [0, 2] })
    expect(taskProgress('t1').checked).toEqual([0, 2])
  })

  it('keeps each task separate', () => {
    setTaskProgress('t1', { checked: [0] })
    setTaskProgress('t2', { checked: [1, 2] })
    expect(taskProgress('t1').checked).toEqual([0])
    expect(taskProgress('t2').checked).toEqual([1, 2])
  })

  it('stamps when the sheet was last touched', () => {
    setTaskProgress('t1', { checked: [0] })
    expect(taskProgress('t1').at).toBeDefined()
  })

  it('drops a blank note rather than storing an empty string', () => {
    setTaskProgress('t1', { checked: [], notes: '   ' })
    expect(taskProgress('t1').notes).toBeUndefined()
  })

  it('replaces rather than merging, so unticking actually unticks', () => {
    setTaskProgress('t1', { checked: [0, 1, 2] })
    setTaskProgress('t1', { checked: [0] })
    expect(taskProgress('t1').checked).toEqual([0])
  })

  it('is cleared when the device is handed to a new participant', () => {
    setTaskProgress('t1', { checked: [0] })
    resetAll()
    expect(taskProgress('t1')).toEqual({ checked: [] })
  })
})
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run tests/store.test.ts`
Expected: FAIL, `taskProgress is not defined`.

- [ ] **Step 5: Add the store functions**

Append to `src/lib/store.ts`:

```ts
export function taskProgress(taskId: string): TaskProgress {
  return loadState().tasks?.[taskId] ?? { checked: [] }
}

/**
 * Replaces one task's record. Replace rather than merge, or unticking a step
 * would leave it ticked, which is the sort of thing a student would notice
 * only after handing in.
 */
export function setTaskProgress(taskId: string, progress: TaskProgress): void {
  update(s => {
    const notes = progress.notes?.trim()
    const kept: TaskProgress = {
      checked: [...progress.checked].sort((a, b) => a - b),
      at: new Date().toISOString(),
    }
    if (notes) kept.notes = notes
    s.tasks = { ...(s.tasks ?? {}), [taskId]: kept }
  })
}
```

- [ ] **Step 6: Create the registry**

Create `src/content/tasks/index.ts`. It starts empty apart from its shape; Tasks 2 to 5 add the eight sheets:

```ts
import type { PerformanceTask } from '../../lib/types'

/**
 * The eight Budget of Work performance tasks, in the order the course meets
 * them. Alternating individual and group is the Budget of Work's own pattern,
 * not ours.
 */
export const TASKS: PerformanceTask[] = []

export function getTask(id: string): PerformanceTask | undefined {
  return TASKS.find(t => t.id === id)
}
```

- [ ] **Step 7: Write the guard suite**

Create `tests/tasks.test.ts`. Note the `TASKS.length` assertion is deliberately `toBeGreaterThanOrEqual(0)` until Task 5 pins it at eight; every other test iterates, so an empty registry passes them vacuously and that is fine while the sheets are being written:

```ts
import { describe, expect, it } from 'vitest'
import { TASKS, getTask } from '../src/content/tasks'
import { allModules } from '../src/content'

const moduleIds = new Set(allModules().map(m => m.id))

describe('the performance tasks', () => {
  it('has a registry', () => {
    expect(TASKS.length).toBeGreaterThanOrEqual(0)
  })

  it('gives every task a unique id', () => {
    const ids = TASKS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every id through getTask', () => {
    for (const t of TASKS) expect(getTask(t.id)?.id).toBe(t.id)
  })

  it('names only modules that exist', () => {
    for (const t of TASKS) {
      expect(t.modules.length, t.id).toBeGreaterThan(0)
      for (const m of t.modules) expect(moduleIds.has(m), `${t.id} names ${m}`).toBe(true)
    }
  })

  it('gives every task safety lines, steps and a rubric', () => {
    for (const t of TASKS) {
      expect(t.safety.length, t.id).toBeGreaterThanOrEqual(2)
      expect(t.steps.length, t.id).toBeGreaterThanOrEqual(5)
      expect(t.rubric.length, t.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('makes every safety line distinct within a task', () => {
    for (const t of TASKS) expect(new Set(t.safety).size, t.id).toBe(t.safety.length)
  })

  it('makes every step distinct within a task', () => {
    for (const t of TASKS) expect(new Set(t.steps).size, t.id).toBe(t.steps.length)
  })

  // A rubric a student cannot total is a rubric they cannot aim at.
  it('gives every rubric a whole number total', () => {
    for (const t of TASKS) {
      const total = t.rubric.reduce((n, r) => n + r.points, 0)
      expect(Number.isInteger(total), `${t.id} totals ${total}`).toBe(true)
      expect(total, t.id).toBeGreaterThan(0)
      for (const r of t.rubric) expect(r.points, `${t.id}: ${r.criterion}`).toBeGreaterThan(0)
    }
  })

  it('never repeats a rubric criterion within a task', () => {
    for (const t of TASKS) {
      const names = t.rubric.map(r => r.criterion)
      expect(new Set(names).size, t.id).toBe(names.length)
    }
  })

  it('uses no long dashes in anything a student reads', () => {
    for (const t of TASKS) {
      const copy = [t.title, t.brief, ...t.safety, ...t.steps,
        ...t.rubric.flatMap(r => [r.criterion, r.descriptor])].join(' ')
      expect(/[–—―]/.test(copy), t.id).toBe(false)
    }
  })

  it('uses only the two kinds the Budget of Work uses', () => {
    for (const t of TASKS) expect(['individual', 'group'], t.id).toContain(t.kind)
  })
})
```

- [ ] **Step 8: Run the suite**

Run: `npx vitest run tests/tasks.test.ts`
Expected: PASS, 11 tests, most of them vacuously while the registry is empty.

- [ ] **Step 9: Typecheck and run the whole suite**

Run: `npx tsc -b --force && npm test`
Expected: `tsc` exits 0. All tests pass; the suite grows from 233 to 251.

- [ ] **Step 10: Commit**

```bash
git add src/lib/types.ts src/lib/store.ts src/content/tasks tests/tasks.test.ts tests/store.test.ts
git commit -m "feat: add the performance task model and its store"
```

---

### Task 2: The two Module 2 assembly tasks

The first two Budget of Work performance tasks, both on the bench in Module 2. `brief` is quoted from the Budget of Work; do not paraphrase it.

**Power state, traced for both.** t1 names its transitions at step 5 (meter connected, then power applied) and step 7 (unplugged and discharged). t2 names them at step 5 and step 7 likewise. No step requires a live measurement while the supply is isolated, and no step reaches into a powered board.

**Files:**
- Create: `src/content/tasks/t1.ts`, `src/content/tasks/t2.ts`
- Modify: `src/content/tasks/index.ts`

**Interfaces:**
- Consumes: `PerformanceTask` from `src/lib/types.ts`.
- Produces: `t1`, `t2`, both `PerformanceTask`.

- [ ] **Step 1: Write `src/content/tasks/t1.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t1: PerformanceTask = {
  id: 't1',
  kind: 'individual',
  title: 'Assembly and testing of a regulated DC power supply',
  brief:
    'The learner individually assembles a basic regulated DC power supply (transformer, rectifier, filter capacitor, voltage regulator IC, and output terminals) on a project board or PCB, then tests the output voltage and checks for proper component functionality using a multimeter, following standard electronic assembly and safety procedures.',
  modules: ['m1', 'm2'],
  safety: [
    'The transformer primary is at mains potential. Keep the primary side covered, and never work on it while the supply is plugged in.',
    'The filter capacitor holds its charge after the supply is unplugged. Discharge it through a bleeder resistor and confirm with a meter that it reads close to zero volts before you touch the board.',
    'Connect your meter before you apply power, never after. Reaching into a live board to clip a probe on is how people get hurt.',
    'The regulator gets hot once the output is loaded. Check its heatsink is fitted before you load it, and let it cool before you touch it.',
  ],
  steps: [
    'Check the schematic against the parts you were given, and confirm the regulator is rated for the output voltage the task asks for.',
    'Lay the components out on the board unpowered, and check which way round the rectifier diodes and the filter capacitor go before you solder anything.',
    'Solder the components, heating the pad and the lead together so the solder wets both surfaces.',
    'With the supply still unplugged, look for solder bridges and measure continuity from the regulator output to the output terminals.',
    'Clip your meter to the output terminals on DC volts, and only then plug the transformer in.',
    'Read the output voltage and confirm its polarity matches the markings on the terminals.',
    'Unplug the supply, discharge the filter capacitor and confirm it reads close to zero volts, then connect the load the task specifies and plug in again to read the output, because a regulator that holds its voltage with nothing drawing from it can still sag once it is loaded.',
    'Unplug the supply again, discharge the filter capacitor through a bleeder resistor, and confirm with the meter across the capacitor terminals, not at the output, that it reads close to zero volts.',
    'Correct anything the readings showed, then repeat the powered test from step five.',
  ],
  rubric: [
    { criterion: 'Correct assembly', descriptor: 'Every component is in its right place and the right way round, with no solder bridges.', points: 6 },
    { criterion: 'Soldering quality', descriptor: 'Joints are shiny and fill the pad, with no cold or dry joints and no lifted pads.', points: 5 },
    { criterion: 'Correct output', descriptor: 'The output voltage and its polarity match the schematic within tolerance, and hold when the load is connected.', points: 5 },
    { criterion: 'Safe working', descriptor: 'The supply was isolated and the capacitor proved discharged before any contact with the board.', points: 4 },
  ],
}
```

- [ ] **Step 2: Write `src/content/tasks/t2.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t2: PerformanceTask = {
  id: 't2',
  kind: 'group',
  title: 'Electronic circuit assembly and functional testing project',
  brief:
    'In groups, learners assemble and test an electronic project (e.g., amplifier circuit, LED flasher, or regulated bench power supply) by interpreting the schematic diagram, properly mounting and soldering components, inspecting connections, and performing functional testing to ensure the circuit operates according to specifications and established standards.',
  modules: ['m1', 'm2'],
  safety: [
    'One person works on the board at a time. A second pair of hands on a live board is how a short becomes an injury.',
    'Connect the instruments before power goes on, and take power off before anyone touches the board again.',
    'Filter capacitors hold their charge after power is removed. Discharge them and prove them dead with a meter before working on the board.',
  ],
  steps: [
    'Read the schematic together and agree who mounts, who solders and who tests, so nobody is soldering a board another person has a probe on.',
    'Check every component against the parts list and set aside any that are the wrong value before anything is soldered.',
    'Mount and solder the components with the board unpowered, working from the shortest parts to the tallest.',
    'Inspect every joint under good light, and check continuity across the supply rails so that a bridge is found by you rather than by the power supply.',
    'Connect the test instruments first, then apply power for the first time with one person watching the current draw.',
    'Work through the functional tests the schematic calls for, and write each reading down as you take it rather than at the end.',
    'Take the power off and discharge the filter capacitors before anyone touches the board to correct something.',
    'Restore the power and repeat the functional tests after every correction, not only after the last one.',
  ],
  rubric: [
    { criterion: 'Reading the schematic', descriptor: 'The built circuit matches the schematic, including component values and orientation.', points: 5 },
    { criterion: 'Assembly and soldering', descriptor: 'Components are mounted neatly and every joint is sound.', points: 5 },
    { criterion: 'Functional testing', descriptor: 'The tests the schematic calls for are carried out and the readings are recorded as they are taken.', points: 5 },
    { criterion: 'Working as a group', descriptor: 'The work is shared, one person is on the board at a time, and every member can explain what the circuit does.', points: 5 },
  ],
}
```

- [ ] **Step 3: Register both**

In `src/content/tasks/index.ts`:

```ts
import type { PerformanceTask } from '../../lib/types'
import { t1 } from './t1'
import { t2 } from './t2'

export const TASKS: PerformanceTask[] = [t1, t2]

export function getTask(id: string): PerformanceTask | undefined {
  return TASKS.find(t => t.id === id)
}
```

- [ ] **Step 4: Run the guard suite**

Run: `npx vitest run tests/tasks.test.ts`
Expected: PASS, 11 tests, now covering two real sheets.

- [ ] **Step 5: Typecheck and run the whole suite**

Run: `npx tsc -b --force && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/tasks
git commit -m "feat: add the two module 2 performance tasks"
```

---

### Task 3: The appliance servicing tasks

Tasks three and four of eight. These are the first two that put a student inside a mains appliance, so the safety blocks carry real hazards rather than good practice.

**Power state, traced for both.** t3 isolates at step 2, works dead through step 5, names the restoration at step 7 and names the second isolation at step 8. t4 works on a battery unit, so the hazard is the cell rather than the mains; it names the charger isolation at step 2 and the re-energising at step 7.

**Files:**
- Create: `src/content/tasks/t3.ts`, `src/content/tasks/t4.ts`
- Modify: `src/content/tasks/index.ts`

**Interfaces:**
- Consumes: `PerformanceTask` from `src/lib/types.ts`.
- Produces: `t3`, `t4`, both `PerformanceTask`.

- [ ] **Step 1: Write `src/content/tasks/t3.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t3: PerformanceTask = {
  id: 't3',
  kind: 'individual',
  title: 'Servicing and functional testing of a motor operated or heating appliance',
  brief:
    'The learner individually diagnoses and services a common household appliance (e.g., electric fan, blender, flat iron, or rice cooker) by inspecting components such as motor windings or heating elements, checking wiring continuity, replacing defective parts if necessary, reassembling the unit, and performing operational testing while strictly observing electrical safety procedures.',
  modules: ['m3', 'm4'],
  safety: [
    'Unplug the appliance at the wall before you open it, and keep the plug where you can see it so nobody else can plug it back in while your hands are inside.',
    'A motor run capacitor holds its charge after the appliance is unplugged. Discharge it through a bleeder resistor and confirm with a meter before you touch its terminals.',
    'A heating element and its soleplate stay hot long after the appliance is switched off. Let it cool before you handle it.',
    'Never bridge or bypass a thermal cutout to get an appliance working. It opened for a reason, and the reason is still there.',
  ],
  steps: [
    'Confirm the fault for yourself and write down exactly what the appliance does and does not do.',
    'Unplug the appliance, open it, and look for anything obvious: a burnt smell, a discoloured lead, a loose terminal.',
    'With the appliance still unplugged, check continuity through the supply cord from the plug pins to the internal terminals, flexing the cord at the plug and at the entry while you watch the meter, because a break there shows only while it moves.',
    'Still unplugged, and only if the appliance has an earth pin, check continuity from that pin to any exposed metal the user can touch. A double insulated appliance has no earth to check.',
    'Still unplugged, test the switch, the thermal cutout, and the winding or element, one at a time, and write each reading down.',
    'If the appliance has a capacitor, discharge it first, then measure it and compare against the value marked on it.',
    'Replace what the readings condemned, and nothing that they did not.',
    'Reassemble the appliance completely, then plug it in and run it through every speed or heat setting.',
    'If anything still needs attention, unplug the appliance again before you reopen it, and repeat the test once it is closed.',
  ],
  rubric: [
    { criterion: 'Diagnosis', descriptor: 'The faulty part is identified from measurements rather than from guessing, and the readings are written down.', points: 6 },
    { criterion: 'Repair', descriptor: 'Only what the readings condemned is replaced, and it is fitted to the same rating as the original.', points: 5 },
    { criterion: 'Reassembly and testing', descriptor: 'The appliance goes back together fully and is tested on every setting it offers.', points: 5 },
    { criterion: 'Electrical safety', descriptor: 'The appliance was isolated before opening and any capacitor proved discharged before contact.', points: 6 },
  ],
}
```

- [ ] **Step 2: Write `src/content/tasks/t4.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t4: PerformanceTask = {
  id: 't4',
  kind: 'group',
  title: 'Comprehensive servicing of rechargeable and electronic controlled lighting units',
  brief:
    'In groups, learners troubleshoot and service rechargeable lamps or electronic-controlled lighting units by checking the power supply, battery condition, charging circuit, LED components, and control switches, performing necessary repairs or replacements, and conducting final safety and performance testing in accordance with established servicing standards.',
  modules: ['m4'],
  safety: [
    'A cell that is swollen, hot, or hissing has already failed dangerously. Isolate it, never charge it, and never refit it.',
    'Unplug the charger before opening the unit. The charger side can carry mains voltage even when the lamp itself is low voltage.',
    'Never puncture, crush, or short a lithium cell, including one you have decided to throw away. Hand it to your teacher for disposal.',
    'A lamp can be bright enough to hurt your eyes at close range. Point it away from faces when you switch it on.',
    'Never solder directly onto the body of a cell. The heat damages it and can make it vent. Use a cell with tags already fitted, or ask your teacher.',
    'Never leave the unit charging with the case open and the cell exposed. If you need one reading from the charging circuit while it is on charge, take it with your teacher present and unplug again straight away.',
  ],
  steps: [
    'Agree as a group what the lamp does now: how long it runs, whether it charges, and whether the switch does anything.',
    'Unplug the charger and open the unit, then inspect the cell for swelling, heat or leakage before you test anything.',
    'With the charger still unplugged, measure the cell voltage, then run the lamp for a few minutes and measure again, because a failed cell reads a plausible voltage at rest and collapses as soon as anything draws from it.',
    'Plug the charger in on its own, away from the open unit, measure its output at the jack against the rating printed on it, then unplug it again.',
    'With your teacher present, connect the charger to the unit just long enough to read the charging circuit output at the cell terminals, then unplug it again before you go any further.',
    'With the charger unplugged once more, check continuity through the switch and the wiring between the cell, the driver and the light emitting diodes.',
    'Test the light emitting diodes with the meter on its diode range, one device at a time, because one open device darkens a whole series string and looks identical to a dead driver from outside.',
    'Replace what the readings condemned, using a cell of the same chemistry, voltage and capacity as the original, with its protection circuit intact.',
    'Close the unit completely, then reconnect the charger and watch it through a full charge cycle, noting whether it warms more than it should.',
    'Unplug the charger again and run the lamp on battery alone to confirm the runtime the group expected.',
  ],
  rubric: [
    { criterion: 'Systematic diagnosis', descriptor: 'Charger, cell, charging circuit, wiring, diodes and switch are each measured in turn rather than swapped at random.', points: 5 },
    { criterion: 'Battery handling', descriptor: 'The cell is assessed under load rather than at rest, a failed cell is isolated rather than charged or refitted, and the unit is closed before it is left on charge.', points: 6 },
    { criterion: 'Repair and testing', descriptor: 'The replacement matches the original rating, and the unit is tested on charge and on battery.', points: 5 },
    { criterion: 'Working as a group', descriptor: 'Findings are shared as they are made and every member can explain what was wrong with the unit.', points: 4 },
  ],
}
```

- [ ] **Step 3: Register both**

In `src/content/tasks/index.ts`, add the imports and extend the array:

```ts
import { t3 } from './t3'
import { t4 } from './t4'

export const TASKS: PerformanceTask[] = [t1, t2, t3, t4]
```

- [ ] **Step 4: Run the guard suite**

Run: `npx vitest run tests/tasks.test.ts`
Expected: PASS, 11 tests, now covering four sheets.

- [ ] **Step 5: Typecheck and run the whole suite**

Run: `npx tsc -b --force && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/tasks
git commit -m "feat: add the appliance and lighting performance tasks"
```

---

### Task 4: The system servicing tasks

Tasks five and six of eight. Both are systems rather than single appliances, so the diagnostic move is to ask what the working parts have already proved before opening anything.

**Power state, traced for both.** t5 keeps the system energised through steps 3 and 4, which are voltage and signal measurements that cannot be made on a dead system, then names the isolation at step 6 before any re-termination. t6 tells the student to put the panel into test and inform the building at step 1, isolates the zone at step 4, and names the restoration at step 8.

**Files:**
- Create: `src/content/tasks/t5.ts`, `src/content/tasks/t6.ts`
- Modify: `src/content/tasks/index.ts`

**Interfaces:**
- Consumes: `PerformanceTask` from `src/lib/types.ts`.
- Produces: `t5`, `t6`, both `PerformanceTask`.

- [ ] **Step 1: Write `src/content/tasks/t5.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t5: PerformanceTask = {
  id: 't5',
  kind: 'individual',
  title: 'Troubleshooting and servicing of a CCTV camera unit',
  brief:
    'The learner individually diagnoses and services a malfunctioning CCTV unit (camera, power supply, or DVR/NVR connection) by inspecting cables, checking voltage output, testing video signal transmission, correcting faulty terminations, and restoring system operation while strictly observing electrical and low-voltage safety precautions.',
  modules: ['m4', 'm5'],
  safety: [
    'The camera side is low voltage, but the power supply that feeds it is not. Treat the supply as mains until you have proved otherwise.',
    'Several of the checks below need the system powered. Clip your probes on before you switch on, keep one hand away from the chassis, and switch off again before you move them.',
    'Isolate the supply before you cut, strip or re-terminate any cable. A connector made up live is a short waiting to happen.',
    'A camera on a bracket at height is a falling object. Support it before you loosen anything.',
    'Never work at height on your own. Somebody stays at the foot of the ladder for as long as you are on it.',
  ],
  steps: [
    'Confirm which cameras are affected and which are not, because a fault on one camera and a fault on all of them are different faults.',
    'Check what the working cameras have already proved: if others show a picture, the recorder and its supply are alive.',
    'With the system powered, measure the supply voltage arriving at the faulty camera, not at the power supply end.',
    'Still powered, check whether the video signal reaches the recorder input by substituting a known good lead at the recorder.',
    'Isolate the supply, then inspect the run for damage and open each termination, because a connector made up badly is the commonest fault on these systems and you cannot see inside one without opening it.',
    'Still isolated, re-terminate or replace whatever the measurements and the inspection condemned.',
    'Restore the supply and confirm the picture at the recorder, in daylight and again with the room darkened if the camera claims night operation.',
    'Tidy and support the cable run so the repair does not become next term problem for somebody else.',
  ],
  rubric: [
    { criterion: 'Narrowing the fault', descriptor: 'What the working cameras prove is used to narrow the search before anything is opened.', points: 6 },
    { criterion: 'Measurement', descriptor: 'Voltage is measured at the camera end and the signal path is checked by substitution, with readings written down.', points: 5 },
    { criterion: 'Repair quality', descriptor: 'Terminations are remade properly and the run is supported and dressed so it cannot chafe or pull on a connector.', points: 5 },
    { criterion: 'Safe working', descriptor: 'Live measurements are made with probes fitted first, and the supply is isolated before any cable work.', points: 6 },
  ],
}
```

- [ ] **Step 2: Write `src/content/tasks/t6.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t6: PerformanceTask = {
  id: 't6',
  kind: 'group',
  title: 'Fire alarm system inspection, troubleshooting and restoration project',
  brief:
    'In groups, learners conduct systematic inspection and servicing of a simulated fire alarm system, including smoke detectors, manual pull stations, alarm notification devices, and control panel connections, by identifying faults (e.g., open circuit, short circuit, device failure), performing corrective actions, and ensuring the system operates safely and reliably.',
  modules: ['m6', 'm7'],
  safety: [
    'Put the panel into test and tell everyone responsible for the building before you touch anything. An unannounced alarm empties a school, and an unannounced silence is worse.',
    'Never leave the system disabled at the end of a session. If the work is not finished, restore the system and say what is outstanding.',
    'Isolate the zone at the panel before you disconnect a device, and say out loud which zone you have isolated so the group knows.',
    'Sounders are loud enough to damage hearing at close range. Warn the group before any device is made to sound.',
    'The panel enclosure carries mains and a standby battery that can push a large current through a dropped tool. Open it only with your teacher present, and keep tools out of it while it is open.',
  ],
  steps: [
    'Put the panel into its test state, record which zones you are working on, and tell the people responsible for the building.',
    'Read what the panel is already telling you, because a fault light names the zone before you have measured anything.',
    'Walk the zone and look at every device and every junction, since the commonest fault is a termination rather than a device.',
    'Isolate the zone at the panel, then measure the loop end to end and compare against the end of line resistor value.',
    'Work outward from the first junction to halve the run, rather than walking the whole loop device by device.',
    'Correct what you found, remaking terminations properly rather than twisting conductors together.',
    'Reconnect the zone and confirm the panel shows it healthy with no fault light.',
    'Prove one device on the zone while the panel is still in test, so the proof does not sound an alarm the building was not warned about.',
    'Restore the device you proved, then reset the panel, and only then take it out of test and tell the building the system is back in service.',
  ],
  rubric: [
    { criterion: 'Preparation', descriptor: 'The panel is put into test and the building is told before any work begins.', points: 5 },
    { criterion: 'Systematic fault finding', descriptor: 'The panel indication and the halving method are used, rather than walking the loop device by device.', points: 6 },
    { criterion: 'Corrective work', descriptor: 'Terminations are remade properly and the end of line arrangement is left correct.', points: 5 },
    { criterion: 'Restoration', descriptor: 'A device is proved while the panel is still in test, the system is then returned to service, and the building is told.', points: 6 },
  ],
}
```

- [ ] **Step 3: Register both**

In `src/content/tasks/index.ts`, add the imports and extend the array:

```ts
import { t5 } from './t5'
import { t6 } from './t6'

export const TASKS: PerformanceTask[] = [t1, t2, t3, t4, t5, t6]
```

- [ ] **Step 4: Run the guard suite**

Run: `npx vitest run tests/tasks.test.ts`
Expected: PASS, 11 tests, now covering six sheets.

- [ ] **Step 5: Typecheck and run the whole suite**

Run: `npx tsc -b --force && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/tasks
git commit -m "feat: add the CCTV and fire alarm performance tasks"
```

---

### Task 5: The last two tasks, and pinning the count

Tasks seven and eight, then the guard changes from "a registry exists" to "there are exactly eight", so a later refactor that drops one fails the build instead of quietly shortening the course.

**Power state, traced for both.** t7 isolates and discharges at step 2, works dead through step 4, names the restoration at step 5 for the powered signal tests, and names the second isolation at step 7. t8 isolates and locks off at step 2, works dead through step 5, and names the restoration at step 7, with the control supply restored ahead of the motor branch exactly as Module 9 teaches.

**Files:**
- Create: `src/content/tasks/t7.ts`, `src/content/tasks/t8.ts`
- Modify: `src/content/tasks/index.ts`, `tests/tasks.test.ts`

**Interfaces:**
- Consumes: `PerformanceTask` from `src/lib/types.ts`.
- Produces: `t7`, `t8`. After this task `TASKS.length === 8`.

- [ ] **Step 1: Write `src/content/tasks/t7.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t7: PerformanceTask = {
  id: 't7',
  kind: 'individual',
  title: 'Troubleshooting and servicing of an audio amplifier or control board',
  brief:
    'The learner individually diagnoses and services a defective audio amplifier or basic motor control board by inspecting components, checking power supply output, testing input/output signals, identifying faulty parts (e.g., capacitors, transistors, relays), performing necessary repairs or replacements, and conducting functional testing while strictly observing electrical and ESD safety precautions.',
  modules: ['m8', 'm9'],
  safety: [
    'The filter capacitors in an amplifier supply hold their charge after the mains is removed. Discharge them through a bleeder resistor and confirm with a meter that they read close to zero volts before touching the board.',
    'Several of the checks below need the unit powered. Clip your probes on before you switch on, keep one hand away from the chassis, and switch off again before you move them.',
    'Turn the volume fully down before you switch on again. A fault can put full output into a speaker without warning, and that damages both the speaker and your hearing.',
    'Handle the board by its edges. Static from your hands damages semiconductors in ways that do not show up until later.',
  ],
  steps: [
    'Confirm the fault for yourself. On an amplifier that means listening and noting whether one channel or both are affected, which alone halves the search. On a control board it means noting which output fails to act, and at which position.',
    'Unplug the unit, discharge the supply capacitors, confirm they read close to zero volts, and open the case.',
    'With the unit still unplugged, inspect the board for bulged capacitors, discoloured resistors and dry joints.',
    'Still unplugged, check the fuses and measure continuity from the mains inlet to the transformer primary.',
    'Restore the supply with the volume down, then compare the supply rails feeding each output stage.',
    'Still powered, compare the signal at the input and at the output of the affected stage, working along the chain rather than at random.',
    'Unplug and discharge again before you unsolder or fit anything.',
    'Fit the replacement, reassemble, then restore power and confirm the unit works: both channels compared by ear at a low volume before raising it on an amplifier, or every output acting in turn on a control board.',
  ],
  rubric: [
    { criterion: 'Narrowing the fault', descriptor: 'The affected channel and stage are identified before the case is opened, and the signal path is followed in order.', points: 6 },
    { criterion: 'Measurement', descriptor: 'Rails and signals are measured at the right points with the right meter setting, and readings are written down.', points: 5 },
    { criterion: 'Repair quality', descriptor: 'The replacement matches the original rating, the joints are sound, and the board is handled by its edges.', points: 5 },
    { criterion: 'Safe working', descriptor: 'The capacitors were proved discharged before contact, probes were fitted before power, and the volume was down at switch on.', points: 6 },
  ],
}
```

- [ ] **Step 2: Write `src/content/tasks/t8.ts`**

```ts
import type { PerformanceTask } from '../../lib/types'

export const t8: PerformanceTask = {
  id: 't8',
  kind: 'group',
  title: 'Integrated system servicing of a motor controller with sensors and actuators',
  brief:
    'In groups, learners service and restore the operation of a simulated motor control system integrated with sensors (e.g., limit switch, proximity sensor) and actuators (e.g., relay-controlled motor, solenoid), by analyzing the wiring diagram, diagnosing faults, correcting wiring or component issues, and performing full system testing while ensuring strict compliance with safety precautions.',
  modules: ['m9'],
  safety: [
    'Isolate the supply and lock it off before opening the enclosure, because a motor can start on its own when a control signal changes. Prove the load side is dead with the meter before you touch it.',
    'Keep hands, sleeves and tools clear of the driven mechanism at all times, even with the supply removed.',
    'Tell whoever operates this machine that it is out of service, and do not rely on a note left on the panel.',
    'When the sequence needs the controller watched while it runs, restore the control supply only and leave the motor branch isolated.',
  ],
  steps: [
    'Agree from the wiring diagram what the system should do at each position, before anyone decides what is broken.',
    'Isolate the supply, lock it off, and prove the load side dead at the point you are about to touch.',
    'Still isolated, test each sensor by changing what it senses and watching the reading move, remembering that a proximity sensor needs its own supply and a limit switch does not.',
    'Still isolated, test the wiring from each sensor back to the controller input.',
    'Take each actuator off the machine and give it its rated signal from a bench supply, watching it act. The machine stays isolated throughout; the only thing energised is the actuator on the bench.',
    'Correct the wiring or fit the parts the readings condemned, and nothing else. If a relay contact was welded, find what made it weld before you fit the new relay, or the new one will weld too.',
    'Restore the control supply only, leaving the motor branch isolated, and watch the controller inputs change state as the mechanism is moved by hand.',
    'Restore the full supply with the guard in place, then run the machine through every position and confirm it stops where it should.',
  ],
  rubric: [
    { criterion: 'Reading the system', descriptor: 'The wiring diagram is used to agree the intended behaviour before any fault is named.', points: 5 },
    { criterion: 'Systematic diagnosis', descriptor: 'Sensor, wiring, controller input and actuator are followed in order rather than swapped at random.', points: 6 },
    { criterion: 'Corrective work', descriptor: 'Only what the readings condemned is changed, it is fitted to the same rating, and a welded contact is traced to its cause rather than simply replaced.', points: 4 },
    { criterion: 'Safe working', descriptor: 'The supply was locked off and proved dead, the mechanism was kept clear, and the control supply was restored alone before the motor branch.', points: 6 },
    { criterion: 'Working as a group', descriptor: 'The isolation is announced, findings are shared, and every member can explain the control sequence.', points: 4 },
  ],
}
```

- [ ] **Step 3: Register both**

In `src/content/tasks/index.ts`, add the imports and complete the array:

```ts
import { t7 } from './t7'
import { t8 } from './t8'

export const TASKS: PerformanceTask[] = [t1, t2, t3, t4, t5, t6, t7, t8]
```

- [ ] **Step 4: Pin the count and the alternation**

In `tests/tasks.test.ts`, replace the first test with these two:

```ts
  // Pinned, not just non-empty: a refactor that dropped a sheet would
  // otherwise leave every loop below quietly running on a shorter course.
  it('holds the eight Budget of Work tasks', () => {
    expect(TASKS.length).toBe(8)
  })

  // The Budget of Work alternates individual and group, and a student looking
  // for the group tasks should find them where the course put them.
  it('alternates individual and group as the Budget of Work does', () => {
    expect(TASKS.map(t => t.kind)).toEqual([
      'individual', 'group', 'individual', 'group',
      'individual', 'group', 'individual', 'group',
    ])
  })
```

- [ ] **Step 5: Run the guard suite**

Run: `npx vitest run tests/tasks.test.ts`
Expected: PASS, 12 tests, covering all eight sheets.

- [ ] **Step 6: Typecheck and run the whole suite**

Run: `npx tsc -b --force && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/content/tasks tests/tasks.test.ts
git commit -m "feat: complete the eight performance tasks"
```

---

### Task 6: The task sheet screen

One screen renders all eight. The rubric is shown from the start, above the steps rather than buried under them, because a student who reads what they are judged on before they begin works differently from one who finds out afterwards.

**Files:**
- Create: `src/routes/TaskSheet.tsx`
- Modify: `src/App.tsx`, `src/routes/ModuleOverview.tsx`

**Interfaces:**
- Consumes: `TASKS`, `getTask` from `src/content/tasks`; `taskProgress`, `setTaskProgress` from `src/lib/store.ts`.
- Produces: the route `/tasks/:taskId`.

- [ ] **Step 1: Write the screen**

Create `src/routes/TaskSheet.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getTask } from '../content/tasks'
import { setTaskProgress, taskProgress } from '../lib/store'
import type { CSSProperties } from 'react'

const label: CSSProperties = {
  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--ink-3)', margin: '0 0 8px',
}

export default function TaskSheet() {
  const { taskId = '' } = useParams()
  const task = getTask(taskId)
  const [progress, setProgress] = useState(() => taskProgress(taskId))

  if (!task) {
    return <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>That task sheet does not exist.</p>
  }

  const total = task.rubric.reduce((n, r) => n + r.points, 0)

  function toggle(i: number) {
    const checked = progress.checked.includes(i)
      ? progress.checked.filter(n => n !== i)
      : [...progress.checked, i]
    const next = { ...progress, checked }
    setProgress(next)
    setTaskProgress(taskId, next)
  }

  function note(text: string) {
    setProgress(p => ({ ...p, notes: text }))
  }

  // Typed text is written a short moment after typing stops. Writing on every
  // keystroke serialises the whole store per character, which on the low end
  // Android phones these students use shows as typing lag; writing only when
  // the field is left loses text whenever the page goes without a focus change
  // first, which is what the back button, a closed tab and the phone
  // backgrounding the app all do. This is the same conclusion the evaluation
  // survey reached, for the same reason.
  useEffect(() => {
    const t = setTimeout(() => setTaskProgress(taskId, progress), 600)
    return () => clearTimeout(t)
  }, [progress, taskId])

  const latest = useRef(progress)
  latest.current = progress
  useEffect(() => () => { setTaskProgress(taskId, latest.current) }, [taskId])

  return (
    <div style={{ maxWidth: '62ch' }}>
      <p style={label}>{task.kind === 'group' ? 'Group task' : 'Individual task'}</p>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
        {task.title}
      </h1>

      <blockquote style={{
        margin: '0 0 18px', padding: '12px 14px', borderRadius: 14,
        background: 'var(--surface)', border: '1px solid var(--line)',
        fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)',
      }}>
        {task.brief}
      </blockquote>

      <div role="note" style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderLeft: '3px solid var(--danger)', borderRadius: '0 10px 10px 0',
        padding: '11px 13px', margin: '0 0 20px',
      }}>
        <strong style={{
          display: 'block', fontSize: 11, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 6,
        }}>Safety</strong>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)' }}>
          {task.safety.map(s => <li key={s} style={{ marginBottom: 5 }}>{s}</li>)}
        </ul>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 4px' }}>How you are marked</h2>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 10px' }}>
        Your teacher scores this by watching you work. It is here before the steps so you know
        what you are aiming at, out of {total}.
      </p>
      <div style={{ overflowX: 'auto', margin: '0 0 22px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 420 }}>
          <thead>
            <tr>
              {['What is marked', 'What full marks looks like', 'Points'].map(h => (
                <th key={h} style={{ ...label, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {task.rubric.map(r => (
              <tr key={r.criterion}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink)', fontWeight: 600 }}>{r.criterion}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink-2)', lineHeight: 1.5 }}>{r.descriptor}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 4px' }}>Steps</h2>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 10px' }}>
        Tick these as you go. They are your own record of what you did; your teacher marks
        the work itself, not the ticks.
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
        {task.steps.map((s, i) => (
          <li key={s}>
            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44,
              padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13.5, lineHeight: 1.55,
              color: progress.checked.includes(i) ? 'var(--ink-3)' : 'var(--ink-2)',
            }}>
              <input type="checkbox" checked={progress.checked.includes(i)}
                onChange={() => toggle(i)}
                style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
              <span><strong style={{ color: 'var(--ink-3)' }}>{i + 1}.</strong> {s}</span>
            </label>
          </li>
        ))}
      </ol>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 6px' }}>Your notes</h2>
      <textarea
        value={progress.notes ?? ''}
        onChange={e => note(e.target.value)}
        rows={5}
        placeholder="What you measured, what you found, what you changed"
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
          margin: '0 0 18px', resize: 'vertical',
        }} />

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: 0 }}>
        Saved on this device as you go. It reaches your teacher when you hand in from{' '}
        <Link to="/progress" style={{ color: 'var(--accent)' }}>Progress</Link>.
      </p>
    </div>
  )
}
```

The ticks write immediately and the notes are debounced, with a flush on the way out. That is exactly what the evaluation survey settled on after two rounds of review: a click is rare and a keystroke is not, blur alone loses text when the phone backgrounds the app, and twenty minutes of notes on a bench is not work to lose.

- [ ] **Step 2: Add the route**

In `src/App.tsx`:

```tsx
import TaskSheet from './routes/TaskSheet'
```

```tsx
  { path: '/tasks/:taskId', element: <Shell><TaskSheet /></Shell> },
```

- [ ] **Step 3: Link the tasks from their modules**

In `src/routes/ModuleOverview.tsx`, add the import:

```tsx
import { TASKS } from '../content/tasks'
```

and render this beside the existing pre-test and post-test links, inside the same flex row:

```tsx
        {TASKS.filter(t => t.modules.includes(m.id)).map(t => (
          <Link key={t.id} to={`/tasks/${t.id}`} className="tile" style={{
            minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '10px 14px',
            borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
            fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none',
          }}>
            {t.kind === 'group' ? 'Group task' : 'Individual task'}
          </Link>
        ))}
```

If that file names the module something other than `m`, use whatever it already uses rather than renaming it.

- [ ] **Step 4: Typecheck and run the whole suite**

Run: `npx tsc -b --force && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 5: Check it in a browser**

Run: `npm run dev`

Consent, open Module 2, and follow the individual task link. Confirm: the safety block is the only red on the page; the rubric appears above the steps with a total; ticking a step persists across a reload; unticking it persists too; typing a note and navigating away and back keeps the note; at 375px the rubric table scrolls inside its own box without the page scrolling sideways, and every checkbox row is at least 44px tall.

- [ ] **Step 6: Commit**

```bash
git add src/routes/TaskSheet.tsx src/App.tsx src/routes/ModuleOverview.tsx
git commit -m "feat: add the performance task sheet screen"
```

---

### Task 7: Task and engagement columns, and the rubric scoring sheet

The class CSV currently reports what a student scored and nothing about what they did. This adds three columns per task, five engagement columns, and a separate scoring sheet the teacher fills in by hand.

**Files:**
- Modify: `src/lib/export.ts`, `src/routes/Teacher.tsx`
- Test: `tests/export.test.ts`

**Interfaces:**
- Consumes: `TASKS` from `src/content/tasks`; `StoreV1` from `src/lib/store.ts`; `StudentGroup` from `src/lib/merge.ts`.
- Produces: `rubricRows(students)` in `src/lib/export.ts`. `csvHeader()` grows from 112 to 141.

- [ ] **Step 1: Write the failing tests**

Add `rubricRows` to the existing `../src/lib/export` import in `tests/export.test.ts`, then append:

```ts
describe('task and engagement columns', () => {
  it('carries three columns for every performance task', () => {
    const head = csvHeader()
    expect(head.filter(h => h.endsWith('_steps_done')).length).toBe(8)
    expect(head.filter(h => h.endsWith('_steps_total')).length).toBe(8)
    expect(head.filter(h => h.endsWith('_notes')).length).toBe(8)
  })

  it('carries the five engagement columns', () => {
    const head = csvHeader()
    for (const c of ['lessons_completed', 'formative_attempted', 'formative_correct', 'sims_run', 'sims_distinct']) {
      expect(head, c).toContain(c)
    }
  })

  it('is still exactly as wide as the header', () => {
    expect(csvRow(state()).length).toBe(csvHeader().length)
  })

  it('reports an untouched task as zero of its step count, not as blank', () => {
    const head = csvHeader()
    const row = csvRow(state())
    expect(row[head.indexOf('task_t1_steps_done')]).toBe(0)
    expect(row[head.indexOf('task_t1_steps_total')]).toBeGreaterThan(0)
  })

  it('counts the steps a student ticked', () => {
    const head = csvHeader()
    const row = csvRow(state({ tasks: { t1: { checked: [0, 2, 4] } } }))
    expect(row[head.indexOf('task_t1_steps_done')]).toBe(3)
  })

  // A tick is the student's own record, so the count must not exceed the
  // sheet: a stale index from an edited sheet would otherwise report six of
  // five and nobody would notice until the analysis.
  it('never reports more steps done than the sheet has', () => {
    const head = csvHeader()
    const row = csvRow(state({ tasks: { t1: { checked: [0, 1, 2, 3, 4, 5, 6, 7, 99] } } }))
    const done = row[head.indexOf('task_t1_steps_done')] as number
    const total = row[head.indexOf('task_t1_steps_total')] as number
    expect(done).toBeLessThanOrEqual(total)
  })

  it('counts engagement from the store', () => {
    const head = csvHeader()
    const row = csvRow(state({
      modules: { m1: { completedOutcomes: ['lo1', 'lo2'] }, m2: { completedOutcomes: ['lo1'] } },
      attempts: [
        { itemId: 'a', moduleId: 'm1', competency: 'C', correct: true, at: '2026-01-01T00:00:00.000Z', context: 'formative' },
        { itemId: 'b', moduleId: 'm1', competency: 'C', correct: false, at: '2026-01-01T00:00:00.000Z', context: 'formative' },
        { itemId: 'c', moduleId: 'm1', competency: 'C', correct: true, at: '2026-01-01T00:00:00.000Z', context: 'pretest' },
      ],
      sims: [
        { simId: 'multimeter', moduleId: 'm1', score: 1, at: '2026-01-01T00:00:00.000Z', evidence: {} },
        { simId: 'multimeter', moduleId: 'm1', score: 1, at: '2026-01-02T00:00:00.000Z', evidence: {} },
        { simId: 'psu', moduleId: 'm2', score: 1, at: '2026-01-03T00:00:00.000Z', evidence: {} },
      ],
    }))
    expect(row[head.indexOf('lessons_completed')]).toBe(3)
    expect(row[head.indexOf('formative_attempted')]).toBe(2)
    expect(row[head.indexOf('formative_correct')]).toBe(1)
    expect(row[head.indexOf('sims_run')]).toBe(3)
    expect(row[head.indexOf('sims_distinct')]).toBe(2)
  })

  it('explains every new column in the codebook', () => {
    const named = new Set(codebookRows().slice(1).map(r => r[0]))
    for (const h of csvHeader()) expect(named.has(h), `${h} is not in the codebook`).toBe(true)
  })
})

describe('rubricRows', () => {
  const rows = rubricRows([{ code: 'EPAS-AAAA11' }])

  it('starts with a header', () => {
    expect(rows[0]).toEqual(['participant_code', 'task_id', 'task_title', 'criterion', 'max_points', 'score'])
  })

  it('gives one row per student per task per criterion', () => {
    expect(rows.length - 1).toBe(33)
  })

  it('leaves the score blank for the teacher to fill in', () => {
    expect(rows[1]?.[5]).toBe('')
  })

  it('repeats the whole sheet for a second student', () => {
    expect(rubricRows([{ code: 'A' }, { code: 'B' }]).length - 1).toBe(66)
  })

  it('returns only a header for no students', () => {
    expect(rubricRows([])).toHaveLength(1)
  })
})
```

The `33` in that test is the total number of rubric criteria across the eight sheets: four each for t1 to t7 except t8, which has five. If a sheet gains or loses a criterion, update the number rather than loosening the assertion.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/export.test.ts`
Expected: FAIL, `rubricRows is not exported`.

- [ ] **Step 3: Add the columns**

In `src/lib/export.ts`, add the import:

```ts
import { TASKS } from '../content/tasks'
```

Extend `csvHeader`, after the survey columns and before `respondent`:

```ts
  for (const t of TASKS) head.push(`task_${t.id}_steps_done`, `task_${t.id}_steps_total`, `task_${t.id}_notes`)
  head.push('lessons_completed', 'formative_attempted', 'formative_correct', 'sims_run', 'sims_distinct')
```

and in `csvRow`, in the same position:

```ts
  for (const t of TASKS) {
    const p = state.tasks?.[t.id]
    // Clamped to the sheet. A tick is stored as an index, so a sheet edited
    // between terms could leave an index that no longer exists, and reporting
    // six of five would not be noticed until the analysis.
    const done = p ? p.checked.filter(i => i >= 0 && i < t.steps.length).length : 0
    row.push(done, t.steps.length, p?.notes ?? '')
  }

  const lessons = Object.values(state.modules).reduce((n, m) => n + m.completedOutcomes.length, 0)
  const formative = state.attempts.filter(a => a.context === 'formative')
  row.push(
    lessons,
    formative.length,
    formative.filter(a => a.correct).length,
    state.sims.length,
    new Set(state.sims.map(s => s.simId)).size,
  )
```

Extend `codebookRows`, in the same position:

```ts
  for (const t of TASKS) {
    rows.push([`task_${t.id}_steps_done`, 'task', t.modules.join(' '), `Steps the student ticked on ${t.title}. Their own record of what they did, not evidence that they did it`])
    rows.push([`task_${t.id}_steps_total`, 'task', t.modules.join(' '), `How many steps that sheet has`])
    rows.push([`task_${t.id}_notes`, 'task', t.modules.join(' '), `What the student wrote on ${t.title}`])
  }
  rows.push(['lessons_completed', 'engagement', '', 'Learning outcomes marked complete across all nine modules'])
  rows.push(['formative_attempted', 'engagement', '', 'Formative quiz items answered inside lessons. Excluded from the gain'])
  rows.push(['formative_correct', 'engagement', '', 'How many of those were right'])
  rows.push(['sims_run', 'engagement', '', 'Simulation runs recorded, including repeats and runs started from Labs'])
  rows.push(['sims_distinct', 'engagement', '', 'How many different simulations were run at least once'])
```

- [ ] **Step 4: Add the rubric scoring sheet**

Append to `src/lib/export.ts`:

```ts
/**
 * The sheet a teacher scores by hand. A performance task is judged by watching
 * a student work at a bench, so the app supplies the criteria, the maximum for
 * each, and a blank column. Deriving a score from ticked checkboxes would
 * produce a number that looks like an assessment and is not one.
 *
 * Every task is listed for every student, whether or not they ticked anything,
 * so the teacher gets a complete sheet rather than one with gaps they have to
 * notice.
 */
export function rubricRows(students: { code: string }[]): Cell[][] {
  const rows: Cell[][] = [['participant_code', 'task_id', 'task_title', 'criterion', 'max_points', 'score']]
  for (const s of students) {
    for (const t of TASKS) {
      for (const r of t.rubric) {
        rows.push([s.code, t.id, t.title, r.criterion, r.points, ''])
      }
    }
  }
  return rows
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/export.test.ts`
Expected: PASS.

- [ ] **Step 6: Offer the sheet from the teacher screen**

In `src/routes/Teacher.tsx`, add `rubricRows` to the existing `../lib/export` import, then add a third button beside the other two:

```tsx
        <button
          onClick={() => downloadCsv('epas-rubric-sheet.csv', rubricRows(included.map(g => ({ code: g.code }))))}
          disabled={included.length === 0}
          className="tile"
          style={{
            minHeight: 44, padding: '11px 18px', borderRadius: 10,
            border: '1px solid var(--line)', background: 'var(--surface)',
            color: included.length ? 'var(--ink)' : 'var(--ink-3)',
            font: 'inherit', fontSize: 14, fontWeight: 600,
            cursor: included.length ? 'pointer' : 'default',
          }}>
          Save the rubric scoring sheet
        </button>
```

- [ ] **Step 7: Typecheck, test and build**

Run: `npx tsc -b --force && npm test && npm run build`
Expected: all clean.

- [ ] **Step 8: Check the widths**

In the browser, merge one student and save all three files. Confirm the class table has 141 columns in both its header and its row, the codebook names all 141, and the rubric sheet has 34 lines for one student.

- [ ] **Step 9: Commit**

```bash
git add src/lib/export.ts src/routes/Teacher.tsx tests/export.test.ts
git commit -m "feat: export task progress, engagement and a rubric scoring sheet"
```

---

### Task 8: The Labs gallery, and honesty about the unbuilt routes

`Labs` has been in the navigation since the first plan and has always landed on "Not built yet". This builds it, and takes `/tools` and `/settings` out of the spec rather than leaving them as promises nobody intends to keep.

**Files:**
- Create: `src/routes/Labs.tsx`
- Modify: `src/App.tsx`, `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`

**Interfaces:**
- Consumes: `SIMS`, `getSim` from `src/interactives/registry.ts`.
- Produces: the routes `/labs` and `/labs/:simId`.

- [ ] **Step 1: Write the gallery and the full screen**

Create `src/routes/Labs.tsx`. Both routes live in one file because they are one idea and the gallery needs the same titles the full screen uses:

```tsx
import { Link, useParams } from 'react-router'
import { SIMS, getSim } from '../interactives/registry'

/**
 * What each simulation is called and what it is for, in a student's words.
 * Keyed by the same simId the lesson blocks use, so adding a simulation is
 * still one registry entry plus one component plus one line here.
 */
const ABOUT: Record<string, { title: string; blurb: string }> = {
  multimeter: {
    title: 'Multimeter and component testing',
    blurb: 'Measure resistance, continuity, diode drop and voltage on good and faulty parts.',
  },
  psu: {
    title: 'Power supply assembly',
    blurb: 'Build a supply stage by stage and watch what each one does to the waveform.',
  },
  troubleshoot: {
    title: 'System troubleshooter',
    blurb: 'Work a fault on a real appliance, choosing which tests to run before you name it.',
  },
  match: { title: 'Matching', blurb: 'Pair each part with what it does.' },
  hotspot: { title: 'Find the part', blurb: 'Point to the part being described on a diagram.' },
  sequence: { title: 'Put it in order', blurb: 'Arrange the steps of a procedure into a workable order.' },
}

export function LabsGallery() {
  return (
    <div style={{ maxWidth: '70ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 2px' }}>Labs</h1>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        Every simulation in the app, on its own, with no lesson around it. Practise as often as
        you like. These runs are recorded as practice and are kept apart from your pre-test and
        post-test, which are the only things your learning gain is worked out from.
      </p>

      <ul style={{
        listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      }}>
        {Object.keys(SIMS).map(simId => {
          const about = ABOUT[simId]
          return (
            <li key={simId}>
              <Link to={`/labs/${simId}`} className="tile" style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 14, padding: 14, minHeight: 110, textDecoration: 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 640, color: 'var(--ink)', lineHeight: 1.3 }}>
                  {about?.title ?? simId}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  {about?.blurb ?? 'Open this simulation.'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function LabFullScreen() {
  const { simId = '' } = useParams()
  const Sim = getSim(simId)
  const about = ABOUT[simId]

  if (!Sim) {
    return (
      <div style={{ maxWidth: '60ch' }}>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: '0 0 12px' }}>
          There is no simulation by that name.
        </p>
        <Link to="/labs" style={{ fontSize: 14, color: 'var(--accent)' }}>Back to Labs</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '62ch' }}>
      <Link to="/labs" style={{ fontSize: 13, color: 'var(--accent)' }}>Back to Labs</Link>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 14px' }}>
        {about?.title ?? simId}
      </h1>
      {/*
        `moduleId` is 'labs' rather than a real module. A practice run is not
        work on any module, and the export's engagement columns count runs
        without attributing them to one.
      */}
      <Sim moduleId="labs" />
    </div>
  )
}
```

- [ ] **Step 2: Add the routes**

In `src/App.tsx`:

```tsx
import { LabFullScreen, LabsGallery } from './routes/Labs'
```

```tsx
  { path: '/labs', element: <Shell><LabsGallery /></Shell> },
  { path: '/labs/:simId', element: <Shell><LabFullScreen /></Shell> },
```

- [ ] **Step 3: Add a guard so a new simulation cannot be left out**

Append to `tests/registry.test.tsx`:

```tsx
import { ABOUT_KEYS } from '../src/routes/Labs'

describe('the labs gallery', () => {
  // A simulation added to the registry and not to the gallery would appear as
  // a bare simId on a card, which is how it would ship.
  it('describes every registered simulation', () => {
    for (const simId of Object.keys(SIMS)) {
      expect(ABOUT_KEYS, simId).toContain(simId)
    }
  })
})
```

and in `src/routes/Labs.tsx`, export the keys so the guard can see them without exporting the whole map:

```ts
export const ABOUT_KEYS = Object.keys(ABOUT)
```

- [ ] **Step 4: Take the unbuilt routes out of the spec**

In `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`, section 7, delete these two lines:

```
- `/tools` calculators and a Component Explorer tile grid
- `/settings`
```

and add this sentence directly under the remaining list:

```
`/tools` and `/settings` were listed here through seven plans and never built. Nothing in
the app needs a calculator screen, and the two things a settings screen would have held
already exist: the participant switch on the module map and the consent choice itself. They
are removed rather than carried, because a route list that promises screens indefinitely is
worse than a shorter one that is true.
```

- [ ] **Step 5: Typecheck, test and build**

Run: `npx tsc -b --force && npm test && npm run build`
Expected: all clean.

- [ ] **Step 6: Check it in a browser**

Run: `npm run dev`

Open Labs from the navigation. Confirm six cards, each with a real title rather than a bare id. Open the troubleshooter from a card and confirm it runs standalone, that naming a fault is still impossible until a test has been run, and that completing it adds a row to `sims` in `localStorage` with `moduleId: "labs"`. Visit `#/labs/nonsense` and confirm it says so rather than showing a blank page. At 375px confirm the grid reflows to one column with no horizontal scrolling.

- [ ] **Step 7: Commit**

```bash
git add src/routes/Labs.tsx src/App.tsx tests/registry.test.tsx docs/superpowers/specs/2026-09-06-epas-learning-app-design.md
git commit -m "feat: open the labs gallery and retire the unbuilt routes"
```

---

## Verification

After Task 8, all of the following must hold.

- `npx tsc -b --force` exits 0, `npm test` is green, `npm run build` succeeds.
- `TASKS.length === 8`, alternating individual and group, every one naming modules that exist.
- Every task has at least two distinct safety lines, five distinct steps, and a rubric whose points total a whole number greater than zero.
- No step list isolates a supply and then requires a live measurement, or the reverse, without naming the transition in the step text.
- `csvRow(state).length === csvHeader().length === 141` for an empty state and a full one.
- Every one of the 141 columns appears in `codebookRows()`, and none needs CSV quoting.
- `task_<id>_steps_done` can never exceed `task_<id>_steps_total`.
- The rubric sheet has one row per student per task per criterion with a blank score, and 34 lines for one student.
- **A student who declined the study still does not appear in the merged table.** Nothing in this plan touches `src/lib/merge.ts`, and the guard suite in `tests/merge.test.ts` must still pass untouched.
- `/labs` lists all six simulations by name, `/labs/:simId` runs one, and an unknown id says so.

## What this plan does not build

- PWA packaging, the service worker, offline verification and deployment. That is the next and last plan.
- `/tools` and `/settings`, which Task 8 removes from the spec instead.
- Any change to `src/lib/merge.ts`, `src/lib/diagnose.ts` or the consent rule.
