# EPAS Research Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the study's data off the students' devices and into a form the teacher can analyse, and collect the ISO/IEC 25010 evaluation that the paper reports alongside the learning gains.

**Architecture:** One pure engine, `src/lib/export.ts`, turns a store into a JSON bundle and into a single CSV row. The student's own export at `/progress` and the teacher's class merge at `/teacher` both call it, so a merged class file is a concatenation of student rows under one shared header rather than a second format that can drift. The survey is twenty items in a data file, answered at `/evaluate` and written into the store the same way every other response is.

**Tech Stack:** Vite, React 19, TypeScript (strict), React Router (`createHashRouter`), Vitest. No new dependencies: CSV is written by hand and files are read with the `File` API.

**Spec:** `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` (sections 7 and 8 bind this plan)

**Prior plans:** foundation-and-m1, flagship-sims-m2-m3, activities-m4, sequence-m5-m7, m8-m9, assessment. All merged. Deferred items in `docs/superpowers/plans/CARRY-FORWARD.md`.

## Global Constraints

- **The export MUST exclude a student who declined the study.** `src/lib/store.ts` exports `inStudy()`. The consent screen tells a declining student that "nothing of yours is included in what your teacher reports". A missing `research` field on an older record means **unknown, not yes**.
- **No em dashes, en dashes or horizontal bars** in any user-visible copy.
- Red (`var(--danger)`) is reserved for physical safety hazards only. Never for an error, a warning, or emphasis.
- All `localStorage` access goes through `src/lib/store.ts`. No component touches storage directly.
- Logic goes in pure, total, unit-tested functions under `src/lib/`. The UI is not unit-tested; it is checked in a browser.
- TypeScript strict, including `noUnusedLocals`, `noUnusedParameters` and `noUncheckedIndexedAccess`.
- No new dependencies.
- Routing stays on `createHashRouter` with Vite `base: './'`.
- Design tokens only, no raw hex. Interactive targets at least 44px tall. Radius 14 for cards, 10 for controls.
- `src/lib/diagnose.ts` is frozen.

## Design decisions this plan locks in

**The student CSV and the teacher CSV are the same shape.** One header, one row per student. The teacher merge concatenates rows; it does not transform them. This means a single tested function produces both, and a teacher who collects one file or thirty gets a table with identical columns either way.

**Columns are keyed by pair id, not by competency text.** The 28 competency strings are long sentences with commas and full stops, which make miserable CSV headers. Every bank item already carries a stable `pair` like `m1-c1`, so a competency becomes `pre__m1_c1`, `post__m1_c1`, `gain__m1_c1`. Because that makes the table unreadable on its own, `/teacher` also emits a **codebook** CSV mapping each pair id to its module and its full competency text. The codebook is not optional; without it the data file cannot be interpreted by a reader of the paper.

**An attempt stores the competency text, not the pair id.** `Attempt` has `moduleId` and `competency`. The export resolves those back to a pair id through `BANK`. A competency with no matching bank item is a data error, not something to silently drop, so the engine reports it.

**The survey is answered once and can be revised.** Responses live in `StoreV1.survey`, which already exists as `Record<string, number | string>`. Item ids map to 1..5, plus `respondent` and `comments`. Re-answering overwrites; there is no run history, because the survey measures an opinion of the app rather than a performance that can improve.

---

## File Structure

**Create:**

| File | Responsibility |
|---|---|
| `src/content/survey.ts` | The twenty ISO/IEC 25010 items and their five categories |
| `src/lib/export.ts` | Pure: CSV quoting, the JSON bundle, header and row builders, the codebook, bundle parsing |
| `src/routes/Evaluate.tsx` | The survey screen |
| `src/routes/Progress.tsx` | Mastery view and the student's two download buttons |
| `src/routes/Teacher.tsx` | PIN gate, file intake, class merge, two downloads |
| `src/ui/download.ts` | One helper that turns text into a file the browser saves |
| `tests/export.test.ts` | The engine's unit tests |
| `tests/survey.test.ts` | Guard suite over the survey data |

**Modify:**

| File | Change |
|---|---|
| `src/lib/types.ts` | Add `SurveyCategory`, `SurveyItem`, `RespondentType` |
| `src/lib/store.ts` | Add `setSurvey`, `surveyAnswers` |
| `src/App.tsx` | Add `/evaluate`, `/progress`, `/teacher` routes |
| `src/ui/Shell.tsx` | Nav gains an Evaluate entry; `/teacher` stays unlinked |

---

### Task 1: The survey instrument as data

Twenty items, five ISO/IEC 25010 categories, four each. The spec requires that all twenty live in a data file and can be replaced without code changes, so nothing outside `src/content/survey.ts` may hardcode an item, a category, or the count.

The wording targets a Grade 12 student reading English as a second language, while still being answerable by a teacher or an expert validator, because all three respondent types answer the same twenty items.

**Files:**
- Create: `src/content/survey.ts`, `tests/survey.test.ts`
- Modify: `src/lib/types.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `SURVEY_CATEGORIES: readonly SurveyCategory[]`, `SURVEY: SurveyItem[]`, `LIKERT: readonly string[]` (in `src/content/survey.ts`); `SurveyCategory`, `SurveyItem`, `RespondentType` (in `src/lib/types.ts`).

- [ ] **Step 1: Add the types**

Append to `src/lib/types.ts`:

```ts
export type SurveyCategory =
  | 'Functional Suitability'
  | 'Reliability'
  | 'Usability'
  | 'Performance Efficiency'
  | 'Portability'

/** Who is answering. The paper reports the three groups separately. */
export type RespondentType = 'student' | 'teacher' | 'expert'

/**
 * One ISO/IEC 25010 evaluation statement, answered on a five point Likert
 * scale. The id is the CSV column name, so it must stay stable once data
 * has been collected: changing it silently renames a column mid-study.
 */
export interface SurveyItem {
  id: string
  category: SurveyCategory
  text: string
}
```

- [ ] **Step 2: Write the survey data**

Create `src/content/survey.ts`:

```ts
import type { SurveyCategory, SurveyItem } from '../lib/types'

export const SURVEY_CATEGORIES: readonly SurveyCategory[] = [
  'Functional Suitability',
  'Reliability',
  'Usability',
  'Performance Efficiency',
  'Portability',
]

/** Index 0 is the value 1. A five point agreement scale. */
export const LIKERT: readonly string[] = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
]

/**
 * The evaluation instrument. Four items per category, twenty in all.
 * Every item is worded so that agreeing is the favourable answer, because
 * a mixed direction invites a student to tick one column down the page and
 * makes the reversed items look like disagreement in the raw table.
 */
