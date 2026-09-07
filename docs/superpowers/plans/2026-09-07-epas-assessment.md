# EPAS Assessment Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pre-test and post-test instrument that lets this app support a learning-gain claim, on a store whose records can be exported without ambiguity.

**Architecture:** A tagged item bank of 56 new multiple-choice items, two per competency, forms A and B, disjoint from the 84 formative items students already meet inside lessons. A pure `lib/assess.ts` draws a form, grades it, and computes per-competency gain from stored attempts. Three store defects that would make an export indefensible are fixed first, because every later task writes through that store.

**Tech Stack:** Vite, React 19, TypeScript (strict), React Router (`createHashRouter`), Vitest, Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` (sections 8, 10, 11 bind this plan)

**Prior plans:** foundation-and-m1, flagship-sims-m2-m3, activities-m4, sequence-m5-m7, m8-m9. All merged. Deferred items in `docs/superpowers/plans/CARRY-FORWARD.md`, several of which this plan closes.

## Global Constraints

- **No em dashes in any user-visible copy.** Absolute. Applies to stems, options, and every screen string.
- Red (`--danger`) is reserved for safety hazards only. Never for a wrong answer.
- Every bank item's `competency` string must match a competency of its module character for character.
- Item ids must be globally unique across the bank AND against the 84 existing formative quiz ids.
- TypeScript strict, including `noUncheckedIndexedAccess`. Indexed access yields `T | undefined`.
- All logic lives in pure, total, unit-tested functions under `src/lib/`. The UI is not unit-tested.
- Every write to `localStorage` goes through `src/lib/store.ts`. No component touches storage directly.
- `src/lib/diagnose.ts` is frozen. Do not change `PENALTY`, `FLOOR`, or `requiredTests`.
- Routing stays on `createHashRouter` with Vite `base: './'` so the build runs from any static host.

## Design decisions this plan locks in

**Pre and post items carry no rationale.** The formative items inside lessons explain every option, because that is where learning happens. A pre-test that explains itself teaches between the two measurements and destroys the gain it is trying to measure. The bank type therefore has no `rationale` field, and the assessment screen shows a score, not answers.

**Both forms are all multiple choice.** The spec requires forms "matched" on competency and difficulty. The existing 84 items are one MCQ, one true/false and one ordering item per outcome, so splitting them across forms would match neither format nor difficulty. Two new MCQs per competency give a clean matched pair.

**One item per competency per form.** 28 competencies, so a module's pre-test runs 3 to 6 items and the matched post-test runs the same count. Per-student, per-competency gain is binary; across a class it aggregates to a proportion correct per competency, which is what the paper reports.

**Gain is computed from stored attempts, not held in a separate structure.** `Attempt` already carries `competency` and an `AttemptContext` of `'formative' | 'pretest' | 'posttest'`. The gain calculation is a pure read over `attempts`, so there is one source of truth and nothing to keep in sync.

---

## File Structure

**Create:**

| File | Responsibility |
|---|---|
| `src/lib/assess.ts` | Pure engine: draw a form, grade it, compute per-competency gain |
| `src/content/bank/index.ts` | `BANK` registry, `bankFor(moduleId, form)` |
| `src/content/bank/m1.ts` .. `m9.ts` | The 56 tagged items, two per competency |
| `src/routes/Consent.tsx` | First-run consent, participant code, optional name |
| `src/routes/Assessment.tsx` | Pre-test and post-test runner |
| `tests/assess.test.ts` | Engine unit tests |
| `tests/bank.test.ts` | Guard suite over the whole bank |

**Modify:**

| File | Change |
|---|---|
| `src/lib/types.ts` | Add `FormId` and `BankItem` |
| `src/lib/store.ts` | Add `runId` to `Attempt` and `SimRecord`; add `startRun`, `hasTaken`; bump nothing (schema stays 1, fields are additive and optional on read) |
| `src/ui/blocks/BlockRenderer.tsx:82` | Pass `onEvent` to the mounted simulation |
| `src/interactives/SystemTroubleshooter.tsx` | Require at least one test point before naming a fault |
| `src/App.tsx` | Add `/consent` and `/m/:moduleId/test/:form` routes |
| `src/routes/ModuleOverview.tsx` | Entry points to the pre-test and post-test |

---

### Task 1: Make stored records unambiguous

Three defects in `docs/superpowers/plans/CARRY-FORWARD.md` make an export indefensible. Two are fixed here; the third is Task 2.

Re-taking a quiz or re-running a simulation appends more rows, and nothing marks which run is which, so an export cannot say whether it is reporting a first attempt, a best attempt, or a last one. The fix is a `runId` stamped on every record written during one sitting.

`schemaVersion` stays `1`. The new field is additive, and `migrate` already tolerates records it does not recognise, so a student who has already used the app keeps their data and simply has rows with no `runId`. An export treats a missing `runId` as the run `'legacy'`.

**Files:**
- Modify: `src/lib/store.ts`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `newRunId(): string`, `recordAttempt(a: Attempt)` where `Attempt` gains `runId: string`, `recordSim(r: SimRecord)` where `SimRecord` gains `runId: string`, and `attemptsFor(moduleId: string, context: AttemptContext): Attempt[]` returning only the newest run's attempts.

- [ ] **Step 1: Write the failing tests**

First widen that file's existing import, which currently reads
`loadState, recordAttempt, recordSim, markOutcomeComplete, STORAGE_KEY`:

```ts
import {
  loadState, saveState, recordAttempt, recordSim,
  markOutcomeComplete, newRunId, attemptsFor, hasTaken, STORAGE_KEY,
} from '../src/lib/store'
import type { Attempt } from '../src/lib/store'
```

Then append:

```ts
describe('run identity', () => {
  beforeEach(() => localStorage.clear())

  it('gives each run a distinct id', () => {
    expect(newRunId()).not.toBe(newRunId())
  })

  it('keeps every attempt rather than overwriting a repeat', () => {
    const base = { itemId: 'x', moduleId: 'm1', competency: 'C', at: '2026-01-01T00:00:00.000Z', context: 'pretest' as const }
    recordAttempt({ ...base, correct: false, runId: 'r1' })
    recordAttempt({ ...base, correct: true, runId: 'r2' })
    expect(loadState().attempts).toHaveLength(2)
  })

  it('returns only the newest run when asked for a module and context', () => {
    const base = { itemId: 'x', moduleId: 'm1', competency: 'C', context: 'pretest' as const }
    recordAttempt({ ...base, correct: false, runId: 'r1', at: '2026-01-01T00:00:00.000Z' })
    recordAttempt({ ...base, correct: true, runId: 'r2', at: '2026-01-02T00:00:00.000Z' })
    const got = attemptsFor('m1', 'pretest')
    expect(got).toHaveLength(1)
    expect(got[0]?.correct).toBe(true)
  })

  it('ignores other modules and other contexts', () => {
    const base = { itemId: 'x', competency: 'C', at: '2026-01-01T00:00:00.000Z', correct: true, runId: 'r1' }
    recordAttempt({ ...base, moduleId: 'm1', context: 'pretest' })
    recordAttempt({ ...base, moduleId: 'm2', context: 'pretest' })
    recordAttempt({ ...base, moduleId: 'm1', context: 'posttest' })
    expect(attemptsFor('m1', 'pretest')).toHaveLength(1)
  })

  it('treats a record written before runIds existed as one legacy run', () => {
    const s = loadState()
    s.attempts.push({ itemId: 'old', moduleId: 'm1', competency: 'C', correct: true,
      at: '2025-01-01T00:00:00.000Z', context: 'pretest' } as Attempt)
    saveState(s)
    const got = attemptsFor('m1', 'pretest')
    expect(got).toHaveLength(1)
    expect(got[0]?.runId).toBeUndefined()
  })

  it('reports whether a module and context has been taken', () => {
    expect(hasTaken('m1', 'pretest')).toBe(false)
    recordAttempt({ itemId: 'x', moduleId: 'm1', competency: 'C', correct: true,
      at: '2026-01-01T00:00:00.000Z', context: 'pretest', runId: 'r1' })
    expect(hasTaken('m1', 'pretest')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/store.test.ts`
Expected: FAIL, `newRunId is not defined`.

- [ ] **Step 3: Add the fields and functions**

In `src/lib/store.ts`, add `runId` to both record types. Mark it optional so a payload written before this change still type-checks when read back:

```ts
export interface Attempt {
  itemId: string
  moduleId: string
  competency: string
  correct: boolean
  at: string
  context: AttemptContext
  /** Identifies one sitting. Absent on records written before runs existed. */
  runId?: string
}
```

```ts
export interface SimRecord {
  simId: string
  moduleId: string
  /** Fraction 0..1. */
  score: number
  at: string
  evidence: Record<string, unknown>
  /** Identifies one sitting. Absent on records written before runs existed. */
  runId?: string
}
```

Then append these functions to the end of the file:

```ts
export function newRunId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * The attempts from the most recent sitting of one module and context.
 * A repeat sitting supersedes an earlier one rather than being averaged
 * with it, so a student who retakes a pre-test is measured on the retake.
 * Records written before runs existed share the run `undefined` and are
 * returned together.
 */
export function attemptsFor(moduleId: string, context: AttemptContext): Attempt[] {
  const all = loadState().attempts.filter(a => a.moduleId === moduleId && a.context === context)
  if (all.length === 0) return []
  let newest = all[0]!
  for (const a of all) if (a.at > newest.at) newest = a
  return all.filter(a => a.runId === newest.runId)
}

export function hasTaken(moduleId: string, context: AttemptContext): boolean {
  return attemptsFor(moduleId, context).length > 0
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Stamp a runId at the existing call site**

`src/ui/Quiz.tsx` writes formative attempts in a loop. All items in one submit belong to one run, so take the id once before the loop. Change the `submit` function to:

```tsx
  function submit() {
    const runId = newRunId()
    for (const item of items) {
      recordAttempt({
        itemId: item.id,
        moduleId,
        competency: item.competency,
        correct: gradeItem(item, responses[item.id]),
        at: new Date().toISOString(),
        context: 'formative',
        runId,
      })
    }
    setSubmitted(true)
  }
```

Update the import on line 4 of that file:

```tsx
import { newRunId, recordAttempt } from '../lib/store'
```

Leave the hardcoded `'formative'` alone. Task 10 does not reuse this component: a test must not show a rationale, and `Quiz` exists to show one. Adding a `context` prop here would be a parameter with a single caller and a single value.

- [ ] **Step 6: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/store.ts src/ui/Quiz.tsx tests/store.test.ts
git commit -m "feat: identify each sitting with a run id"
```

---

### Task 2: Wire simulation events and require evidence before a diagnosis

Two more carry-forward defects, both of which corrupt the research data.

`src/ui/blocks/BlockRenderer.tsx:82` mounts every simulation without an `onEvent` handler, so the `progress` and `attempt` events the simulations already emit go nowhere. Only the aggregate `recordSim` row survives, and per-probe detail is lost.

`src/interactives/SystemTroubleshooter.tsx` gates naming a fault on `!safe || result` only, so a student can name a fault having run zero tests. A 1-in-5 guess then scores 1.00, in all eight scenarios. In an app whose purpose is to measure whether the diagnostic method was followed, a perfect score for no method is the same class of defect as an answer key that can be guessed.

The fix is to require at least one test point before any fault button is live. This does not change `src/lib/diagnose.ts`, which is frozen: it changes what the UI will let the student do.

**Files:**
- Modify: `src/ui/blocks/BlockRenderer.tsx`, `src/interactives/SystemTroubleshooter.tsx`
- Test: `tests/registry.test.tsx`

**Interfaces:**
- Consumes: `SimEvent` and `InteractiveProps` from `src/interactives/types.ts`, unchanged.
- Produces: nothing new. `BlockRenderer` gains an optional `onSimEvent` prop.

- [ ] **Step 1: Write the failing tests**

Append to `tests/registry.test.tsx`, and change that file's existing first line from
`import { render, screen } from '@testing-library/react'` to add `fireEvent`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { SystemTroubleshooter } from '../src/interactives/SystemTroubleshooter'
```

Use `fireEvent`, not `@testing-library/user-event`. That package is not a dependency of
this project and the Global Constraints forbid adding one.

```tsx
describe('naming a fault requires evidence', () => {
  beforeEach(() => localStorage.clear())

  // The safety lines render as checkboxes and all of them must be ticked
  // before any control in the exercise becomes live.
  function ackAllSafety() {
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box)
  }

  it('leaves the fault buttons disabled until a test has been run', () => {
    render(<SystemTroubleshooter moduleId="m3" config={{ scenario: 'fan' }} />)
    ackAllSafety()
    expect(screen.getByRole('button', { name: 'Failed run capacitor' })).toBeDisabled()
  })

  it('enables them once one test point has been used', () => {
    render(<SystemTroubleshooter moduleId="m3" config={{ scenario: 'fan' }} />)
    ackAllSafety()
    fireEvent.click(screen.getByRole('button', { name: /^Supply cord\./ }))
    expect(screen.getByRole('button', { name: 'Failed run capacitor' })).toBeEnabled()
  })

  it('says why the fault buttons are inert', () => {
    render(<SystemTroubleshooter moduleId="m3" config={{ scenario: 'fan' }} />)
    ackAllSafety()
    expect(screen.getByText(/Run at least one test first/)).toBeInTheDocument()
  })
})
```

Two selector details that will waste your time if you change them. The fault button's
name is matched as an exact string, because the scenario also has a *test point* button
whose name begins "Run capacitor", and a loose `/capacitor/i` matches both. And the
assertions target fault buttons rather than test point buttons because only the fault
buttons use the real `disabled` attribute; test point buttons use `aria-disabled`, which
`toBeDisabled()` does not read.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/registry.test.tsx`
Expected: FAIL on the first test, because the fault button is already enabled.

- [ ] **Step 3: Gate the accusation on evidence**

In `src/interactives/SystemTroubleshooter.tsx`, add a derived flag beside the existing `safe`:

```tsx
  const safe = acked.length === scenario.safety.length
  // Naming a fault with no evidence is a guess, and a guess that happens to
  // be right would score the same as a diagnosis. Require one test first.
  const canAccuse = safe && used.length > 0
```

Change the guard in `accuse`:

```tsx
  const accuse = (faultId: string) => {
    if (!canAccuse || result) return
```

Change the fault button to use it:

```tsx
            <button key={f.id} onClick={() => accuse(f.id)} disabled={!canAccuse || !!result}
              className="tile"
              style={{
                width: '100%', textAlign: 'left', minHeight: 44, padding: '10px 12px',
                borderRadius: 10, background: 'var(--paper)', font: 'inherit', fontSize: 13,
                border: `1px solid ${result && f.id === scenario.actualFault ? 'var(--pass)' : 'var(--line)'}`,
                color: 'var(--ink)', cursor: !canAccuse || result ? 'default' : 'pointer',
                opacity: canAccuse ? 1 : 0.5,
              }}>{f.label}</button>
```

Tell the student why the buttons are inert, so an inert control never reads as a broken one. Replace the `Name the fault` label line with:

```tsx
        <p style={label}>Name the fault</p>
        {safe && used.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: '0 0 8px', lineHeight: 1.5 }}>
            Run at least one test first. A fault named without evidence is a guess.
          </p>
        )}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/registry.test.tsx`
Expected: PASS.

- [ ] **Step 5: Pass the event handler through the renderer**

In `src/ui/blocks/BlockRenderer.tsx`, thread an optional handler. Change the signature:

```tsx
import type { SimEvent } from '../../interactives/types'

export function BlockRenderer({ blocks, moduleId, onSimEvent }: {
  blocks: Block[]
  moduleId: string
  onSimEvent?: (e: SimEvent) => void
}) {
```

And the `interactive` case at line 79:

```tsx
          case 'interactive': {
            const Sim = getSim(b.simId)
            if (Sim) {
              return <Sim key={i} moduleId={moduleId} config={b.config} onEvent={onSimEvent} />
            }
```

Every existing call site omits `onSimEvent` and behaves exactly as before. The handler now exists for the export in a later plan to attach to.

- [ ] **Step 6: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/ui/blocks/BlockRenderer.tsx src/interactives/SystemTroubleshooter.tsx tests/registry.test.tsx
git commit -m "fix: wire simulation events and require evidence before a diagnosis"
```

---

### Task 3: The assessment engine

A pure module that draws a form from the bank, grades it, and computes per-competency gain from stored attempts. Nothing here touches React or storage directly; `competencyGains` takes attempts as an argument so it stays testable.

**Files:**
- Create: `src/lib/assess.ts`, `tests/assess.test.ts`
- Modify: `src/lib/types.ts`

**Interfaces:**
- Consumes: `Attempt` from `src/lib/store.ts`.
- Produces: `FormId`, `BankItem` (in `types.ts`); `gradeForm(items, responses)` and `competencyGains(pre, post)` (in `assess.ts`).

- [ ] **Step 1: Add the item type**

Append to `src/lib/types.ts`:

```ts
/** Which of the two matched forms an item belongs to. A is the pre-test. */
export type FormId = 'A' | 'B'

/**
 * A pre-test or post-test item. Always multiple choice, so the two forms
 * match on format as well as on competency. Carries no rationale: showing
 * a student why an answer was wrong between the pre-test and the post-test
 * would teach them, which is exactly what the gain is trying to measure.
 */
export interface BankItem {
  id: string
  moduleId: string
  competency: string
  form: FormId
  /** Matched pair key. The A and B items for one competency share it. */
  pair: string
  stem: string
  options: string[]
  answer: number
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/assess.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { BankItem } from '../src/lib/types'
import type { Attempt } from '../src/lib/store'
import { competencyGains, gradeForm } from '../src/lib/assess'

function item(over: Partial<BankItem> = {}): BankItem {
  return {
    id: 'i1', moduleId: 'm1', competency: 'C1', form: 'A', pair: 'm1-c1',
    stem: 'S', options: ['a', 'b', 'c', 'd'], answer: 2, ...over,
  }
}

function attempt(over: Partial<Attempt> = {}): Attempt {
  return {
    itemId: 'i1', moduleId: 'm1', competency: 'C1', correct: true,
    at: '2026-01-01T00:00:00.000Z', context: 'pretest', ...over,
  }
}

describe('gradeForm', () => {
  it('counts a correct response', () => {
    const r = gradeForm([item()], { i1: 2 })
    expect(r.correct).toBe(1)
    expect(r.total).toBe(1)
  })

  it('counts a wrong response', () => {
    expect(gradeForm([item()], { i1: 0 }).correct).toBe(0)
  })

  it('treats an unanswered item as wrong rather than skipping it', () => {
    const r = gradeForm([item()], {})
    expect(r.correct).toBe(0)
    expect(r.total).toBe(1)
  })

  it('reports the outcome per competency', () => {
    const items = [item(), item({ id: 'i2', competency: 'C2', answer: 1 })]
    const r = gradeForm(items, { i1: 2, i2: 3 })
    expect(r.byCompetency).toEqual({ C1: true, C2: false })
  })

  it('scores an empty form as zero of zero rather than dividing by zero', () => {
    const r = gradeForm([], {})
    expect(r).toEqual({ correct: 0, total: 0, byCompetency: {} })
  })
})

describe('competencyGains', () => {
  it('reports a competency the student gained', () => {
    const pre = [attempt({ correct: false })]
    const post = [attempt({ correct: true, context: 'posttest' })]
    expect(competencyGains(pre, post)).toEqual([
      { competency: 'C1', pre: false, post: true, gained: true },
    ])
  })

  it('does not count a competency already held before the lesson', () => {
    const g = competencyGains([attempt({ correct: true })], [attempt({ correct: true, context: 'posttest' })])
    expect(g[0]?.gained).toBe(false)
  })

  it('records a competency that was lost', () => {
    const g = competencyGains([attempt({ correct: true })], [attempt({ correct: false, context: 'posttest' })])
    expect(g[0]).toEqual({ competency: 'C1', pre: true, post: false, gained: false })
  })

  it('reports null for a side that was never taken', () => {
    expect(competencyGains([attempt()], [])).toEqual([
      { competency: 'C1', pre: true, post: null, gained: false },
    ])
  })

  it('covers every competency named on either side', () => {
    const pre = [attempt({ competency: 'C1' })]
    const post = [attempt({ competency: 'C2', context: 'posttest' })]
    expect(competencyGains(pre, post).map(g => g.competency)).toEqual(['C1', 'C2'])
  })

  it('returns competencies in a stable order', () => {
    const pre = [attempt({ competency: 'Zed' }), attempt({ competency: 'Alpha' })]
    expect(competencyGains(pre, []).map(g => g.competency)).toEqual(['Alpha', 'Zed'])
  })

  it('returns nothing when neither side was taken', () => {
    expect(competencyGains([], [])).toEqual([])
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/assess.test.ts`
Expected: FAIL, cannot resolve `../src/lib/assess`.

- [ ] **Step 4: Write the engine**

Create `src/lib/assess.ts`:

```ts
import type { Attempt } from './store'
import type { BankItem } from './types'

export interface FormResult {
  correct: number
  total: number
  /** True where the student answered that competency's item correctly. */
  byCompetency: Record<string, boolean>
}

/**
 * Grades one form. An unanswered item counts as wrong rather than being
 * dropped, because a blank on a test is not the same as a shorter test and
 * the denominator has to stay comparable between the two forms.
 */
export function gradeForm(items: BankItem[], responses: Record<string, unknown>): FormResult {
  const byCompetency: Record<string, boolean> = {}
  let correct = 0
  for (const it of items) {
    const ok = responses[it.id] === it.answer
    if (ok) correct++
    byCompetency[it.competency] = ok
  }
  return { correct, total: items.length, byCompetency }
}

export interface Gain {
  competency: string
  /** Null where that side was never taken. */
  pre: boolean | null
  post: boolean | null
  /** Wrong before the teaching and right after it. */
  gained: boolean
}

/**
 * Per-competency gain across a matched pair of forms. `gained` is
 * deliberately narrow: it means the student did not have the competency
 * and now does. A competency already held before the lesson is not a gain,
 * and reporting it as one would inflate the result.
 */
export function competencyGains(pre: Attempt[], post: Attempt[]): Gain[] {
  const preBy = new Map<string, boolean>()
  for (const a of pre) preBy.set(a.competency, a.correct)
  const postBy = new Map<string, boolean>()
  for (const a of post) postBy.set(a.competency, a.correct)

  const names = [...new Set([...preBy.keys(), ...postBy.keys()])].sort()
  return names.map(competency => {
    const before = preBy.has(competency) ? preBy.get(competency)! : null
    const after = postBy.has(competency) ? postBy.get(competency)! : null
    return { competency, pre: before, post: after, gained: before === false && after === true }
  })
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/assess.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 6: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/assess.ts src/lib/types.ts tests/assess.test.ts
git commit -m "feat: add the assessment engine"
```

---

### Task 4: The bank registry and its guard suite

The registry and the guard tests come before any items, so that every item authored in Tasks 5 to 8 is checked the moment it lands. This is the pattern that made `tests/activities.test.ts` and `tests/quiz-keys.test.ts` worth having: an authoring mistake becomes a build failure instead of something a reviewer has to notice.

The bank starts empty apart from Module 1's items, which Task 5 writes. This task creates the registry, the guard suite, and an `m1.ts` containing only the three pairs for Module 1's three competencies, so the suite has something real to run against.

**Files:**
- Create: `src/content/bank/index.ts`, `src/content/bank/m1.ts`, `tests/bank.test.ts`

**Interfaces:**
- Consumes: `BankItem`, `FormId` from `src/lib/types.ts`.
- Produces: `BANK: BankItem[]`, `bankFor(moduleId: string, form: FormId): BankItem[]`. Tasks 5 to 8 add one `m<N>.ts` file each and one import line here.

- [ ] **Step 1: Create the registry**

Create `src/content/bank/index.ts`:

```ts
import type { BankItem, FormId } from '../../lib/types'
import { m1Bank } from './m1'

/**
 * Every pre-test and post-test item. Disjoint from the formative items in
 * src/content/m*.ts, which students meet inside the lessons: reusing those
 * here would measure whether they remember the lesson's own examples.
 */
export const BANK: BankItem[] = [...m1Bank]

export function bankFor(moduleId: string, form: FormId): BankItem[] {
  return BANK.filter(i => i.moduleId === moduleId && i.form === form)
}
```

- [ ] **Step 2: Write the guard suite**

Create `tests/bank.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { BankItem } from '../src/lib/types'
import { BANK, bankFor } from '../src/content/bank'
import { allModules } from '../src/content'

const modules = allModules()

describe('the item bank', () => {
  it('has items', () => {
    expect(BANK.length).toBeGreaterThan(0)
  })

  it('gives every item a globally unique id', () => {
    const ids = BANK.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('does not reuse an id from a formative quiz item', () => {
    const formative = new Set<string>()
    for (const m of modules) for (const o of m.outcomes) for (const q of o.quiz) formative.add(q.id)
    for (const i of BANK) expect(formative.has(i.id), `${i.id} collides with a formative item`).toBe(false)
  })

  it('names a module that exists', () => {
    const ids = new Set(modules.map(m => m.id))
    for (const i of BANK) expect(ids.has(i.moduleId), `${i.id} names module ${i.moduleId}`).toBe(true)
  })

  it('matches a competency of its own module character for character', () => {
    for (const i of BANK) {
      const m = modules.find(x => x.id === i.moduleId)
      expect(m, `${i.id}`).toBeDefined()
      expect(m!.competencies, `${i.id}: ${JSON.stringify(i.competency)}`).toContain(i.competency)
    }
  })

  it('gives every item four options and an answer that indexes them', () => {
    for (const i of BANK) {
      expect(i.options.length, i.id).toBe(4)
      expect(Number.isInteger(i.answer), `${i.id} answer is not a whole number`).toBe(true)
      expect(i.answer, i.id).toBeGreaterThanOrEqual(0)
      expect(i.answer, i.id).toBeLessThan(4)
    }
  })

  it('never repeats an option inside one item', () => {
    for (const i of BANK) expect(new Set(i.options).size, i.id).toBe(4)
  })

  // The whole design rests on this: every competency gets one A item and
  // one matched B item, so the two forms are comparable.
  it('pairs exactly one A item with one B item', () => {
    const pairs = new Map<string, BankItem[]>()
    for (const i of BANK) pairs.set(i.pair, [...(pairs.get(i.pair) ?? []), i])
    for (const [pair, items] of pairs) {
      expect(items.length, `pair ${pair}`).toBe(2)
      expect(items.map(i => i.form).sort(), `pair ${pair}`).toEqual(['A', 'B'])
      expect(items[0]!.competency, `pair ${pair} spans two competencies`).toBe(items[1]!.competency)
      expect(items[0]!.moduleId, `pair ${pair} spans two modules`).toBe(items[1]!.moduleId)
    }
  })

  it('asks a different question on each side of a pair', () => {
    const pairs = new Map<string, BankItem[]>()
    for (const i of BANK) pairs.set(i.pair, [...(pairs.get(i.pair) ?? []), i])
    for (const [pair, items] of pairs) {
      expect(items[0]!.stem, `pair ${pair} repeats its stem`).not.toBe(items[1]!.stem)
    }
  })

  it('draws a form with one item per competency covered', () => {
    for (const m of modules) {
      for (const form of ['A', 'B'] as const) {
        const drawn = bankFor(m.id, form)
        if (drawn.length === 0) continue
        const comps = drawn.map(i => i.competency)
        expect(new Set(comps).size, `${m.id} form ${form} repeats a competency`).toBe(comps.length)
      }
    }
  })

  it('uses no long dashes in anything a student reads', () => {
    for (const i of BANK) {
      const copy = [i.stem, ...i.options].join(' ')
      // U+2014 em dash, U+2013 en dash, U+2015 horizontal bar.
      expect(/[–—―]/.test(copy), `${i.id}`).toBe(false)
    }
  })

  // Options render in authored order, so keys that bunch make the test
  // answerable without reading it. This shipped once at 43 of 45 on B.
  it('spreads the answer keys across the options', () => {
    const counts = [0, 0, 0, 0]
    for (const i of BANK) counts[i.answer] = (counts[i.answer] ?? 0) + 1

    // Every option must be the answer somewhere, at any bank size.
    for (let k = 0; k < 4; k++) {
      expect(counts[k], `option ${'ABCD'[k]} is never the answer`).toBeGreaterThan(0)
    }

    // A share bound is meaningless on a handful of items and would make
    // this suite fail on the half-built bank between authoring tasks, so
    // it applies once the bank is big enough for the ratio to mean anything.
    if (BANK.length >= 24) {
      for (let k = 0; k < 4; k++) {
        const share = counts[k]! / BANK.length
        expect(share, `option ${'ABCD'[k]} holds ${counts[k]}/${BANK.length}`).toBeGreaterThan(0.15)
        expect(share, `option ${'ABCD'[k]} holds ${counts[k]}/${BANK.length}`).toBeLessThan(0.4)
      }
    }
  })
})
```

- [ ] **Step 3: Run the suite to verify it fails**

Run: `npx vitest run tests/bank.test.ts`
Expected: FAIL, cannot resolve `../src/content/bank/m1`.

- [ ] **Step 4: Write Module 1's items**

Module 1's three competencies, verbatim from `src/content/m1.ts`, are:

1. `Explain the overview of Electronic Systems Servicing.`
2. `Discuss electronic components identification.`
3. `Demonstrate procedures in testing electronic components.`

Copy these strings exactly. The guard suite compares them character for character against the module, and a competency invented from memory is the single easiest way to fail this task.

Create `src/content/bank/m1.ts`:

```ts
import type { BankItem } from '../../lib/types'

export const m1Bank: BankItem[] = [
  {
    id: 'b-m1-c1-a', moduleId: 'm1', pair: 'm1-c1', form: 'A',
    competency: 'Explain the overview of Electronic Systems Servicing.',
    stem: 'A customer reports a fault. What does a technician do before opening the appliance?',
    options: [
      'Order the part that fails most often on that model and fit it without testing anything',
      'Confirm the symptom for themselves, and note the conditions under which it appears',
      'Strip the appliance down to its bare boards so every part can be inspected at once',
      'Quote the customer a firm price for the repair before the fault has been seen',
    ],
    answer: 1,
  },
  {
    id: 'b-m1-c1-b', moduleId: 'm1', pair: 'm1-c1', form: 'B',
    competency: 'Explain the overview of Electronic Systems Servicing.',
    stem: 'Why does a technician work from the symptom towards the fault rather than replacing likely parts?',
    options: [
      'Because swapping in new parts one at a time always takes longer than making a measurement',
      'Because spare parts are hard to obtain and usually have to be ordered in from another supplier',
      'Because consumer protection law requires every repair to be backed by a written meter reading',
      'Because a replaced part that was healthy leaves the fault in place and costs the owner money',
    ],
    answer: 3,
  },
  {
    id: 'b-m1-c2-a', moduleId: 'm1', pair: 'm1-c2', form: 'A',
    competency: 'Discuss electronic components identification.',
    stem: 'A resistor is banded red, violet, brown, gold. What is its value?',
    options: [
      '27 ohms',
      '270 ohms',
      '2.7 kilohms',
      '270 kilohms',
    ],
    answer: 1,
  },
  {
    id: 'b-m1-c2-b', moduleId: 'm1', pair: 'm1-c2', form: 'B',
    competency: 'Discuss electronic components identification.',
    stem: 'A resistor is banded brown, black, orange, gold. What is its value?',
    options: [
      '10 ohms',
      '100 ohms',
      '1 kilohm',
      '10 kilohms',
    ],
    answer: 3,
  },
  {
    id: 'b-m1-c3-a', moduleId: 'm1', pair: 'm1-c3', form: 'A',
    competency: 'Demonstrate procedures in testing electronic components.',
    stem: 'A meter set to ohms reads OL across a component that should conduct. What does that mean?',
    options: [
      'The component is short circuit',
      'The meter is on the wrong range and the reading means nothing',
      'The path through the component is broken',
      'The component is within tolerance',
    ],
    answer: 2,
  },
  {
    id: 'b-m1-c3-b', moduleId: 'm1', pair: 'm1-c3', form: 'B',
    competency: 'Demonstrate procedures in testing electronic components.',
    stem: 'Why must a component be tested with the circuit unpowered and at least one leg lifted?',
    options: [
      'Because the rest of the circuit offers other paths, so the reading is of the board and not the component',
      'Because the meter would show the result in the wrong units while the component is still in place',
      'Because the small test current from the meter would overheat and damage the component while it is still wired in',
      'Because the meter needs the power off only so that its own internal battery is not drained',
    ],
    answer: 0,
  },
]
```

Keys across these six items land on A once, B twice, C once and D twice. Author later modules the same way: decide the key position before writing the options, and vary it.

- [ ] **Step 5: Run the suite to verify it passes**

Run: `npx vitest run tests/bank.test.ts`
Expected: PASS, 12 tests. If the key-spread test fails, re-key an item so every option is used rather than loosening the bound. The bound exists to catch exactly that.

- [ ] **Step 6: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/content/bank tests/bank.test.ts
git commit -m "feat: add the item bank registry and Module 1 items"
```

---

### Task 5: Bank items for Modules 2 and 3

Six competencies, twelve items. Author each pair so the A and B items test the same idea from different directions, never by rewording one stem.

**Files:**
- Create: `src/content/bank/m2.ts`, `src/content/bank/m3.ts`
- Modify: `src/content/bank/index.ts`

**Interfaces:**
- Consumes: `BankItem` from `src/lib/types.ts`; the registry shape from Task 4.
- Produces: `m2Bank`, `m3Bank`, both `BankItem[]`.

- [ ] **Step 1: Write `src/content/bank/m2.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m2Bank: BankItem[] = [
  {
    id: 'b-m2-c1-a', moduleId: 'm2', pair: 'm2-c1', form: 'A',
    competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
    stem: 'Why is a printed circuit board layout normally transferred as a mirror image of the drawn artwork?',
    options: [
      'Because the etchant only attacks the copper when the board is worked from its reverse side',
      'Because the toner is pressed face down onto the copper, which flips the pattern',
      'Because tracks that are mirrored end up resisting soldering heat better than tracks that are not',
      'Because the design software is not able to send the artwork to the printer the right way round',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c1-b', moduleId: 'm2', pair: 'm2-c1', form: 'B',
    competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
    stem: 'A board comes out of the etchant with several tracks broken. What is the most likely cause?',
    options: [
      'The board was rinsed in cold water part way through, which cracked the copper along the tracks',
      'The board was lifted out of the etchant too early, before the unwanted copper had cleared',
      'The tracks were drawn far too wide in the design software and shorted into one another',
      'The transferred toner did not adhere completely, so the etchant reached the copper beneath it',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c2-a', moduleId: 'm2', pair: 'm2-c2', form: 'A',
    competency: 'Discuss soldering and desoldering.',
    stem: 'A joint looks dull and rounded, and the solder sits on the pad like a bead rather than flowing onto it. What is wrong?',
    options: [
      'Too much flux was used, and the excess has pushed the molten solder up into a ball',
      'The joint is cold, because the pad and lead were not brought up to temperature together',
      'The pad was wiped with flux before soldering, which stops the solder bonding to the copper',
      'Nothing is wrong, a dull and rounded bead of solder sitting on the pad is a perfectly sound joint',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c2-b', moduleId: 'm2', pair: 'm2-c2', form: 'B',
    competency: 'Discuss soldering and desoldering.',
    stem: 'A through-hole joint has a good fillet on the solder side, but no solder has wicked up to the component side. What went wrong?',
    options: [
      'Too much solder was fed in at once, so the excess sealed over the mouth of the hole before it could flow',
      'The board was held at an angle, so gravity kept the solder on the lower side',
      'The iron touched the pad only, so the lead and the hole never reached the temperature the solder needed',
      'The solder used was too thin a gauge to be able to reach through the hole',
    ],
    answer: 2,
  },
  {
    id: 'b-m2-c3-a', moduleId: 'm2', pair: 'm2-c3', form: 'A',
    competency: 'Discuss the different types of power supplies.',
    stem: 'A linear supply has a filter capacitor that has lost most of its capacitance. What do you see at the output?',
    options: [
      'A steady voltage at the correct value',
      'No output voltage at all',
      'A voltage higher than it should be',
      'A large ripple riding on the output',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c3-b', moduleId: 'm2', pair: 'm2-c3', form: 'B',
    competency: 'Discuss the different types of power supplies.',
    stem: 'A full wave rectifier is used in place of a half wave one. What changes at the filter capacitor?',
    options: [
      'Nothing changes, both rectifier types feed the capacitor the very same waveform',
      'The capacitor is no longer needed once a full wave rectifier is fitted',
      'It is recharged only half as often, so the output ripple grows',
      'It is recharged twice as often, so the ripple shrinks',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c4-a', moduleId: 'm2', pair: 'm2-c4', form: 'A',
    competency: 'Perform variable regulated power supply assembly.',
    stem: 'A regulator is set for 12 V, but the voltage across the filter capacitor sags to 13 V under load. What happens at the output?',
    options: [
      'It holds a steady 12 V, because holding the set value no matter what the input does is what regulation means',
      'It follows the input down, because a regulator needs a few volts more than its output to regulate',
      'It rises a little above 12 V, as the regulator pushes harder to make up for the low input',
      'It shuts off completely and the output falls to zero until the input voltage recovers',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c4-b', moduleId: 'm2', pair: 'm2-c4', form: 'B',
    competency: 'Perform variable regulated power supply assembly.',
    stem: 'You have assembled a variable supply and the output will not rise above about 9 V, although the control is at maximum. Where do you look first?',
    options: [
      'At the transformer and rectifier, because the unregulated voltage feeding the regulator may be too low',
      'At the output terminals, which are most likely shorted together by a stray strand of stripped wire',
      'At the meter, which is most likely misreading the output by three or four volts',
      'At the load on the output, which is most likely drawing far too little current',
    ],
    answer: 0,
  },
]
```

- [ ] **Step 2: Write `src/content/bank/m3.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m3Bank: BankItem[] = [
  {
    id: 'b-m3-c1-a', moduleId: 'm3', pair: 'm3-c1', form: 'A',
    competency: 'Discuss the procedures in servicing appliances with electric motors.',
    stem: 'Which motor type has no capacitor at all?',
    options: [
      'A permanent split capacitor motor',
      'A shaded pole motor',
      'A capacitor start motor',
      'A capacitor start capacitor run motor',
    ],
    answer: 1,
  },
  {
    id: 'b-m3-c1-b', moduleId: 'm3', pair: 'm3-c1', form: 'B',
    competency: 'Discuss the procedures in servicing appliances with electric motors.',
    stem: 'A motor hums but does not turn, and then runs if the shaft is nudged by hand. What does that point to?',
    options: [
      'A loss of starting torque, most often from a failed capacitor',
      'A seized bearing that the nudge is just enough to free for a moment',
      'A break in the supply lead that the movement of the shaft briefly closes',
      'An open main winding, which the meter would show as a low resistance across the motor terminals',
    ],
    answer: 0,
  },
  {
    id: 'b-m3-c2-a', moduleId: 'm3', pair: 'm3-c2', form: 'A',
    competency: 'Apply procedures in servicing appliances with electric motors.',
    stem: 'Before putting an ohmmeter across a motor capacitor, what must you do?',
    options: [
      'Run the motor for about a minute first, so that the capacitor is warm and reads a little truer',
      'Switch the meter to the AC volts range first and take that reading before changing to ohms',
      'Isolate the appliance, discharge the capacitor, and confirm with the meter that it reads close to zero volts',
      'Nothing at all is needed here, because a motor capacitor cannot hold any charge once the appliance is switched off',
    ],
    answer: 2,
  },
  {
    id: 'b-m3-c2-b', moduleId: 'm3', pair: 'm3-c2', form: 'B',
    competency: 'Apply procedures in servicing appliances with electric motors.',
    stem: 'A fan motor turns freely by hand and its windings read a sensible resistance, but it still will not start. What remains most likely?',
    options: [
      'The bearings, which can drag under load even if the shaft spins freely by hand',
      'The capacitor, which neither test so far has examined',
      'The windings, because a motor that will not start always has an open winding somewhere',
      'The blade, which must be catching on the housing and holding the motor still',
    ],
    answer: 1,
  },
]
```

- [ ] **Step 3: Register both modules**

In `src/content/bank/index.ts`, add the imports and spread them into `BANK`:

```ts
import { m1Bank } from './m1'
import { m2Bank } from './m2'
import { m3Bank } from './m3'

export const BANK: BankItem[] = [...m1Bank, ...m2Bank, ...m3Bank]
```

- [ ] **Step 4: Run the guard suite**

Run: `npx vitest run tests/bank.test.ts`
Expected: PASS, 12 tests, now covering 18 items.

- [ ] **Step 5: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/bank
git commit -m "feat: add bank items for modules 2 and 3"
```

---

### Task 6: Bank items for Modules 4 and 5

Seven competencies, fourteen items. Module 4 carries five competencies, the most of any module, and two of them are the paired discuss-and-apply form, so keep the A and B items on those two clearly distinct in what they ask for: one recalls the rule, the other applies it to a case.

**Files:**
- Create: `src/content/bank/m4.ts`, `src/content/bank/m5.ts`
- Modify: `src/content/bank/index.ts`

**Interfaces:**
- Consumes: `BankItem` from `src/lib/types.ts`.
- Produces: `m4Bank`, `m5Bank`, both `BankItem[]`.

- [ ] **Step 1: Write `src/content/bank/m4.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m4Bank: BankItem[] = [
  {
    id: 'b-m4-c1-a', moduleId: 'm4', pair: 'm4-c1', form: 'A',
    competency: 'Discuss the procedures in servicing appliances with heating components.',
    stem: 'What does a heating element do when it fails open?',
    options: [
      'It draws more current than normal and blows the fuse',
      'It heats continuously and cannot be switched off',
      'It passes no current at all, so the appliance stays cold',
      'It heats more slowly but still reaches temperature',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c1-b', moduleId: 'm4', pair: 'm4-c1', form: 'B',
    competency: 'Discuss the procedures in servicing appliances with heating components.',
    stem: 'What is a thermostat in a heating appliance for?',
    options: [
      'To hold the current the element draws down to a fixed safe limit at all times',
      'To convert the incoming mains supply down to the lower voltage that the heating element runs on',
      'To open the circuit once the set temperature is reached and close it again as it falls',
      'To warn the user with a light or a tone whenever the appliance has become hot',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c2-a', moduleId: 'm4', pair: 'm4-c2', form: 'A',
    competency: 'Apply procedure in servicing appliances with heating components.',
    stem: 'An iron does not heat. The element measures open. What should you establish before fitting a new element?',
    options: [
      'Whether the thermal cutout has operated, and if so what made it operate',
      'Nothing else is needed, because an open element is the whole of the fault here',
      'Whether the soleplate is scratched or pitted enough to need refacing',
      'Whether the mains flex is long enough to reach a wall socket across the room',
    ],
    answer: 0,
  },
  {
    id: 'b-m4-c2-b', moduleId: 'm4', pair: 'm4-c2', form: 'B',
    competency: 'Apply procedure in servicing appliances with heating components.',
    stem: 'An iron heats but never switches off, and the soleplate keeps getting hotter. What has failed?',
    options: [
      'The heating element has gone open circuit',
      'The thermal cutout has operated',
      'The mains flex has a broken core',
      'The thermostat contacts have welded closed',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c3-a', moduleId: 'm4', pair: 'm4-c3', form: 'A',
    competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
    stem: 'A rechargeable lamp runs for only a few minutes on a full charge. What does that indicate?',
    options: [
      'The charger is pushing too much current into the cell and cutting the run short',
      'The lamp is simply being switched on and off far too often between charges',
      'The light emitting diodes have dimmed with age and now give up sooner',
      'The cell has lost capacity and no longer holds the charge it once did',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c3-b', moduleId: 'm4', pair: 'm4-c3', form: 'B',
    competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
    stem: 'A lithium cell in a lamp is swollen and warm to the touch. What do you do?',
    options: [
      'Charge it fully once more to see whether it recovers',
      'Run the lamp until the cell is flat, then replace it',
      'Pierce it to release the pressure before disposal',
      'Isolate it, do not charge it, and do not refit it',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c4-a', moduleId: 'm4', pair: 'm4-c4', form: 'A',
    competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
    stem: 'A string of light emitting diodes wired in series has one open device. What do you see?',
    options: [
      'Only the one failed diode goes dark and the rest of the string stays lit',
      'The whole string is dark, because the current path is broken',
      'The other diodes light more brightly, sharing the voltage the dead one dropped',
      'The string flickers but stays lit as current finds a way round the break',
    ],
    answer: 1,
  },
  {
    id: 'b-m4-c4-b', moduleId: 'm4', pair: 'm4-c4', form: 'B',
    competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
    stem: 'Why is a current limiting resistor or driver fitted in series with a light emitting diode?',
    options: [
      'To turn the alternating mains supply into the direct current that the diode needs to light up',
      'To protect the diode from reverse voltage that would otherwise puncture the junction',
      'To make the diode switch on and off more quickly and crisply when it is pulsed',
      'To drop the supply to the diode forward voltage and hold the current at a safe value',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c5-a', moduleId: 'm4', pair: 'm4-c5', form: 'A',
    competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
    stem: 'What does the recorder in a closed circuit television system do?',
    options: [
      'It only supplies power to the cameras and does nothing with the pictures they send',
      'It focuses and aims each camera lens by remote control from the one central unit',
      'It receives the video from the cameras, stores it, and presents it for viewing',
      'It converts the camera signal into a radio broadcast that any receiver nearby can pick up',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c5-b', moduleId: 'm4', pair: 'm4-c5', form: 'B',
    competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
    stem: 'One camera in a working system shows no picture, while the others are normal. What does that prove about the recorder?',
    options: [
      'That the recorder is working, because it is displaying the other cameras',
      'That the recorder has failed on that one input and the whole unit needs replacing',
      'Nothing at all about the recorder can be told from a single dead camera',
      'That the recorder has filled its storage and cannot take the extra camera in',
    ],
    answer: 0,
  },
]
```

- [ ] **Step 2: Write `src/content/bank/m5.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m5Bank: BankItem[] = [
  {
    id: 'b-m5-c1-a', moduleId: 'm5', pair: 'm5-c1', form: 'A',
    competency: 'Demonstrate the procedure in CCTV system installation.',
    stem: 'Why is a camera normally mounted so that it does not face a window or a bright light?',
    options: [
      'Because daylight from a window will bleach the colour out of the lens coating over time',
      'Because the extra brightness makes the camera draw more current and the cable overheats',
      'Because the camera will expose for the bright area and leave the subject in silhouette',
      'Because the recorder is unable to store the picture at all when one part of the frame is very bright',
    ],
    answer: 2,
  },
  {
    id: 'b-m5-c1-b', moduleId: 'm5', pair: 'm5-c1', form: 'B',
    competency: 'Demonstrate the procedure in CCTV system installation.',
    stem: 'A camera at the far end of a long cable run has a dim, rolling picture, while the same camera works normally on a short lead at the recorder. What does that point to?',
    options: [
      'A faulty camera after all, since the fault has simply taken time to show itself',
      'Voltage lost along the cable run, so the camera is underpowered at its end',
      'A faulty recorder input that only drops out when that channel is selected',
      'The camera being mounted too high, so it is picking up electrical noise from the roof',
    ],
    answer: 1,
  },
  {
    id: 'b-m5-c2-a', moduleId: 'm5', pair: 'm5-c2', form: 'A',
    competency: 'Perform CCTV system servicing.',
    stem: 'Every camera on a system is dead at once. Where do you look first?',
    options: [
      'At what they share, which is the supply and the recorder',
      'At each camera in turn, starting with the one furthest away',
      'At the lens and focus of the first camera in the chain',
      'At the monitor cable running to the screen you are watching',
    ],
    answer: 0,
  },
  {
    id: 'b-m5-c2-b', moduleId: 'm5', pair: 'm5-c2', form: 'B',
    competency: 'Perform CCTV system servicing.',
    stem: 'You need to measure the supply voltage reaching a camera. What is true of that measurement?',
    options: [
      'It must be made with the system powered, because a voltage cannot be measured on a dead circuit',
      'It must be made with the system isolated first, the same as every other test on the run',
      'It can be taken with the system switched on or off and will read the same supply voltage either way',
      'It should be made with the camera unplugged, so only the cable is left in the reading',
    ],
    answer: 0,
  },
]
```

- [ ] **Step 3: Register both modules**

In `src/content/bank/index.ts`:

```ts
import { m4Bank } from './m4'
import { m5Bank } from './m5'

export const BANK: BankItem[] = [...m1Bank, ...m2Bank, ...m3Bank, ...m4Bank, ...m5Bank]
```

- [ ] **Step 4: Run the guard suite**

Run: `npx vitest run tests/bank.test.ts`
Expected: PASS, 12 tests, now covering 32 items. The bank has passed 24, so the key spread bound is now active. If it fails, re-key items rather than loosening the bound.

- [ ] **Step 5: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/bank
git commit -m "feat: add bank items for modules 4 and 5"
```

---

### Task 7: Bank items for Modules 6, 7 and 8

Six competencies, twelve items. Module 7 spans two subjects, fire alarm servicing and the introduction to audio, so its two pairs have nothing in common and should not be written to resemble each other.

**Files:**
- Create: `src/content/bank/m6.ts`, `src/content/bank/m7.ts`, `src/content/bank/m8.ts`
- Modify: `src/content/bank/index.ts`

**Interfaces:**
- Consumes: `BankItem` from `src/lib/types.ts`.
- Produces: `m6Bank`, `m7Bank`, `m8Bank`, all `BankItem[]`.

- [ ] **Step 1: Write `src/content/bank/m6.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m6Bank: BankItem[] = [
  {
    id: 'b-m6-c1-a', moduleId: 'm6', pair: 'm6-c1', form: 'A',
    competency: 'Discuss the principles of fire alarm systems.',
    stem: 'What is the purpose of the end of line resistor on a conventional detection zone?',
    options: [
      'To hold down the current drawn by all the detectors sitting on that one zone',
      'To drop the panel voltage to the lower level that the detectors are built to run on',
      'To sound the alarm on the panel the moment any detector on the zone is triggered',
      'To let the panel tell an open circuit fault from a healthy quiet zone',
    ],
    answer: 3,
  },
  {
    id: 'b-m6-c1-b', moduleId: 'm6', pair: 'm6-c1', form: 'B',
    competency: 'Discuss the principles of fire alarm systems.',
    stem: 'A manual call point and a smoke detector are on the same zone. What does the panel show when either operates?',
    options: [
      'An alarm on that zone, without saying which device it was',
      'A fault warning on that zone rather than a fire alarm signal',
      'The exact device that operated, named on the panel display',
      'Nothing at all until a second device on the zone also operates',
    ],
    answer: 0,
  },
  {
    id: 'b-m6-c2-a', moduleId: 'm6', pair: 'm6-c2', form: 'A',
    competency: 'Perform the procedure in fire alarm system installation.',
    stem: 'Why must detection cable be kept away from mains cable where the two run together?',
    options: [
      'Because the mains cable will chafe through the thinner detection cable over time',
      'Because the two cables share a colour and an installer would later confuse them',
      'Because interference coupled from the mains can produce false alarms and faults',
      'Because running beside the mains makes the detection cable heat up and its insulation fail',
    ],
    answer: 2,
  },
  {
    id: 'b-m6-c2-b', moduleId: 'm6', pair: 'm6-c2', form: 'B',
    competency: 'Perform the procedure in fire alarm system installation.',
    stem: 'After wiring a new zone, the panel reports an open circuit fault on it. What is the most likely cause?',
    options: [
      'Too many detectors were fitted to the zone for the panel to drive',
      'The panel needs its standby battery replaced before the zone will read',
      'The detectors were fitted the wrong way round, so their indicator lamps stay off',
      'The end of line resistor is missing or the loop is broken before it',
    ],
    answer: 3,
  },
]
```

- [ ] **Step 2: Write `src/content/bank/m7.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m7Bank: BankItem[] = [
  {
    id: 'b-m7-c1-a', moduleId: 'm7', pair: 'm7-c1', form: 'A',
    competency: 'Perform the procedure in fire alarm system servicing.',
    stem: 'A zone reads open when you measure it looking outward from the first junction. Where is the break?',
    options: [
      'Between the first junction and the last device',
      'Between the panel and the first junction, back the way you came',
      'Inside the panel itself, on the zone terminals',
      'The reading on its own cannot tell you which side the break is on',
    ],
    answer: 0,
  },
  {
    id: 'b-m7-c1-b', moduleId: 'm7', pair: 'm7-c1', form: 'B',
    competency: 'Perform the procedure in fire alarm system servicing.',
    stem: 'Before you disconnect a zone to test it, what must you do first?',
    options: [
      'Sound the sounders right through the building once, so that everyone there knows a test is about to begin',
      'Put the panel into a test or disabled state and tell the people responsible for the building',
      'Take out the panel standby battery so the zone cannot raise a signal while you work',
      'Nothing special is needed, a detection zone can be disconnected at any time without warning',
    ],
    answer: 1,
  },
  {
    id: 'b-m7-c2-a', moduleId: 'm7', pair: 'm7-c2', form: 'A',
    competency: 'Discuss audio products and systems.',
    stem: 'What does an amplifier do in an audio chain?',
    options: [
      'It changes the sound in the air into a small electrical signal to pass on down the chain',
      'It changes the electrical signal back into sound waves you can hear',
      'It raises a small signal to a level that can drive a loudspeaker',
      'It strips the unwanted noise and hiss out of the signal passing through',
    ],
    answer: 2,
  },
  {
    id: 'b-m7-c2-b', moduleId: 'm7', pair: 'm7-c2', form: 'B',
    competency: 'Discuss audio products and systems.',
    stem: 'In what order does a signal pass through a simple public address chain?',
    options: [
      'Loudspeaker, amplifier, mixer, microphone',
      'Microphone, mixer, amplifier, loudspeaker',
      'Amplifier, microphone, mixer, loudspeaker',
      'Mixer, microphone, loudspeaker, amplifier',
    ],
    answer: 1,
  },
]
```

- [ ] **Step 3: Write `src/content/bank/m8.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m8Bank: BankItem[] = [
  {
    id: 'b-m8-c1-a', moduleId: 'm8', pair: 'm8-c1', form: 'A',
    competency: 'Perform the installation and operation of audio products and systems.',
    stem: 'Why are the loudspeakers placed closer to the audience than the microphones are?',
    options: [
      'So the speaker cable runs stay short and lose less signal on the way',
      'So the audience can see the loudspeakers and know where the sound is coming from',
      'So the microphones do not pick up the loudspeakers and set up feedback',
      'So the amplifier sits further from the stage lights and runs a little cooler',
    ],
    answer: 2,
  },
  {
    id: 'b-m8-c1-b', moduleId: 'm8', pair: 'm8-c1', form: 'B',
    competency: 'Perform the installation and operation of audio products and systems.',
    stem: 'A system begins to howl as the volume is raised. What is happening?',
    options: [
      'The amplifier is being driven past its limit and the howl is the sound of it clipping',
      'Sound from a loudspeaker is reaching a microphone and going round the loop again',
      'A loudspeaker cone has split and is buzzing louder as the drive to it goes up',
      'The mains supply is sagging under load and the amplifier is complaining about it',
    ],
    answer: 1,
  },
  {
    id: 'b-m8-c2-a', moduleId: 'm8', pair: 'm8-c2', form: 'A',
    competency: 'Perform procedure in servicing audio products and systems.',
    stem: 'One channel of an amplifier is silent. You swap the input leads between channels and the silence stays where it was. What has that told you?',
    options: [
      'The fault is after the input, in the amplifier or its speaker path',
      'The fault is in the input lead that carries the signal into the silent channel',
      'The fault is in the source equipment driving that one channel',
      'Nothing useful can be drawn from a swap like that',
    ],
    answer: 0,
  },
  {
    id: 'b-m8-c2-b', moduleId: 'm8', pair: 'm8-c2', form: 'B',
    competency: 'Perform procedure in servicing audio products and systems.',
    stem: 'You measure a loudspeaker marked 8 ohms and read 6.4 ohms across its terminals. What does that mean?',
    options: [
      'The voice coil has some shorted turns in it, and those are what have pulled the reading down below the marked eight ohms',
      'The speaker is open circuit, and 6.4 ohms is the meter reading its own leads and the air gap',
      'The meter is faulty and is reading about a fifth low across the whole ohms range',
      'This is normal, because the marked figure is an impedance at frequency and the meter reads the coil resistance',
    ],
    answer: 3,
  },
]
```

- [ ] **Step 4: Register all three modules**

In `src/content/bank/index.ts`:

```ts
import { m6Bank } from './m6'
import { m7Bank } from './m7'
import { m8Bank } from './m8'

export const BANK: BankItem[] = [
  ...m1Bank, ...m2Bank, ...m3Bank, ...m4Bank, ...m5Bank, ...m6Bank, ...m7Bank, ...m8Bank,
]
```

- [ ] **Step 5: Run the guard suite**

Run: `npx vitest run tests/bank.test.ts`
Expected: PASS, 12 tests, now covering 44 items.

- [ ] **Step 6: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/content/bank
git commit -m "feat: add bank items for modules 6, 7 and 8"
```

---

### Task 8: Bank items for Module 9, and pin the bank size

Six competencies, twelve items, completing the bank at 56. This task also pins the total, so that a later refactor which silently drops a module file fails the build instead of quietly shortening every test.

**Files:**
- Create: `src/content/bank/m9.ts`
- Modify: `src/content/bank/index.ts`, `tests/bank.test.ts`

**Interfaces:**
- Consumes: `BankItem` from `src/lib/types.ts`.
- Produces: `m9Bank: BankItem[]`. After this task `BANK.length === 56` and every competency in the app has a matched pair.

- [ ] **Step 1: Write `src/content/bank/m9.ts`**

```ts
import type { BankItem } from '../../lib/types'

export const m9Bank: BankItem[] = [
  {
    id: 'b-m9-c1-a', moduleId: 'm9', pair: 'm9-c1', form: 'A',
    competency: 'Discuss television.',
    stem: 'Which board in a flat screen television has the aerial socket on it?',
    options: [
      'The main board',
      'The timing board',
      'The power supply board',
      'The backlight',
    ],
    answer: 0,
  },
  {
    id: 'b-m9-c1-b', moduleId: 'm9', pair: 'm9-c1', form: 'B',
    competency: 'Discuss television.',
    stem: 'A set has normal sound and answers the remote, but the screen is black. What has that already proved?',
    options: [
      'That only the power supply is working',
      'That the panel is cracked',
      'That the supply and the signal path are both alive',
      'That nothing is working except the standby circuit',
    ],
    answer: 2,
  },
  {
    id: 'b-m9-c2-a', moduleId: 'm9', pair: 'm9-c2', form: 'A',
    competency: 'Perform the procedure in servicing television.',
    stem: 'You shine a torch at a black screen at a shallow angle and see a faint but complete picture. What does that tell you?',
    options: [
      'The liquid crystal panel is cracked and the torch is just lighting up the broken part of it',
      'The picture is being produced correctly and only the light behind it is missing',
      'The main board has failed and the torch is picking up a frozen last frame',
      'The set has dropped into standby and the torch is showing the menu behind it',
    ],
    answer: 1,
  },
  {
    id: 'b-m9-c2-b', moduleId: 'm9', pair: 'm9-c2', form: 'B',
    competency: 'Perform the procedure in servicing television.',
    stem: 'Before touching any board inside a television, what must you have done?',
    options: [
      'Switched it to standby at the set, so the boards are no longer driven while you work',
      'Unplugged it at the wall and waited a minute before reaching in behind the panel',
      'Unplugged it, discharged the filter capacitors, and confirmed with a meter that they read close to zero volts',
      'Taken off the back cover and the stand so the boards can be reached without strain',
    ],
    answer: 2,
  },
  {
    id: 'b-m9-c3-a', moduleId: 'm9', pair: 'm9-c3', form: 'A',
    competency: 'Discuss control boards and motor controllers.',
    stem: 'What does a relay let a control board do?',
    options: [
      'Measure a voltage on the load side more accurately than the board could on its own',
      'Switch a load that draws far more current than the board itself could carry',
      'Turn the alternating mains on the load into the direct current the board runs on',
      'Hold the last state of the machine in memory for a while after the power is lost',
    ],
    answer: 1,
  },
  {
    id: 'b-m9-c3-b', moduleId: 'm9', pair: 'm9-c3', form: 'B',
    competency: 'Discuss control boards and motor controllers.',
    stem: 'A capacitor on a control board is visibly bulged. Why does that matter to the rest of the board?',
    options: [
      'It does not matter at all, as long as the board is still running for now',
      'It has become a dead short across the rail, so the board cannot power up at all any more',
      'It has lost capacitance, so the rail it smooths now carries ripple and the logic behaves unpredictably',
      'It blocks the signal path running through the board, so no data can get past that point once the capacitor has bulged',
    ],
    answer: 2,
  },
  {
    id: 'b-m9-c4-a', moduleId: 'm9', pair: 'm9-c4', form: 'A',
    competency: 'Perform the procedure in servicing control boards and motor controllers.',
    stem: 'A motor runs but will not stop when the limit switch operates. The switch tests good and the controller input changes state correctly. What do you suspect?',
    options: [
      'The limit switch after all, since a switch can test good and still fail under load',
      'The relay coil is open, so the relay never pulled in to run the motor at all',
      'The motor is faulty and is running on somehow with no drive reaching it',
      'The relay contacts have welded closed',
    ],
    answer: 3,
  },
  {
    id: 'b-m9-c4-b', moduleId: 'm9', pair: 'm9-c4', form: 'B',
    competency: 'Perform the procedure in servicing control boards and motor controllers.',
    stem: 'You find welded relay contacts and fit a new relay of the same type. Why is the job not finished?',
    options: [
      'Because a new relay has to be run in under light load for a while before it is trusted',
      'Because the controller has to be reprogrammed to recognise the replacement relay before it will drive it at all',
      'Because a new relay always needs its coil voltage set on a bench before it is fitted',
      'Because the contacts welded from switching more current than they are rated for, and that cause is still there',
    ],
    answer: 3,
  },
  {
    id: 'b-m9-c5-a', moduleId: 'm9', pair: 'm9-c5', form: 'A',
    competency: 'Discuss sensors and actuators.',
    stem: 'Which of these is a sensor rather than an actuator?',
    options: [
      'A thermistor',
      'A relay',
      'A solenoid',
      'A valve',
    ],
    answer: 0,
  },
  {
    id: 'b-m9-c5-b', moduleId: 'm9', pair: 'm9-c5', form: 'B',
    competency: 'Discuss sensors and actuators.',
    stem: 'A thermistor reads a plausible resistance. Is it proven good?',
    options: [
      'Yes, a resistance reading that sits within the normal range is enough to pass a thermistor',
      'No, because only a reading that changes when you warm it proves it responds',
      'Yes, as long as the circuit around the thermistor is also working normally',
      'No, because a thermistor in good order should read close to zero ohms cold',
    ],
    answer: 1,
  },
  {
    id: 'b-m9-c6-a', moduleId: 'm9', pair: 'm9-c6', form: 'A',
    competency: 'Perform the procedure in servicing sensors and actuators.',
    stem: 'Why is an actuator tested off the machine rather than in place?',
    options: [
      'Because a jammed mechanism and an open coil look identical until the actuator is free to move',
      'Because the meter probes cannot get to the actuator terminals while it is still in place',
      'Because a controller output can never supply the current an actuator needs to operate',
      'Because the actuator cannot be given its full rated signal while it is still wired into the machine',
    ],
    answer: 0,
  },
  {
    id: 'b-m9-c6-b', moduleId: 'm9', pair: 'm9-c6', form: 'B',
    competency: 'Perform the procedure in servicing sensors and actuators.',
    stem: 'A solenoid does not move when the machine calls for it, but it pulls in strongly when given its rated voltage on the bench. What does that tell you?',
    options: [
      'The solenoid coil must be open, and the strong pull felt on the bench came from the iron frame alone',
      'The solenoid is good, so the fault is the signal reaching it or a jam in the mechanism',
      'The controller output stage has certainly failed and will need to be replaced',
      'The solenoid should be replaced anyway, since it has shown itself to be unreliable',
    ],
    answer: 1,
  },
]
```

- [ ] **Step 2: Register Module 9**

In `src/content/bank/index.ts`:

```ts
import { m9Bank } from './m9'

export const BANK: BankItem[] = [
  ...m1Bank, ...m2Bank, ...m3Bank, ...m4Bank, ...m5Bank,
  ...m6Bank, ...m7Bank, ...m8Bank, ...m9Bank,
]
```

- [ ] **Step 3: Pin the size and require full coverage**

Replace the first test in `tests/bank.test.ts` with these two:

```ts
  // Pinned, not just non-zero: a refactor that dropped a module file would
  // otherwise leave every loop below quietly running on a shorter bank.
  it('holds two items for each of the 28 competencies', () => {
    expect(BANK.length).toBe(56)
  })

  it('covers every competency of every module', () => {
    for (const m of modules) {
      for (const c of m.competencies) {
        const forC = BANK.filter(i => i.moduleId === m.id && i.competency === c)
        expect(forC.map(i => i.form).sort(), `${m.id}: ${c}`).toEqual(['A', 'B'])
      }
    }
  })
```

- [ ] **Step 4: Run the guard suite**

Run: `npx vitest run tests/bank.test.ts`
Expected: PASS, 13 tests, covering all 56 items.

- [ ] **Step 5: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/bank tests/bank.test.ts
git commit -m "feat: complete the item bank with module 9"
```

---

### Task 9: Consent and participant identity

The spec requires that first launch shows a short editable consent screen and issues a participant code, that the name is optional, and that nothing leaves the device unless the student exports it. The store already issues a code in `freshState` and already has a `consentedAt` field that nothing sets. This task adds the screen and the gate.

The consent text is shown to sixteen and seventeen year olds, so it says plainly what is collected and where it goes. It does not ask for anything the app does not actually store.

**Files:**
- Create: `src/routes/Consent.tsx`
- Modify: `src/lib/store.ts`, `src/App.tsx`, `src/routes/ModuleMap.tsx`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: `loadState`, `saveState` from Task 1's store.
- Produces: `setConsent(name?: string): void` and `hasConsented(): boolean` in `src/lib/store.ts`; a `/consent` route.

- [ ] **Step 1: Write the failing tests**

Add `setConsent` and `hasConsented` to that file's import from `../src/lib/store`, then append:

```ts
describe('consent', () => {
  beforeEach(() => localStorage.clear())

  it('starts without consent', () => {
    expect(hasConsented()).toBe(false)
  })

  it('records consent with a timestamp', () => {
    setConsent()
    expect(hasConsented()).toBe(true)
    expect(loadState().participant.consentedAt).toBeDefined()
  })

  it('keeps an optional name', () => {
    setConsent('Maria')
    expect(loadState().participant.name).toBe('Maria')
  })

  it('stores no name when none is given', () => {
    setConsent()
    expect(loadState().participant.name).toBeUndefined()
  })

  it('trims a name and treats blank as none', () => {
    setConsent('   ')
    expect(loadState().participant.name).toBeUndefined()
  })

  it('leaves the participant code that was issued at first load', () => {
    const code = loadState().participant.code
    setConsent('Maria')
    expect(loadState().participant.code).toBe(code)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/store.test.ts`
Expected: FAIL, `hasConsented is not defined`.

- [ ] **Step 3: Add the store functions**

Append to `src/lib/store.ts`:

```ts
/**
 * Records consent. The participant code was issued when the store was first
 * created, so consenting never changes it: a student who consents keeps the
 * identity their earlier work is already filed under.
 */
export function setConsent(name?: string): void {
  update(s => {
    const trimmed = name?.trim()
    s.participant.consentedAt = new Date().toISOString()
    if (trimmed) s.participant.name = trimmed
  })
}

export function hasConsented(): boolean {
  return loadState().participant.consentedAt !== undefined
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the consent screen**

Create `src/routes/Consent.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { loadState, setConsent } from '../lib/store'

export default function Consent() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const code = loadState().participant.code

  function agree() {
    setConsent(name)
    navigate('/', { replace: true })
  }

  return (
    <div style={{ maxWidth: '60ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--ink)' }}>
        Before you start
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        This app is part of a study your teacher is running on how well an interactive
        resource helps you learn Electronics Products Assembly and Servicing.
      </p>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 14, padding: 16, margin: '0 0 18px',
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 660, margin: '0 0 10px' }}>What is recorded</h2>
        <ul style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Your answers to the quizzes and the tests, and how you used the simulations.</li>
          <li style={{ marginBottom: 6 }}>A participant code, <strong style={{ color: 'var(--ink)' }}>{code}</strong>, which identifies your work.</li>
          <li style={{ marginBottom: 6 }}>Your name, only if you choose to give it below.</li>
        </ul>
        <h2 style={{ fontSize: 13, fontWeight: 660, margin: '16px 0 10px' }}>Where it goes</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
          Everything stays on this device. Nothing is sent anywhere. Your teacher receives
          your results only when you choose to export them and hand them in. You can take
          part without giving your name, and you can stop at any time.
        </p>
      </div>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '0 0 6px', color: 'var(--ink)' }}>
        Your name (optional)
      </label>
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder="Leave blank to stay anonymous"
        style={{
          width: '100%', maxWidth: 320, minHeight: 44, padding: '10px 12px',
          borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 14, color: 'var(--ink)', margin: '0 0 18px',
        }} />

      <div>
        <button onClick={agree} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
          background: 'var(--accent)', color: 'var(--on-accent)',
          font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          I understand, start learning
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Add the route and the gate**

In `src/App.tsx`, import the screen and add its route before the catch-all:

```tsx
import Consent from './routes/Consent'
```

```tsx
  { path: '/consent', element: <Shell><Consent /></Shell> },
```

In `src/routes/ModuleMap.tsx`, send a student who has not consented to the screen. Add the imports at the top of the file:

```tsx
import { Navigate } from 'react-router'
import { hasConsented } from '../lib/store'
```

and make the first statement of the component:

```tsx
  if (!hasConsented()) return <Navigate to="/consent" replace />
```

The gate sits on the map rather than in `Shell`, so that the consent screen itself is reachable without recursing through the gate.

- [ ] **Step 7: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 8: Verify in the browser**

Run: `npm run dev`

Clear site data, then load the app. Confirm the consent screen appears, that the participant code shown matches `localStorage` under `epas.v1`, that agreeing without a name leaves `participant.name` unset, and that reloading afterwards goes straight to the module map.

- [ ] **Step 9: Commit**

```bash
git add src/routes/Consent.tsx src/lib/store.ts src/App.tsx src/routes/ModuleMap.tsx tests/store.test.ts
git commit -m "feat: add the consent screen and participant identity"
```

---

### Task 10: The pre-test and post-test runner

The screen that draws a form, collects answers, records them against the right context, and reports a score. It deliberately does not show which items were wrong: the same student sits the matched form after the module, and telling them the answers now would teach them between the two measurements.

`Quiz.tsx` is not reused. It exists to give instant feedback with a rationale on every option, which is the opposite of what a test needs, and `BankItem` carries no rationale to show.

**Files:**
- Create: `src/routes/Assessment.tsx`
- Modify: `src/App.tsx`, `src/routes/ModuleOverview.tsx`

**Interfaces:**
- Consumes: `bankFor` (Task 4), `gradeForm` (Task 3), `newRunId`, `recordAttempt`, `hasTaken` (Task 1), `getModule` from `src/content`.
- Produces: the route `/m/:moduleId/test/:phase` where `phase` is `pre` or `post`.

- [ ] **Step 1: Write the runner**

Create `src/routes/Assessment.tsx`:

```tsx
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getModule } from '../content'
import { bankFor } from '../content/bank'
import { competencyGains, gradeForm } from '../lib/assess'
import { attemptsFor, hasTaken, newRunId, recordAttempt } from '../lib/store'
import type { AttemptContext } from '../lib/store'

const PHASES = {
  pre: { form: 'A', context: 'pretest', title: 'Pre-test' },
  post: { form: 'B', context: 'posttest', title: 'Post-test' },
} as const

export default function Assessment() {
  const { moduleId = '', phase = '' } = useParams()
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [done, setDone] = useState<{ correct: number; total: number } | null>(null)

  const spec = phase === 'pre' || phase === 'post' ? PHASES[phase] : undefined
  const module = getModule(moduleId)

  if (!spec || !module) {
    return <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>That test does not exist.</p>
  }

  const items = bankFor(moduleId, spec.form)
  const ready = items.every(i => responses[i.id] !== undefined)
  const retake = hasTaken(moduleId, spec.context as AttemptContext)

  function submit() {
    const runId = newRunId()
    const at = new Date().toISOString()
    for (const item of items) {
      recordAttempt({
        itemId: item.id,
        moduleId,
        competency: item.competency,
        correct: responses[item.id] === item.answer,
        at,
        context: spec!.context as AttemptContext,
        runId,
      })
    }
    setDone(gradeForm(items, responses))
  }

  if (items.length === 0) {
    return <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>This module has no test yet.</p>
  }

  if (done) {
    // Only the post-test has something to compare against. `measured` counts
    // the competencies the student actually sat on both sides, so a partly
    // completed pair reports honestly instead of counting a missing pre-test
    // as a competency not yet held.
    const gains = phase === 'post'
      ? competencyGains(attemptsFor(moduleId, 'pretest'), attemptsFor(moduleId, 'posttest'))
      : []
    const gained = gains.filter(g => g.gained).length
    const measured = gains.filter(g => g.pre !== null && g.post !== null).length

    return (
      <div style={{ maxWidth: '60ch' }}>
        <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          {spec.title} complete
        </h1>
        <p role="status" style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-2)', margin: '0 0 6px' }}>
          You answered {done.correct} of {done.total} correctly.
        </p>

        {phase === 'pre' && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 18px' }}>
            The answers are not shown, because you will sit a matching test on the same
            competencies after the module and seeing them now would change the result.
          </p>
        )}

        {phase === 'post' && measured > 0 && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 18px' }}>
            Comparing this with your pre-test, there {gained === 1 ? 'is' : 'are'} {gained} of {measured} competencies
            you answer correctly now and did not before.
          </p>
        )}

        {phase === 'post' && measured === 0 && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 18px' }}>
            There is no pre-test on this module to compare this with.
          </p>
        )}

        <Link to={`/m/${moduleId}`} style={{ fontSize: 14, color: 'var(--accent)' }}>
          Back to {module.title}
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '60ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        {spec.title}: {module.title}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px' }}>
        {items.length} questions, one for each competency in this module. Answer every one,
        then submit. You will not be told which answers were right.
      </p>
      {retake && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
          You have taken this before. Submitting again replaces your earlier result.
        </p>
      )}

      <div style={{ margin: '18px 0 0' }}>
        {items.map((item, n) => (
          <fieldset key={item.id} style={{
            border: '1px solid var(--line)', borderRadius: 14, padding: 16,
            margin: '0 0 12px', background: 'var(--surface)',
          }}>
            <legend style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '0 6px' }}>
              Question {n + 1}
            </legend>
            <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.55, margin: '0 0 10px', color: 'var(--ink)' }}>
              {item.stem}
            </p>
            {item.options.map((opt, i) => (
              <label key={i} style={{
                display: 'flex', gap: 9, alignItems: 'flex-start', minHeight: 44,
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)',
              }}>
                <input type="radio" name={item.id}
                  checked={responses[item.id] === i}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: i }))}
                  style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
                <span>{opt}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <button onClick={submit} disabled={!ready} className="tile" style={{
        minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
        background: ready ? 'var(--accent)' : 'var(--line)',
        color: ready ? 'var(--on-accent)' : 'var(--ink-3)',
        font: 'inherit', fontSize: 14, fontWeight: 600,
        cursor: ready ? 'pointer' : 'default',
      }}>
        {ready ? 'Submit' : `Answer all ${items.length} to submit`}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add the route**

In `src/App.tsx`:

```tsx
import Assessment from './routes/Assessment'
```

```tsx
  { path: '/m/:moduleId/test/:phase', element: <Shell><Assessment /></Shell> },
```

- [ ] **Step 3: Link the tests from the module overview**

In `src/routes/ModuleOverview.tsx`, add the two entry points. Import at the top:

```tsx
import { hasTaken } from '../lib/store'
```

and render this block above the outcome list, inside the component where `module` is already in scope:

```tsx
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 20px' }}>
        <Link to={`/m/${module.id}/test/pre`} className="tile" style={{
          minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '10px 14px',
          borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
          fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none',
        }}>
          Pre-test{hasTaken(module.id, 'pretest') ? ' (taken)' : ''}
        </Link>
        <Link to={`/m/${module.id}/test/post`} className="tile" style={{
          minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '10px 14px',
          borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
          fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none',
        }}>
          Post-test{hasTaken(module.id, 'posttest') ? ' (taken)' : ''}
        </Link>
      </div>
```

If `Link` is not already imported in that file, add it to the existing `react-router` import.

- [ ] **Step 4: Run the whole suite and typecheck**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 5: Verify the flow in the browser**

Run: `npm run dev`

For Module 1, which has three competencies:

1. Open the module and take the pre-test. Confirm it shows three questions, that Submit is disabled until all three are answered, and that the result reports a count and no answers.
2. In dev tools, read `localStorage` key `epas.v1`. Confirm three attempts exist with `context: 'pretest'`, that they share one `runId`, and that each carries the competency string of its item.
3. Take the post-test. Confirm the questions differ from the pre-test.
4. Retake the pre-test. Confirm the overview shows the taken markers, and that `attemptsFor('m1', 'pretest')` would return only the second sitting because the two runs have different ids.
5. At 375 px wide, confirm no horizontal scrolling and that every radio row is at least 44 px tall.

- [ ] **Step 6: Commit**

```bash
git add src/routes/Assessment.tsx src/App.tsx src/routes/ModuleOverview.tsx
git commit -m "feat: add the pre-test and post-test runner"
```

---

## Verification

After Task 10, the following must all hold:

- `npx tsc -b` exits 0 and `npm test` is green.
- `BANK.length === 56`, and every one of the 28 competencies has exactly one A item and one B item.
- No bank item id collides with any of the 84 formative quiz ids.
- Every bank item's competency string appears verbatim in its module's `competencies`.
- No em dash appears in any stem or option.
- Naming a fault in the troubleshooter is impossible until at least one test point has been run.
- A simulation mounted through `BlockRenderer` receives an `onEvent` handler when one is supplied.
- A fresh browser profile is sent to `/consent` and cannot reach the module map until consent is recorded.
- Taking a test twice leaves both runs in `attempts`, and `attemptsFor` returns only the later one.

## What this plan does not build

These belong to the next plan and are named here so no implementer improvises them:

- The ISO/IEC 25010 evaluation survey.
- CSV and JSON export at `/progress`, and the teacher merge tool at `/teacher`.
- The eight performance task sheets.
- PWA packaging, the service worker, and deployment.