export const SURVEY: SurveyItem[] = [
  { id: 'fs1', category: 'Functional Suitability', text: 'The app covers the EPAS topics I need for this subject.' },
  { id: 'fs2', category: 'Functional Suitability', text: 'The lessons and tests match what our Budget of Work says we should learn.' },
  { id: 'fs3', category: 'Functional Suitability', text: 'The simulations behave the way the real equipment does.' },
  { id: 'fs4', category: 'Functional Suitability', text: 'The app does what I expect it to do when I use it.' },

  { id: 'rl1', category: 'Reliability', text: 'The app keeps working without crashing or freezing.' },
  { id: 'rl2', category: 'Reliability', text: 'My answers and my progress are still there when I come back to it.' },
  { id: 'rl3', category: 'Reliability', text: 'The app keeps working when the internet connection drops.' },
  { id: 'rl4', category: 'Reliability', text: 'When something goes wrong, I can carry on without losing my work.' },

  { id: 'us1', category: 'Usability', text: 'I could work out how to use the app without being taught.' },
  { id: 'us2', category: 'Usability', text: 'It is easy to find the module or the lesson I am looking for.' },
  { id: 'us3', category: 'Usability', text: 'The text and the diagrams are easy to read on my device.' },
  { id: 'us4', category: 'Usability', text: 'The app looks clear and tidy rather than cluttered.' },

  { id: 'pe1', category: 'Performance Efficiency', text: 'The app opens quickly on my device.' },
  { id: 'pe2', category: 'Performance Efficiency', text: 'Screens and simulations respond without me having to wait.' },
  { id: 'pe3', category: 'Performance Efficiency', text: 'The app does not slow my device down while I am using it.' },
  { id: 'pe4', category: 'Performance Efficiency', text: 'The app still works well on an older or cheaper phone.' },

  { id: 'po1', category: 'Portability', text: 'The app works on the device I normally use.' },
  { id: 'po2', category: 'Portability', text: 'The app works on a phone and on a computer alike.' },
  { id: 'po3', category: 'Portability', text: 'Installing or opening the app was straightforward.' },
  { id: 'po4', category: 'Portability', text: 'I could use this app in place of a printed module or handout.' },
]
```

- [ ] **Step 3: Write the guard suite**

Create `tests/survey.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { LIKERT, SURVEY, SURVEY_CATEGORIES } from '../src/content/survey'

describe('the evaluation instrument', () => {
  it('holds twenty items', () => {
    expect(SURVEY.length).toBe(20)
  })

  it('gives every category four items', () => {
    for (const c of SURVEY_CATEGORIES) {
      const n = SURVEY.filter((i) => i.category === c).length
      expect(n, `${c} has ${n} items`).toBe(4)
    }
  })

  it('uses no category outside the five declared', () => {
    for (const i of SURVEY) {
      expect(SURVEY_CATEGORIES, i.id).toContain(i.category)
    }
  })

  // The id is a CSV column name. A duplicate silently merges two questions
  // into one column and the merge is invisible in the output.
  it('gives every item a unique id', () => {
    const ids = SURVEY.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // `respondent` and `comments` share the survey record with the item ids.
  it('uses no id that collides with the two reserved keys', () => {
    for (const i of SURVEY) {
      expect(['respondent', 'comments'], i.id).not.toContain(i.id)
    }
  })

  it('offers a five point scale', () => {
    expect(LIKERT.length).toBe(5)
  })

  it('asks every item as a statement a respondent can agree with', () => {
    for (const i of SURVEY) {
      expect(i.text.endsWith('.'), `${i.id} does not end in a full stop`).toBe(true)
      expect(i.text.includes('?'), `${i.id} is phrased as a question`).toBe(false)
    }
  })

  it('uses no long dashes in anything a respondent reads', () => {
    for (const i of SURVEY) {
      expect(/[–—―]/.test(i.text), i.id).toBe(false)
    }
  })
})
```

- [ ] **Step 4: Run the suite**

Run: `npx vitest run tests/survey.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Typecheck and run the whole suite**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass; the suite grows from 139 to 147.

- [ ] **Step 6: Commit**

```bash
git add src/content/survey.ts src/lib/types.ts tests/survey.test.ts
git commit -m "feat: add the ISO 25010 evaluation instrument as data"
```

---

### Task 2: Storing survey answers, and the `/evaluate` screen

`StoreV1.survey` already exists as an optional `Record<string, number | string>` and nothing writes to it. This task gives it an owner and a screen.

**Files:**
- Create: `src/routes/Evaluate.tsx`
- Modify: `src/lib/store.ts`, `src/App.tsx`, `src/ui/Shell.tsx`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: `SURVEY`, `SURVEY_CATEGORIES`, `LIKERT` from `src/content/survey.ts`; `RespondentType` from `src/lib/types.ts`.
- Produces: `setSurvey(answers: Record<string, number | string>): void` and `surveyAnswers(): Record<string, number | string>` in `src/lib/store.ts`; the route `/evaluate`.

- [ ] **Step 1: Write the failing tests**

Add `setSurvey`, `surveyAnswers` and `resetAll` to the existing `../src/lib/store` import in `tests/store.test.ts`. None of the three is imported there today. Then append:

```ts
describe('survey answers', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    expect(surveyAnswers()).toEqual({})
  })

  it('keeps what was answered', () => {
    setSurvey({ fs1: 4, respondent: 'student' })
    expect(surveyAnswers()).toEqual({ fs1: 4, respondent: 'student' })
  })

  // The survey measures an opinion, not a performance, so a second pass is
  // a correction rather than a new attempt. There is no run history here.
  it('replaces an earlier answer rather than appending to it', () => {
    setSurvey({ fs1: 2 })
    setSurvey({ fs1: 5 })
    expect(surveyAnswers()).toEqual({ fs1: 5 })
  })

  it('survives a reload through the store', () => {
    setSurvey({ us1: 3, comments: 'the torch test was the clearest part' })
    expect(loadState().survey).toEqual({ us1: 3, comments: 'the torch test was the clearest part' })
  })

  it('is cleared when the device is handed to a new participant', () => {
    setSurvey({ fs1: 4 })
    resetAll()
    expect(surveyAnswers()).toEqual({})
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/store.test.ts`
Expected: FAIL, `setSurvey is not defined`.

- [ ] **Step 3: Add the store functions**

Append to `src/lib/store.ts`:

```ts
/**
 * Replaces the whole survey record. The survey is an opinion of the app
 * rather than a performance that can improve, so a second pass corrects
 * the first instead of being kept beside it as another run.
 */
export function setSurvey(answers: Record<string, number | string>): void {
  update(s => { s.survey = { ...answers } })
}

export function surveyAnswers(): Record<string, number | string> {
  return loadState().survey ?? {}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the survey screen**

Create `src/routes/Evaluate.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router'
import { LIKERT, SURVEY, SURVEY_CATEGORIES } from '../content/survey'
import { setSurvey, surveyAnswers } from '../lib/store'
import type { RespondentType } from '../lib/types'

const RESPONDENTS: { value: RespondentType; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'expert', label: 'Expert validator' },
]

export default function Evaluate() {
  const [answers, setAnswers] = useState<Record<string, number | string>>(() => surveyAnswers())
  const [saved, setSaved] = useState(false)

  const answered = SURVEY.filter(i => typeof answers[i.id] === 'number').length
  const ready = answered === SURVEY.length && typeof answers.respondent === 'string'

  function set(key: string, value: number | string) {
    setSaved(false)
    setAnswers(a => ({ ...a, [key]: value }))
  }

  function save() {
    setSurvey(answers)
    setSaved(true)
  }

  return (
    <div style={{ maxWidth: '60ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        Evaluate this app
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px' }}>
        Twenty statements about the app itself, not about what you learned. Say how far you
        agree with each one. Your answers stay on this device until you export them.
      </p>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 18px' }}>
        {answered} of {SURVEY.length} answered
      </p>

      <fieldset style={{
        border: '1px solid var(--line)', borderRadius: 14, padding: 16,
        margin: '0 0 16px', background: 'var(--surface)',
      }}>
        <legend style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '0 6px' }}>
          Answering as
        </legend>
        {RESPONDENTS.map(r => (
          <label key={r.value} style={{
            display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
            padding: '4px 6px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13.5, color: 'var(--ink-2)',
          }}>
            <input type="radio" name="respondent"
              checked={answers.respondent === r.value}
              onChange={() => set('respondent', r.value)}
              style={{ accentColor: 'var(--accent)' }} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>

      {SURVEY_CATEGORIES.map(category => (
        <section key={category} style={{ margin: '0 0 16px' }}>
          <h2 style={{
            fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--ink-3)', margin: '0 0 8px',
          }}>{category}</h2>

          {SURVEY.filter(i => i.category === category).map(item => (
            <fieldset key={item.id} style={{
              border: '1px solid var(--line)', borderRadius: 14, padding: 14,
              margin: '0 0 10px', background: 'var(--surface)',
            }}>
              <legend style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, padding: '0 6px', color: 'var(--ink)' }}>
                {item.text}
              </legend>
              {LIKERT.map((label, n) => (
                <label key={label} style={{
                  display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
                  padding: '4px 6px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13.5, color: 'var(--ink-2)',
                }}>
                  <input type="radio" name={item.id}
                    checked={answers[item.id] === n + 1}
                    onChange={() => set(item.id, n + 1)}
                    style={{ accentColor: 'var(--accent)' }} />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </section>
      ))}

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '0 0 6px', color: 'var(--ink)' }}>
        Anything else you want to say (optional)
      </label>
      <textarea
        value={typeof answers.comments === 'string' ? answers.comments : ''}
        onChange={e => set('comments', e.target.value)}
        rows={4}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
          margin: '0 0 18px', resize: 'vertical',
        }} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={!ready} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
          background: ready ? 'var(--accent)' : 'var(--line)',
          color: ready ? 'var(--on-accent)' : 'var(--ink-3)',
          font: 'inherit', fontSize: 14, fontWeight: 600,
          cursor: ready ? 'pointer' : 'default',
        }}>
          {ready ? 'Save my answers' : 'Answer every statement to save'}
        </button>
        {saved && (
          <span role="status" style={{ fontSize: 13, color: 'var(--pass)' }}>
            Saved on this device.
          </span>
        )}
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '18px 0 0' }}>
        Your answers go to your teacher only when you hand them in from{' '}
        <Link to="/progress" style={{ color: 'var(--accent)' }}>Progress</Link>.
      </p>
    </div>
  )
}
```

- [ ] **Step 6: Add the route and the nav entry**

In `src/App.tsx`, import the screen and add its route before the catch-all:

```tsx
import Evaluate from './routes/Evaluate'
```

```tsx
  { path: '/evaluate', element: <Shell><Evaluate /></Shell> },
```

In `src/ui/Shell.tsx`, add the nav entry. `/teacher` is deliberately absent from the nav; it is reached by typing the address.

```tsx
const NAV = [
  { to: '/', label: 'Modules' },
  { to: '/labs', label: 'Labs' },
  { to: '/progress', label: 'Progress' },
  { to: '/evaluate', label: 'Evaluate' },
]
```

- [ ] **Step 7: Typecheck and run the whole suite**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 8: Check it in a browser**

Run: `npm run dev`

Consent first, then open Evaluate. Confirm: the counter climbs as you answer; Save stays disabled until all twenty items and the respondent type are set; after saving, `localStorage` key `epas.v1` holds a `survey` object with twenty numeric keys plus `respondent`; reopening the page shows your answers still selected; at 375px there is no horizontal scrolling and every radio row is at least 44px tall.

- [ ] **Step 9: Commit**

```bash
git add src/routes/Evaluate.tsx src/lib/store.ts src/App.tsx src/ui/Shell.tsx tests/store.test.ts
git commit -m "feat: add the evaluation survey screen"
```

---

### Task 3: CSV primitives and the JSON bundle

The two lowest layers of the export, both pure. CSV quoting gets its own tests because it is the part that quietly corrupts a data file: a competency string or a student's free-text comment containing a comma, a quote or a newline will split a row into two if the quoting is wrong, and nothing about the resulting file looks broken until it is loaded into statistical software.

**Files:**
- Create: `src/lib/export.ts`, `tests/export.test.ts`

**Interfaces:**
- Consumes: `StoreV1` from `src/lib/store.ts`.
- Produces: `csvCell`, `csvLine`, `toCsv`, `ExportBundle`, `toBundle`, `parseBundle` in `src/lib/export.ts`.

- [ ] **Step 1: Write the failing tests**

Create `tests/export.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { StoreV1 } from '../src/lib/store'
import { csvCell, csvLine, parseBundle, toBundle, toCsv } from '../src/lib/export'

function state(over: Partial<StoreV1> = {}): StoreV1 {
  return {
    schemaVersion: 1,
    participant: { code: 'EPAS-AAAA11' },
    modules: {},
    attempts: [],
    sims: [],
    ...over,
  }
}

describe('csvCell', () => {
  it('leaves a plain value alone', () => {
    expect(csvCell('m1')).toBe('m1')
  })

  it('renders a number without quoting it', () => {
    expect(csvCell(1)).toBe('1')
  })

  it('renders null and undefined as an empty cell', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })

  // Each of these splits a row in two, or shifts every later column by one,
  // if it is not quoted. None of them looks wrong in the file.
  it('quotes a value containing a comma', () => {
    expect(csvCell('Discuss soldering, and desoldering')).toBe('"Discuss soldering, and desoldering"')
  })

  it('quotes a value containing a newline', () => {
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"')
  })

  it('doubles an inner quote and wraps the cell', () => {
    expect(csvCell('he said "isolate it first"')).toBe('"he said ""isolate it first"""')
  })

  it('quotes a value with a leading or trailing space, which some readers trim', () => {
    expect(csvCell(' padded ')).toBe('" padded "')
  })
})

describe('csvLine and toCsv', () => {
  it('joins cells with commas', () => {
    expect(csvLine(['a', 'b', 'c'])).toBe('a,b,c')
  })

  it('separates rows with a carriage return and newline', () => {
    expect(toCsv([['a'], ['b']])).toBe('a\r\nb')
  })

  it('keeps an empty trailing cell rather than dropping it', () => {
    expect(csvLine(['a', ''])).toBe('a,')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})

describe('toBundle', () => {
  it('wraps the state with a format marker and a timestamp', () => {
    const b = toBundle(state(), '2026-09-12T00:00:00.000Z')
    expect(b.format).toBe('epas-export')
    expect(b.formatVersion).toBe(1)
    expect(b.exportedAt).toBe('2026-09-12T00:00:00.000Z')
    expect(b.state.participant.code).toBe('EPAS-AAAA11')
  })

  it('copies the state rather than aliasing it', () => {
    const s = state()
    const b = toBundle(s, '2026-09-12T00:00:00.000Z')
    b.state.participant.code = 'CHANGED'
    expect(s.participant.code).toBe('EPAS-AAAA11')
  })
})

describe('parseBundle', () => {
  it('reads back what toBundle wrote', () => {
    const text = JSON.stringify(toBundle(state(), '2026-09-12T00:00:00.000Z'))
    const r = parseBundle(text)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.bundle.state.participant.code).toBe('EPAS-AAAA11')
  })

  // The teacher drops a folder of files onto this. Some of them will not be
  // exports, and the tool has to say which rather than throwing.
  it('rejects text that is not JSON', () => {
    const r = parseBundle('not json at all')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/not valid JSON/i)
  })

  it('rejects JSON that is not an export', () => {
    const r = parseBundle('{"hello":"world"}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/not an EPAS export/i)
  })

  it('rejects an export written by a newer version of the app', () => {
    const r = parseBundle('{"format":"epas-export","formatVersion":99,"exportedAt":"x","state":{}}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/newer version/i)
  })

  it('rejects an export whose state has no participant code', () => {
    const r = parseBundle('{"format":"epas-export","formatVersion":1,"exportedAt":"x","state":{"schemaVersion":1}}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/participant code/i)
  })

  it('rejects an empty file', () => {
    expect(parseBundle('').ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/export.test.ts`
Expected: FAIL, cannot resolve `../src/lib/export`.

- [ ] **Step 3: Write the primitives**

Create `src/lib/export.ts`:

```ts
import type { StoreV1 } from './store'

export type Cell = string | number | boolean | null | undefined

/**
 * One CSV cell, quoted per RFC 4180. A comma, a quote, a newline or an edge
 * space all change how a reader parses the row, and a competency string or a
 * student's free text comment can carry any of them. Getting this wrong
 * shifts columns silently rather than producing a file that looks broken.
 */
export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  const needsQuotes = /[",\r\n]/.test(s) || s !== s.trim()
  return needsQuotes ? `"${s.replace(/"/g, '""')}"` : s
}

export function csvLine(cells: Cell[]): string {
  return cells.map(csvCell).join(',')
}

/** Rows joined with CRLF, which is what RFC 4180 and Excel both expect. */
export function toCsv(rows: Cell[][]): string {
  return rows.map(csvLine).join('\r\n')
}

export interface ExportBundle {
  format: 'epas-export'
  formatVersion: 1
  exportedAt: string
  state: StoreV1
}

/**
 * The lossless form. The teacher merge reads this rather than the CSV,
 * because the CSV is a summary and cannot be turned back into attempts.
 */
export function toBundle(state: StoreV1, now = new Date().toISOString()): ExportBundle {
  return {
    format: 'epas-export',
    formatVersion: 1,
    exportedAt: now,
    state: JSON.parse(JSON.stringify(state)) as StoreV1,
  }
}

export type ParseResult =
  | { ok: true; bundle: ExportBundle }
  | { ok: false; reason: string }

/**
 * Defensive on purpose. A teacher selects a folder of files and some of them
 * will not be exports, so every rejection has to name what is wrong with
 * that one file rather than aborting the whole merge.
 */
export function parseBundle(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'This file is not valid JSON.' }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, reason: 'This file is not an EPAS export.' }
  }
  const b = parsed as Partial<ExportBundle>
  if (b.format !== 'epas-export') {
    return { ok: false, reason: 'This file is not an EPAS export.' }
  }
  if (typeof b.formatVersion !== 'number' || b.formatVersion > 1) {
    return { ok: false, reason: 'This export was written by a newer version of the app.' }
  }
  const code = b.state?.participant?.code
  if (typeof code !== 'string' || code.length === 0) {
    return { ok: false, reason: 'This export has no participant code.' }
  }
  return { ok: true, bundle: b as ExportBundle }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/export.test.ts`
Expected: PASS, 19 tests.

- [ ] **Step 5: Typecheck and run the whole suite**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/export.ts tests/export.test.ts
git commit -m "feat: add CSV primitives and the export bundle"
```

---

### Task 4: The row, the header and the codebook

This turns one student's store into one CSV row, and produces the codebook without which that row cannot be read.

The gain per competency is not recomputed here. `competencyGains` in `src/lib/assess.ts` already decides what a gain means, including that a pre-test sat after the post-test does not count, and this task calls it rather than reimplementing the rule in a second place.

`attemptsFor` in `src/lib/store.ts` resolves the newest run but reads `localStorage`, which is useless for a teacher merging another student's file. Step 3 splits the rule out as a pure function and leaves `attemptsFor` as a thin wrapper, so both callers share one implementation.

**Files:**
- Modify: `src/lib/store.ts`, `src/lib/export.ts`
- Test: `tests/export.test.ts`, `tests/store.test.ts`

**Interfaces:**
- Consumes: `competencyGains` from `src/lib/assess.ts`; `BANK` from `src/content/bank`; `SURVEY` from `src/content/survey`; `allModules` from `src/content`.
- Produces: `newestRun(attempts, moduleId, context)` in `src/lib/store.ts`; `competencyColumns`, `csvHeader`, `csvRow`, `codebookRows` in `src/lib/export.ts`.

- [ ] **Step 1: Write the failing tests**

Widen the two existing import lines at the top of `tests/export.test.ts` to add
`codebookRows`, `competencyColumns`, `csvHeader` and `csvRow` from `../src/lib/export`, and
`Attempt` alongside `StoreV1` in the type import. Then append the tests below. The `state()`
helper from Task 3 is already in scope; do not redeclare it.

```ts
function att(over: Partial<Attempt> = {}): Attempt {
  return {
    itemId: 'x', moduleId: 'm1', competency: 'Explain the overview of Electronic Systems Servicing.',
    correct: true, at: '2026-01-01T00:00:00.000Z', context: 'pretest', runId: 'r1', ...over,
  }
}

describe('competencyColumns', () => {
  const cols = competencyColumns()

  it('gives one column group per competency in the bank', () => {
    expect(cols.length).toBe(28)
  })

  it('keys each group by a pair id rather than by the competency sentence', () => {
    expect(cols[0]?.pair).toMatch(/^m\d+-c\d+$/)
  })

  it('carries the module and the full competency text for the codebook', () => {
    const c = cols[0]!
    expect(c.moduleId).toMatch(/^m\d+$/)
    expect(c.competency.length).toBeGreaterThan(10)
  })

  it('returns them in a stable order across calls', () => {
    expect(competencyColumns().map(c => c.pair)).toEqual(cols.map(c => c.pair))
  })
})

describe('csvHeader', () => {
  const head = csvHeader()

  it('starts with the participant identity', () => {
    expect(head.slice(0, 4)).toEqual(['participant_code', 'name', 'consented_at', 'in_study'])
  })

  it('carries three columns for every competency', () => {
    expect(head.filter(h => h.startsWith('pre__')).length).toBe(28)
    expect(head.filter(h => h.startsWith('post__')).length).toBe(28)
    expect(head.filter(h => h.startsWith('gain__')).length).toBe(28)
  })

  it('carries one column per survey item plus the respondent and the comments', () => {
    expect(head.filter(h => h.startsWith('sq_')).length).toBe(20)
    expect(head).toContain('respondent')
    expect(head).toContain('comments')
  })

  it('uses no character that would need quoting in a header', () => {
    for (const h of head) expect(/[",\r\n]/.test(h), h).toBe(false)
  })

  it('repeats no column name', () => {
    expect(new Set(head).size).toBe(head.length)
  })
})

describe('csvRow', () => {
  it('is exactly as wide as the header', () => {
    expect(csvRow(state()).length).toBe(csvHeader().length)
  })

  it('reports a competency never sat as an empty cell rather than a zero', () => {
    const head = csvHeader()
    const row = csvRow(state())
    const i = head.indexOf('pre__m1-c1')
    expect(row[i]).toBe('')
  })

  it('writes 1 and 0 for a competency answered right and wrong', () => {
    const head = csvHeader()
    const row = csvRow(state({
      attempts: [
        att({ correct: false, context: 'pretest', at: '2026-01-01T00:00:00.000Z' }),
        att({ correct: true, context: 'posttest', at: '2026-02-01T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('pre__m1-c1')]).toBe('0')
    expect(row[head.indexOf('post__m1-c1')]).toBe('1')
    expect(row[head.indexOf('gain__m1-c1')]).toBe('1')
  })

  it('does not score a gain where the competency was already held', () => {
    const head = csvHeader()
    const row = csvRow(state({
      attempts: [
        att({ correct: true, context: 'pretest', at: '2026-01-01T00:00:00.000Z' }),
        att({ correct: true, context: 'posttest', at: '2026-02-01T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('gain__m1-c1')]).toBe('0')
  })

  it('leaves the gain empty when only one side was sat', () => {
    const head = csvHeader()
    const row = csvRow(state({ attempts: [att({ correct: false, context: 'pretest' })] }))
    expect(row[head.indexOf('gain__m1-c1')]).toBe('')
  })

  it('reports only the newest run of a retaken test', () => {
    const head = csvHeader()
    const row = csvRow(state({
      attempts: [
        att({ correct: false, runId: 'r1', at: '2026-01-01T00:00:00.000Z' }),
        att({ correct: true, runId: 'r2', at: '2026-01-02T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('pre__m1-c1')]).toBe('1')
  })

  it('writes the survey answers and the free text', () => {
    const head = csvHeader()
    const row = csvRow(state({ survey: { fs1: 4, respondent: 'student', comments: 'clear' } }))
    expect(row[head.indexOf('sq_fs1')]).toBe(4)
    expect(row[head.indexOf('respondent')]).toBe('student')
    expect(row[head.indexOf('comments')]).toBe('clear')
  })

  it('records whether the student agreed to take part', () => {
    const head = csvHeader()
    expect(csvRow(state({ participant: { code: 'X', research: true } }))[head.indexOf('in_study')]).toBe('yes')
    expect(csvRow(state({ participant: { code: 'X', research: false } }))[head.indexOf('in_study')]).toBe('no')
  })

  // A record written before the choice existed is unknown, not consent.
  it('reports an absent research field as unknown rather than as yes', () => {
    const head = csvHeader()
    expect(csvRow(state({ participant: { code: 'X' } }))[head.indexOf('in_study')]).toBe('unknown')
  })
})

describe('codebookRows', () => {
  const rows = codebookRows()

  it('starts with a header', () => {
    expect(rows[0]).toEqual(['column', 'kind', 'module', 'meaning'])
  })

  it('explains every competency column and every survey column', () => {
    const named = rows.slice(1).map(r => r[0])
    expect(named).toContain('pre__m1-c1')
    expect(named).toContain('gain__m1-c1')
    expect(named).toContain('sq_fs1')
  })

  it('names every column the header emits', () => {
    const named = new Set(rows.slice(1).map(r => r[0]))
    for (const h of csvHeader()) expect(named.has(h), `${h} is not in the codebook`).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/export.test.ts`
Expected: FAIL, `competencyColumns is not exported`.

- [ ] **Step 3: Split the newest-run rule out of the store**

In `src/lib/store.ts`, replace the body of `attemptsFor` with a wrapper over a new pure function, so a teacher merging another student's file can apply the same rule to a state that is not in `localStorage`:

```ts
/**
 * The attempts from the most recent sitting of one module and context,
 * given any list of attempts. Pure, so the export can apply it to another
 * student's file. `attemptsFor` is this function over the local store.
 */
export function newestRun(
  attempts: Attempt[],
  moduleId: string,
  context: AttemptContext,
): Attempt[] {
  const all = attempts.filter(a => a.moduleId === moduleId && a.context === context)
  if (all.length === 0) return []
  let newest = all[0]!
  // `>=` rather than `>` so that when two sittings share a timestamp the
  // later written one wins. Records are appended, so the last match is the
  // most recent. With distinct timestamps the two behave identically.
  for (const a of all) if (a.at >= newest.at) newest = a
  return all.filter(a => a.runId === newest.runId)
}

export function attemptsFor(moduleId: string, context: AttemptContext): Attempt[] {
  return newestRun(loadState().attempts, moduleId, context)
}
```

The existing `attemptsFor` tests in `tests/store.test.ts` must continue to pass unchanged. They are the proof that the refactor kept the rule intact, so do not edit them.

- [ ] **Step 4: Write the row builders**

Append to `src/lib/export.ts`:

```ts
import { allModules } from '../content'
import { BANK } from '../content/bank'
import { SURVEY } from '../content/survey'
import { competencyGains } from './assess'
import { newestRun } from './store'

export interface CompetencyColumn {
  /** Stable short key, for example `m1-c1`. */
  pair: string
  moduleId: string
  competency: string
}

/**
 * One group of columns per competency, keyed by the bank's pair id. The
 * competency sentences are long and contain commas, which makes them poor
 * column names, so the pair id is the key and `codebookRows` carries the
 * meaning.
 */
export function competencyColumns(): CompetencyColumn[] {
  const seen = new Map<string, CompetencyColumn>()
  for (const item of BANK) {
    if (!seen.has(item.pair)) {
      seen.set(item.pair, { pair: item.pair, moduleId: item.moduleId, competency: item.competency })
    }
  }
  return [...seen.values()]
}

export function csvHeader(): string[] {
  const head = ['participant_code', 'name', 'consented_at', 'in_study']
  for (const c of competencyColumns()) head.push(`pre__${c.pair}`, `post__${c.pair}`, `gain__${c.pair}`)
  for (const item of SURVEY) head.push(`sq_${item.id}`)
  head.push('respondent', 'comments')
  return head
}

/** `yes`, `no`, or `unknown` for a record written before the choice existed. */
function studyFlag(state: StoreV1): string {
  if (state.participant.research === true) return 'yes'
  if (state.participant.research === false) return 'no'
  return 'unknown'
}

export function csvRow(state: StoreV1): Cell[] {
  const row: Cell[] = [
    state.participant.code,
    state.participant.name ?? '',
    state.participant.consentedAt ?? '',
    studyFlag(state),
  ]

  // Gains are computed per module by the assessment engine, then indexed by
  // competency text, which is what an Attempt carries. The bank maps that
  // text back to the pair id the columns are keyed by.
  const byPair = new Map<string, { pre: boolean | null; post: boolean | null; gained: boolean; ordered: boolean }>()
  for (const m of allModules()) {
    const pre = newestRun(state.attempts, m.id, 'pretest')
    const post = newestRun(state.attempts, m.id, 'posttest')
    for (const g of competencyGains(pre, post)) {
      const item = BANK.find(i => i.moduleId === m.id && i.competency === g.competency)
      if (item) byPair.set(item.pair, g)
    }
  }

  for (const c of competencyColumns()) {
    const g = byPair.get(c.pair)
    const bit = (v: boolean | null | undefined) => (v === true ? 1 : v === false ? 0 : '')
    row.push(bit(g?.pre), bit(g?.post))
    // A gain needs both sides, sat in that order. Anything else is missing
    // data rather than an absence of learning, so the cell stays empty.
    const measurable = g !== undefined && g.ordered && g.pre !== null && g.post !== null
    row.push(measurable ? (g.gained ? 1 : 0) : '')
  }

  const survey = state.survey ?? {}
  for (const item of SURVEY) row.push(survey[item.id] ?? '')
  row.push(survey.respondent ?? '', survey.comments ?? '')

  return row
}

/**
 * Without this the data file is a wall of `pre__m4-c3` columns that nobody,
 * including the person who collected it, can interpret six months later.
 */
export function codebookRows(): Cell[][] {
  const rows: Cell[][] = [['column', 'kind', 'module', 'meaning']]
  rows.push(['participant_code', 'identity', '', 'The code issued to this device on first launch'])
  rows.push(['name', 'identity', '', 'Optional, blank where the student stayed anonymous'])
  rows.push(['consented_at', 'identity', '', 'When the consent screen was answered'])
  rows.push(['in_study', 'identity', '', 'yes, no, or unknown for a record written before the choice existed'])

  for (const c of competencyColumns()) {
    rows.push([`pre__${c.pair}`, 'pre-test', c.moduleId, `1 correct, 0 wrong, blank not sat. ${c.competency}`])
    rows.push([`post__${c.pair}`, 'post-test', c.moduleId, `1 correct, 0 wrong, blank not sat. ${c.competency}`])
    rows.push([`gain__${c.pair}`, 'gain', c.moduleId, `1 wrong before and right after, 0 otherwise, blank not measurable. ${c.competency}`])
  }

  for (const item of SURVEY) {
    rows.push([`sq_${item.id}`, 'survey', '', `1 to 5, strongly disagree to strongly agree. ${item.category}: ${item.text}`])
  }
  rows.push(['respondent', 'survey', '', 'student, teacher, or expert'])
  rows.push(['comments', 'survey', '', 'Free text, optional'])

  return rows
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/export.test.ts`
Expected: PASS, 19 tests from Task 3 plus 17 more.

- [ ] **Step 6: Typecheck and run the whole suite**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass, including the untouched `attemptsFor` tests, which prove the refactor in Step 3 preserved the rule.

- [ ] **Step 7: Commit**

```bash
git add src/lib/export.ts src/lib/store.ts tests/export.test.ts
git commit -m "feat: build the export row, header and codebook"
```

---

### Task 5: Saving a file, and the `/progress` screen

`/progress` is already in the nav and currently dead-ends on the catch-all. This task makes it the student's own view of what they have done and the place they hand their results in.

**Files:**
- Create: `src/ui/download.ts`, `src/routes/Progress.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `toBundle`, `csvHeader`, `csvRow` from `src/lib/export.ts`; `loadState`, `hasTaken`, `attemptsFor` from `src/lib/store.ts`; `competencyGains` from `src/lib/assess.ts`; `allModules` from `src/content`.
- Produces: `downloadCsv(filename, rows)` and `downloadJson(filename, value)` in `src/ui/download.ts`; the route `/progress`.

- [ ] **Step 1: Write the download helper**

Create `src/ui/download.ts`:

```ts
import { toCsv } from '../lib/export'
import type { Cell } from '../lib/export'

function save(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * The leading byte order mark is deliberate. Excel opens a UTF-8 CSV as the
 * local codepage without it, which mangles any accented character in a
 * student's name or comment, and the teacher has no way to tell that
 * happened from looking at the file.
 */
export function downloadCsv(filename: string, rows: Cell[][]): void {
  save(filename, '﻿' + toCsv(rows), 'text/csv;charset=utf-8')
}

export function downloadJson(filename: string, value: unknown): void {
  save(filename, JSON.stringify(value, null, 2), 'application/json')
}
```

- [ ] **Step 2: Write the progress screen**

Create `src/routes/Progress.tsx`:

```tsx
import { Link } from 'react-router'
import { allModules } from '../content'
import { competencyGains } from '../lib/assess'
import { csvHeader, csvRow, toBundle } from '../lib/export'
import { attemptsFor, hasTaken, loadState } from '../lib/store'
import { downloadCsv, downloadJson } from '../ui/download'
import { SURVEY } from '../content/survey'
import type { CSSProperties } from 'react'

const label: CSSProperties = {
  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)',
}

export default function Progress() {
  const state = loadState()
  const modules = allModules()
  const code = state.participant.code
  const surveyDone = SURVEY.every(i => typeof state.survey?.[i.id] === 'number')

  return (
    <div style={{ maxWidth: '70ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 2px' }}>
        Progress
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        Working as <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{code}</strong>
      </p>

      <div style={{ overflowX: 'auto', margin: '0 0 22px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 460 }}>
          <thead>
            <tr>
              {['Module', 'Lessons done', 'Pre-test', 'Post-test', 'Competencies gained'].map(h => (
                <th key={h} style={{ ...label, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(m => {
              const done = state.modules[m.id]?.completedOutcomes.length ?? 0
              const pre = hasTaken(m.id, 'pretest')
              const post = hasTaken(m.id, 'posttest')
              const gains = competencyGains(attemptsFor(m.id, 'pretest'), attemptsFor(m.id, 'posttest'))
              const gained = gains.filter(g => g.gained).length
              const measured = gains.filter(g => g.ordered && g.pre !== null && g.post !== null).length
              return (
                <tr key={m.id}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
                    <Link to={`/m/${m.id}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{m.title}</Link>
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                    {done} of {m.outcomes.length}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: pre ? 'var(--pass)' : 'var(--ink-3)' }}>
                    {pre ? 'Taken' : 'Not yet'}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: post ? 'var(--pass)' : 'var(--ink-3)' }}>
                    {post ? 'Taken' : 'Not yet'}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                    {measured > 0 ? `${gained} of ${measured}` : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 6px' }}>Hand your results in</h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px' }}>
        Nothing has left this device. Saving a file is how your work reaches your teacher.
        Send them the JSON file; it holds everything. The CSV is the same results as one
        row of a table, for you to keep.
      </p>
      {!surveyDone && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
          You have not finished the{' '}
          <Link to="/evaluate" style={{ color: 'var(--accent)' }}>evaluation survey</Link> yet.
          You can still hand in, but the survey columns will be empty.
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 0' }}>
        <button onClick={() => downloadJson(`epas-${code}.json`, toBundle(state))} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
          background: 'var(--accent)', color: 'var(--on-accent)',
          font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Save my results for my teacher
        </button>
        <button onClick={() => downloadCsv(`epas-${code}.csv`, [csvHeader(), csvRow(state)])} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          color: 'var(--ink)', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Save a spreadsheet copy
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add the route**

In `src/App.tsx`:

```tsx
import Progress from './routes/Progress'
```

```tsx
  { path: '/progress', element: <Shell><Progress /></Shell> },
```

- [ ] **Step 4: Typecheck and run the whole suite**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 5: Check it in a browser**

Run: `npm run dev`

Consent, sit Module 1's pre-test and post-test, then open Progress. Confirm the table shows the module, the two tests as Taken, and a gained count. Press each button and open the saved files: the JSON has `format: "epas-export"` and your attempts; the CSV has two lines and the same number of commas in each. Open the CSV in a spreadsheet and confirm the columns line up. At 375px the table scrolls sideways inside its own box without the page scrolling.

- [ ] **Step 6: Commit**

```bash
git add src/ui/download.ts src/routes/Progress.tsx src/App.tsx
git commit -m "feat: add the progress view and the student export"
```

---

### Task 6: The `/teacher` class merge

The teacher opens this on their own machine, selects the files their students handed in, and gets one table. It is the only screen in the app that reads data it did not write.

It is also the screen that has to honour the promise the consent screen makes. A student who declined must not appear in the merged file, and their exclusion must be visible on screen so the teacher knows the count is short on purpose.

**Files:**
- Create: `src/routes/Teacher.tsx`
- Modify: `src/lib/store.ts`, `src/App.tsx`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: `parseBundle`, `csvHeader`, `csvRow`, `codebookRows` from `src/lib/export.ts`; `downloadCsv` from `src/ui/download.ts`.
- Produces: `teacherPin()` and `setTeacherPin(pin)` in `src/lib/store.ts`; the route `/teacher`.

- [ ] **Step 1: Write the failing tests**

Add `teacherPin` and `setTeacherPin` to the `../src/lib/store` import in `tests/store.test.ts`, alongside the `resetAll` that Task 2 added. Then append:

```ts
describe('the teacher PIN', () => {
  beforeEach(() => localStorage.clear())

  it('is unset until one is chosen', () => {
    expect(teacherPin()).toBeUndefined()
  })

  it('keeps what was set', () => {
    setTeacherPin('2468')
    expect(teacherPin()).toBe('2468')
  })

  // It belongs to the teacher's machine, not to the student record, so
  // handing the device to a new participant must not clear it and a
  // student's export must never carry it.
  it('survives handing the device to a new participant', () => {
    setTeacherPin('2468')
    resetAll()
    expect(teacherPin()).toBe('2468')
  })

  it('is not part of the exported student state', () => {
    setTeacherPin('2468')
    expect(JSON.stringify(loadState())).not.toContain('2468')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/store.test.ts`
Expected: FAIL, `teacherPin is not defined`.

- [ ] **Step 3: Add the PIN functions**

Append to `src/lib/store.ts`:

```ts
/**
 * The teacher tool's gate lives under its own key, outside the participant
 * record, for two reasons: handing a device to the next student clears the
 * record and must not clear this, and a student's export is a copy of the
 * record and must never contain it.
 *
 * This keeps a curious student out of a screen that is empty until files are
 * loaded into it. It is not protection against anyone determined, and the
 * screen says so rather than implying otherwise.
 */
const TEACHER_PIN_KEY = `${STORAGE_KEY}.teacher.pin`

export function teacherPin(): string | undefined {
  try {
    return localStorage.getItem(TEACHER_PIN_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function setTeacherPin(pin: string): void {
  try {
    localStorage.setItem(TEACHER_PIN_KEY, pin)
  } catch {
    // Storage full or blocked. The tool still works for this session.
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the teacher screen**

Create `src/routes/Teacher.tsx`:

```tsx
import { useState } from 'react'
import { codebookRows, csvHeader, csvRow, parseBundle } from '../lib/export'
import { setTeacherPin, teacherPin } from '../lib/store'
import { downloadCsv } from '../ui/download'
import type { StoreV1 } from '../lib/store'
import type { CSSProperties } from 'react'

interface Loaded {
  file: string
  code: string
  state: StoreV1
  included: boolean
  why?: string
}

interface Rejected {
  file: string
  reason: string
}

const note: CSSProperties = {
  fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px',
}

export default function Teacher() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [loaded, setLoaded] = useState<Loaded[]>([])
  const [rejected, setRejected] = useState<Rejected[]>([])

  function unlock() {
    const stored = teacherPin()
    if (stored === undefined) {
      if (pin.length < 4) { setPinError('Choose at least four characters.'); return }
      setTeacherPin(pin)
      setUnlocked(true)
      return
    }
    if (pin === stored) { setUnlocked(true); setPinError('') }
    else setPinError('That does not match the PIN set on this device.')
  }

  async function take(files: FileList | null) {
    if (!files) return
    const ok: Loaded[] = []
    const bad: Rejected[] = []
    for (const file of Array.from(files)) {
      const result = parseBundle(await file.text())
      if (!result.ok) { bad.push({ file: file.name, reason: result.reason }); continue }
      const state = result.bundle.state
      const research = state.participant.research
      ok.push({
        file: file.name,
        code: state.participant.code,
        state,
        included: research === true,
        why: research === false
          ? 'This student chose not to take part in the study'
          : research === undefined
            ? 'This file predates the consent choice, so it is not treated as agreement'
            : undefined,
      })
    }
    setLoaded(ok)
    setRejected(bad)
  }

  const included = loaded.filter(l => l.included)
  const excluded = loaded.filter(l => !l.included)
  const codes = included.map(l => l.code)
  const duplicates = [...new Set(codes.filter((c, i) => codes.indexOf(c) !== i))]

  if (!unlocked) {
    const first = teacherPin() === undefined
    return (
      <div style={{ maxWidth: '48ch' }}>
        <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Teacher tools</h1>
        <p style={note}>
          {first
            ? 'Choose a PIN for this device. It keeps a student who wanders in from seeing this screen. It is not a password and it protects nothing else.'
            : 'Enter the PIN set on this device.'}
        </p>
        <input value={pin} onChange={e => { setPin(e.target.value); setPinError('') }}
          type="password" inputMode="numeric" autoComplete="off"
          style={{
            width: '100%', maxWidth: 220, minHeight: 44, padding: '10px 12px',
            borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
            font: 'inherit', fontSize: 14, color: 'var(--ink)', margin: '10px 0',
          }} />
        {pinError && <p role="alert" style={{ fontSize: 13, color: 'var(--caution)', margin: '0 0 10px' }}>{pinError}</p>}
        <div>
          <button onClick={unlock} className="tile" style={{
            minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
            background: 'var(--accent)', color: 'var(--on-accent)',
            font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>{first ? 'Set this PIN' : 'Unlock'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '70ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Merge a class</h1>
      <p style={note}>
        Select the JSON files your students handed in. Everything happens on this device;
        nothing is uploaded. You get one table with a row per student, and a codebook that
        explains what each column means.
      </p>

      <input type="file" accept="application/json,.json" multiple
        onChange={e => { void take(e.target.files) }}
        style={{ font: 'inherit', fontSize: 13.5, margin: '14px 0 18px', color: 'var(--ink-2)' }} />

      {loaded.length + rejected.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, padding: 16, margin: '0 0 18px',
        }}>
          <p style={{ ...note, color: 'var(--ink)', fontWeight: 600 }}>
            {included.length} student{included.length === 1 ? '' : 's'} will be in the table.
          </p>

          {excluded.length > 0 && (
            <>
              <p style={{ ...note, margin: '12px 0 4px', fontWeight: 600 }}>Left out on purpose</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {excluded.map(l => (
                  <li key={l.file} style={{ marginBottom: 4 }}>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{l.code}</strong> from {l.file}. {l.why}.
                  </li>
                ))}
              </ul>
            </>
          )}

          {duplicates.length > 0 && (
            <p role="alert" style={{ ...note, margin: '12px 0 0', color: 'var(--caution)' }}>
              The same participant code appears more than once: {duplicates.join(', ')}. That is
              usually one student handing in twice, or two students who were never given separate
              codes on a shared machine. Check before you analyse.
            </p>
          )}

          {rejected.length > 0 && (
            <>
              <p style={{ ...note, margin: '12px 0 4px', fontWeight: 600 }}>Could not be read</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {rejected.map(r => <li key={r.file} style={{ marginBottom: 4 }}>{r.file}. {r.reason}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => downloadCsv('epas-class.csv', [csvHeader(), ...included.map(l => csvRow(l.state))])}
          disabled={included.length === 0}
          className="tile"
          style={{
            minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
            background: included.length ? 'var(--accent)' : 'var(--line)',
            color: included.length ? 'var(--on-accent)' : 'var(--ink-3)',
            font: 'inherit', fontSize: 14, fontWeight: 600,
            cursor: included.length ? 'pointer' : 'default',
          }}>
          Save the class table
        </button>
        <button onClick={() => downloadCsv('epas-codebook.csv', codebookRows())} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          color: 'var(--ink)', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Save the codebook
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Add the route**

In `src/App.tsx`. It is deliberately absent from the nav in `src/ui/Shell.tsx`; the teacher reaches it by typing the address.

```tsx
import Teacher from './routes/Teacher'
```

```tsx
  { path: '/teacher', element: <Shell><Teacher /></Shell> },
```

- [ ] **Step 7: Typecheck and run the whole suite**

Run: `npx tsc -b && npm test`
Expected: `tsc` exits 0. All tests pass.

- [ ] **Step 8: Check it in a browser, with three files**

Run: `npm run dev`

Produce three exports to merge. For each, use the "Not you?" control on the module map to start a new participant, then answer consent, sit a test, and save the JSON from Progress.

1. One student who **agrees** and sits Module 1's pre-test and post-test.
2. One student who **declines** on the consent screen and sits the same tests.
3. One file that is not an export at all. Rename any other `.json` file, or save a text file containing `{"hello":"world"}`.

Then open `#/teacher`, set a PIN, and select all three files. Confirm: the count says one student will be in the table; the declining student is listed under "Left out on purpose" with their code; the third file is listed under "Could not be read" with a reason. Save the class table and confirm it has two lines, a header and one row, and that the declining student's code does not appear anywhere in it. Save the codebook and confirm every column in the class table appears in it.

Then reload `#/teacher` and confirm it asks for the PIN rather than opening straight up.

- [ ] **Step 9: Commit**

```bash
git add src/routes/Teacher.tsx src/lib/store.ts src/App.tsx tests/store.test.ts
git commit -m "feat: add the teacher class merge"
```

---

## Verification

After Task 6, all of the following must hold.

- `npx tsc -b` exits 0, `npm test` is green, `npm run build` succeeds.
- The survey holds exactly twenty items, four in each of the five categories, and no item id collides with `respondent` or `comments`.
- `csvRow(state).length === csvHeader().length` for any state, including an empty one.
- Every column `csvHeader()` emits appears in `codebookRows()`.
- A competency never sat exports as an empty cell, not as a zero.
- A gain exports as empty unless both sides were sat, in order.
- **A student whose `participant.research` is `false` or absent does not appear in the merged class table**, and the screen says who was left out and why.
- The teacher PIN survives `resetAll()` and appears nowhere in a student's exported JSON.
- At 375px, `/evaluate`, `/progress` and `/teacher` have no horizontal page scrolling and every control is at least 44px tall.

## What this plan does not build

Named here so no implementer improvises them:

- The eight performance task sheets and `/tasks/:taskId`. They are the next plan, and they will add columns to `csvHeader`, `csvRow` and `codebookRows` rather than a second export format.
- The `/labs` gallery and `/labs/:simId`. Next plan. The `Labs` nav entry stays dead until then.
- `/tools` and `/settings` from the spec's route list.
- PWA packaging, the service worker and deployment. The plan after next.
- Any change to `src/lib/diagnose.ts`, which is frozen.
