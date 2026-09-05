# EPAS Foundation and M1 Vertical Slice: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running React app where a student opens the module map, enters Module 1, reads its lessons, practises on the Multimeter Trainer, takes a quiz, and finds their progress still there after a reload.

**Architecture:** Vite single-page app. Curriculum content is typed data consumed by shared renderers, never hardcoded into components. All persistence flows through one storage module with a versioned schema. Simulations are pure logic engines (testable) wrapped by SVG presentation components (not unit tested). This slice establishes the pattern that Modules 2 to 9 copy.

**Tech Stack:** Vite, React, TypeScript, Tailwind v4, React Router (hash history), Zustand, Vitest, Testing Library, Phosphor icons, Geist via Fontsource.

**Spec:** `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`
**Visual authority:** `docs/DESIGN.md`

## Global Constraints

Every task's requirements implicitly include these. Values copied from the spec and DESIGN.md.

- **No CDN, no external runtime asset.** Fonts, icons and images ship in the bundle. The app must work with the network off.
- **SVG only** for graphics. No canvas, no WebGL.
- **One accent:** `#0E6E63` light, `#3FA394` dark. No second accent anywhere.
- **Radius scale:** cards and tiles `14px`, controls `10px`, pills full. No other values.
- **Red `#B3382C` is reserved for electrical safety.** Incorrect answers use caution amber `#A9650C`.
- **Module tints are identity, never status.**
- **Animate only `transform` and `opacity`.** Frequent controls get `scale(0.98)` at 140ms. Never animate from `scale(0)`. Never use `ease-in`. All motion honours `prefers-reduced-motion`.
- **No em dashes in any user-visible string.** No emoji in the interface. No decorative status dots.
- **WCAG AA minimum,** visible focus ring on every interactive element, touch targets 44px minimum.
- **Every module ships `teacherReviewed: false`** and the UI must show that state.
- **Storage is one key, `epas.v1`,** written only through `src/lib/store.ts`.

---

## File Structure

```
src/
  main.tsx                     app entry, router mount
  index.css                    Tailwind import, design tokens, base
  lib/
    types.ts                   content and quiz types, shared everywhere
    store.ts                   the only module that touches localStorage
    quiz.ts                    grading and scoring, pure
    measure.ts                 meter reading engine, pure
  content/
    m1.ts                      Module 1 as data
    index.ts                   module registry
  interactives/
    types.ts                   SimEvent and the Interactive contract
    MultimeterTrainer.tsx      flagship sim 1
  ui/
    Shell.tsx                  header, nav, page frame
    blocks/BlockRenderer.tsx   renders Block[] from content
  routes/
    ModuleMap.tsx              "/"
    ModuleOverview.tsx         "/m/:moduleId"
    LessonReader.tsx           "/m/:moduleId/lo/:outcomeId"
tests/
  store.test.ts  quiz.test.ts  measure.test.ts
```

---

### Task 1: Project scaffold, design tokens, test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `tests/setup.ts`

**Interfaces:**
- Consumes: nothing
- Produces: a dev server on `npm run dev`, a green `npm test`, and every design token from DESIGN.md available as a CSS variable

The directory already contains `docs/` and `.git`, so do not run `npm create vite`. Write the files directly.

- [ ] **Step 1: Write package.json**

```json
{
  "name": "epas-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fontsource-variable/geist": "^5.2.5",
    "@fontsource-variable/geist-mono": "^5.2.5",
    "@phosphor-icons/react": "^2.1.7",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.6.0",
    "zustand": "^5.0.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.7",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.1.4",
    "@types/react-dom": "^19.1.5",
    "@vitejs/plugin-react": "^4.4.1",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.7",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.1.3"
  }
}
```

- [ ] **Step 2: Write vite.config.ts**

`base: './'` matters: it makes the built app work when served from a subpath or a lab PC folder.

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 3: Write tsconfig.json and tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Write index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#FAFAF9" />
    <title>EPAS Grade 12</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write src/index.css with every DESIGN.md token**

```css
@import "tailwindcss";
@import "@fontsource-variable/geist";
@import "@fontsource-variable/geist-mono";

@theme {
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
  --radius-card: 14px;
  --radius-control: 10px;
}

:root {
  --paper: #FAFAF9;
  --surface: #FFFFFF;
  --ink: #1A1B1E;
  --ink-2: #5F646C;
  --ink-3: #8A9099;
  --line: #E7E7E9;
  --accent: #0E6E63;
  --danger: #B3382C;
  --pass: #1E7A4A;
  --caution: #A9650C;

  --m1: #DDF0EC; --m1-ink: #1D6B60;
  --m2: #FAEDD6; --m2-ink: #8A5B12;
  --m3: #DEECFA; --m3-ink: #1F5A87;
  --m4: #FBE7DD; --m4-ink: #8E4B2E;
  --m5: #E4E6FA; --m5-ink: #414BA0;
  --m6: #FADEE4; --m6-ink: #963C58;
  --m7: #EFE2F7; --m7-ink: #6B3D8F;
  --m8: #E9F3D8; --m8-ink: #4F6B1E;
  --m9: #DAF0F5; --m9-ink: #1B6377;

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --paper: #131417;
    --surface: #1A1C20;
    --ink: #EDEEF0;
    --ink-2: #A2A8B2;
    --ink-3: #767D88;
    --line: #2A2D33;
    --accent: #3FA394;

    --m1: #17332E; --m1-ink: #79CFBF;
    --m2: #33291A; --m2-ink: #E0B269;
    --m3: #1A2A38; --m3-ink: #82BCE6;
    --m4: #33231B; --m4-ink: #E2A183;
    --m5: #22243D; --m5-ink: #A3AAF0;
    --m6: #33222A; --m6-ink: #E79BB1;
    --m7: #2B2136; --m7-ink: #C39BE4;
    --m8: #262E1B; --m8-ink: #B7CE84;
    --m9: #162E36; --m9-ink: #7FCBDD;
  }
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Write src/main.tsx and a placeholder src/App.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
```

```tsx
// src/App.tsx
export default function App() {
  return <main style={{ padding: 24 }}><h1>EPAS</h1></main>
}
```

- [ ] **Step 7: Write tests/setup.ts**

```ts
import '@testing-library/jest-dom/vitest'

beforeEach(() => {
  localStorage.clear()
})
```

- [ ] **Step 8: Install and verify**

Run: `npm install`
Run: `npm run build`
Expected: build succeeds, `dist/` produced.
Run: `npm test`
Expected: "No test files found" is acceptable at this point, exit code 0 with `--passWithNoTests`. If vitest exits non-zero, add `"test": "vitest run --passWithNoTests"` to scripts and rerun.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite app with design tokens and test harness"
```

---

### Task 2: Storage module with versioned schema

**Files:**
- Create: `src/lib/store.ts`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `loadState(): StoreV1`
  - `saveState(s: StoreV1): void`
  - `recordAttempt(a: Attempt): void`
  - `recordSim(r: SimRecord): void`
  - `markOutcomeComplete(moduleId: string, outcomeId: string): void`
  - `resetAll(): void`
  - types `StoreV1`, `Attempt`, `SimRecord`

This is the single riskiest file in the project. A migration bug loses a class's data, so it is written test first.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/store.test.ts
import {
  loadState, saveState, recordAttempt, recordSim,
  markOutcomeComplete, STORAGE_KEY,
} from '../src/lib/store'

describe('store', () => {
  it('returns a fresh state with a participant code when empty', () => {
    const s = loadState()
    expect(s.schemaVersion).toBe(1)
    expect(s.participant.code).toMatch(/^EPAS-[A-Z0-9]{6}$/)
    expect(s.attempts).toEqual([])
  })

  it('keeps the same participant code across loads', () => {
    const a = loadState().participant.code
    const b = loadState().participant.code
    expect(b).toBe(a)
  })

  it('appends attempts without dropping earlier ones', () => {
    recordAttempt({ itemId: 'q1', moduleId: 'm1', competency: 'c1', correct: true, at: '2026-09-06T00:00:00Z', context: 'formative' })
    recordAttempt({ itemId: 'q2', moduleId: 'm1', competency: 'c1', correct: false, at: '2026-09-06T00:01:00Z', context: 'formative' })
    expect(loadState().attempts).toHaveLength(2)
  })

  it('records a sim result', () => {
    recordSim({ simId: 'multimeter', moduleId: 'm1', score: 0.8, at: '2026-09-06T00:00:00Z', evidence: { probed: 5 } })
    expect(loadState().sims[0]!.simId).toBe('multimeter')
  })

  it('does not duplicate a completed outcome', () => {
    markOutcomeComplete('m1', 'lo1')
    markOutcomeComplete('m1', 'lo1')
    expect(loadState().modules.m1!.completedOutcomes).toEqual(['lo1'])
  })

  it('recovers from corrupt stored JSON instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const s = loadState()
    expect(s.schemaVersion).toBe(1)
  })

  it('migrates a version 0 payload by preserving its attempts', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: 0,
      participantCode: 'EPAS-OLD123',
      attempts: [{ itemId: 'q1', moduleId: 'm1', competency: 'c1', correct: true, at: 'x', context: 'formative' }],
    }))
    const s = loadState()
    expect(s.schemaVersion).toBe(1)
    expect(s.participant.code).toBe('EPAS-OLD123')
    expect(s.attempts).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/store.test.ts`
Expected: FAIL, cannot resolve `../src/lib/store`.

- [ ] **Step 3: Implement src/lib/store.ts**

```ts
export const STORAGE_KEY = 'epas.v1'
export const SCHEMA_VERSION = 1

export type AttemptContext = 'formative' | 'pretest' | 'posttest'

export interface Attempt {
  itemId: string
  moduleId: string
  competency: string
  correct: boolean
  at: string
  context: AttemptContext
}

export interface SimRecord {
  simId: string
  moduleId: string
  score: number
  at: string
  evidence: Record<string, unknown>
}

export interface ModuleProgress {
  started?: string
  completedOutcomes: string[]
}

export interface StoreV1 {
  schemaVersion: 1
  participant: { code: string; name?: string; consentedAt?: string }
  modules: Record<string, ModuleProgress>
  attempts: Attempt[]
  sims: SimRecord[]
  survey?: Record<string, number | string>
}

function newCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `EPAS-${out}`
}

function freshState(code = newCode()): StoreV1 {
  return {
    schemaVersion: SCHEMA_VERSION,
    participant: { code },
    modules: {},
    attempts: [],
    sims: [],
  }
}

function migrate(raw: unknown): StoreV1 {
  if (typeof raw !== 'object' || raw === null) return freshState()
  const r = raw as Record<string, unknown>

  if (r.schemaVersion === 1) return r as unknown as StoreV1

  // Version 0 stored a flat participantCode and no modules map.
  if (r.schemaVersion === 0) {
    const code = typeof r.participantCode === 'string' ? r.participantCode : newCode()
    const base = freshState(code)
    if (Array.isArray(r.attempts)) base.attempts = r.attempts as Attempt[]
    if (Array.isArray(r.sims)) base.sims = r.sims as SimRecord[]
    return base
  }

  return freshState()
}

export function loadState(): StoreV1 {
  let parsed: unknown
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      const s = freshState()
      saveState(s)
      return s
    }
    parsed = JSON.parse(raw)
  } catch {
    const s = freshState()
    saveState(s)
    return s
  }
  const migrated = migrate(parsed)
  saveState(migrated)
  return migrated
}

export function saveState(s: StoreV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Storage full or blocked. The session continues in memory rather than
    // crashing a student mid-quiz.
  }
}

function update(fn: (s: StoreV1) => void): void {
  const s = loadState()
  fn(s)
  saveState(s)
}

export function recordAttempt(a: Attempt): void {
  update(s => { s.attempts.push(a) })
}

export function recordSim(r: SimRecord): void {
  update(s => { s.sims.push(r) })
}

export function markOutcomeComplete(moduleId: string, outcomeId: string): void {
  update(s => {
    const m = s.modules[moduleId] ?? { completedOutcomes: [], started: new Date().toISOString() }
    if (!m.completedOutcomes.includes(outcomeId)) m.completedOutcomes.push(outcomeId)
    s.modules[moduleId] = m
  })
}

export function resetAll(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/store.test.ts`
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.ts tests/store.test.ts
git commit -m "feat: add versioned storage module with migration"
```

---

### Task 3: Content types and the module registry

**Files:**
- Create: `src/lib/types.ts`, `src/content/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Module`, `LearningOutcome`, `Lesson`, `Block`, `QuizItem`, `getModule(id)`, `allModules()`

No tests. These are type declarations plus a lookup; the compiler is the test.

- [ ] **Step 1: Write src/lib/types.ts**

```ts
export type Block =
  | { kind: 'text'; md: string }
  | { kind: 'figure'; src: string; alt: string; caption?: string }
  | { kind: 'safety'; md: string }
  | { kind: 'note'; md: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'interactive'; simId: string; config?: Record<string, unknown> }

export type QuizItem =
  | { kind: 'mcq'; id: string; competency: string; stem: string; options: string[]; answer: number; rationale: string[] }
  | { kind: 'truefalse'; id: string; competency: string; stem: string; answer: boolean; rationale: string }
  | { kind: 'order'; id: string; competency: string; stem: string; steps: string[] }

export interface Lesson {
  id: string
  title: string
  blocks: Block[]
}

export interface LearningOutcome {
  id: string
  title: string
  lessons: Lesson[]
  quiz: QuizItem[]
}

export interface Module {
  id: string
  week: string
  title: string
  tint: string
  competencies: string[]
  teacherReviewed: boolean
  outcomes: LearningOutcome[]
}
```

`order` items encode the correct sequence as the array order. The UI shuffles for display; grading compares against the authored order.

Match and hotspot item kinds arrive in Plan 3 with the assessment layer. They are not needed for the M1 slice and adding them now would be unused surface.

- [ ] **Step 2: Write src/content/index.ts**

```ts
import type { Module } from '../lib/types'
import { m1 } from './m1'

export const MODULES: Module[] = [m1]

export function allModules(): Module[] {
  return MODULES
}

export function getModule(id: string): Module | undefined {
  return MODULES.find(m => m.id === id)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/content/index.ts
git commit -m "feat: add content model types and module registry"
```

---

### Task 4: Module 1 content

**Files:**
- Create: `src/content/m1.ts`

**Interfaces:**
- Consumes: `Module` from `src/lib/types`
- Produces: `m1: Module` with three outcomes, each carrying at least one lesson and three quiz items

Competency strings are quoted verbatim from the Budget of Work. Do not paraphrase them; they are the research artifact's link to the curriculum.

- [ ] **Step 1: Write src/content/m1.ts**

```ts
import type { Module } from '../lib/types'

export const m1: Module = {
  id: 'm1',
  week: 'Week 1',
  title: 'Electronic Systems and Component Testing',
  tint: 'm1',
  teacherReviewed: false,
  competencies: [
    'Explain the overview of Electronic Systems Servicing.',
    'Discuss electronic components identification.',
    'Demonstrate procedures in testing electronic components.',
  ],
  outcomes: [
    {
      id: 'lo1',
      title: 'Explain the overview of Electronic Systems Servicing',
      lessons: [{
        id: 'l1',
        title: 'What servicing actually involves',
        blocks: [
          { kind: 'text', md: 'Servicing an electronic product means restoring it to its working condition by finding the fault, correcting it, and proving the repair. Every device you will work on this term, from a rechargeable lamp to a CCTV recorder, is a system: a power source, a set of components that process a signal, and an output. When one part of that chain fails, the symptom you see is rarely at the point of failure.' },
          { kind: 'text', md: 'This is why servicing is a procedure and not a guess. You observe the symptom, form a theory about which stage of the system is at fault, test that stage, and only then replace anything.' },
          { kind: 'steps', items: [
            'Confirm the complaint. Operate the unit yourself and see the fault.',
            'Isolate the unit from the supply before opening it.',
            'Inspect visually for burning, swelling, corrosion, or broken joints.',
            'Divide the system into stages and test from the power source outward.',
            'Repair or replace the confirmed faulty part.',
            'Reassemble, then test the unit under normal operation before returning it.',
          ] },
          { kind: 'safety', md: 'Never open a mains-powered appliance while it is plugged in. Unplug it, then confirm with a meter that stored charge has drained before touching any internal part.' },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm1-lo1-q1', competency: 'Explain the overview of Electronic Systems Servicing.',
          stem: 'A customer reports that a desk fan does not turn on. What is the correct first action?',
          options: [
            'Replace the motor, since the motor drives the fan',
            'Operate the fan yourself to confirm the reported fault',
            'Open the housing immediately to inspect the windings',
            'Replace the power cord, since cords fail most often',
          ],
          answer: 1,
          rationale: [
            'Replacing a part before testing wastes it and does not prove the fault was there.',
            'Correct. Confirming the complaint tells you the real symptom before you commit to any theory.',
            'Opening the unit comes after confirming the fault and isolating the unit from the supply.',
            'Frequency of failure is a clue, not evidence. The cord still has to be tested.',
          ] },
        { kind: 'truefalse', id: 'm1-lo1-q2', competency: 'Explain the overview of Electronic Systems Servicing.',
          stem: 'The visible symptom of a fault is usually located at the component that failed.',
          answer: false,
          rationale: 'A failure in one stage often shows up as a symptom in a later stage. This is why you test stage by stage from the supply outward rather than replacing the part nearest the symptom.' },
        { kind: 'order', id: 'm1-lo1-q3', competency: 'Explain the overview of Electronic Systems Servicing.',
          stem: 'Arrange the servicing procedure in the correct order.',
          steps: [
            'Confirm the reported fault',
            'Isolate the unit from the supply',
            'Inspect visually for obvious damage',
            'Test stage by stage from the power source',
            'Repair or replace the faulty part',
            'Test the unit under normal operation',
          ] },
      ],
    },
    {
      id: 'lo2',
      title: 'Discuss electronic components identification',
      lessons: [{
        id: 'l1',
        title: 'Reading a component before you test it',
        blocks: [
          { kind: 'text', md: 'Components divide into two broad families. Passive components (resistors, capacitors, inductors) do not add energy to a signal. Active components (diodes, transistors, integrated circuits) control or amplify a signal and need a supply to work. Knowing which family a part belongs to tells you what a meter should read on it before you ever touch a probe to it.' },
          { kind: 'table',
            headers: ['Component', 'Family', 'Marking you read', 'What a healthy part shows'],
            rows: [
              ['Resistor', 'Passive', 'Colour bands', 'Its nominal value within tolerance'],
              ['Capacitor', 'Passive', 'Printed value and voltage', 'Charging behaviour, not a short'],
              ['Diode', 'Active', 'Body code and cathode band', 'Conducts one way only'],
              ['LED', 'Active', 'Package colour and lead length', 'Forward drop, lights on diode test'],
              ['Fuse', 'Passive', 'Current and voltage rating', 'Near zero ohms, continuity beeps'],
            ] },
          { kind: 'text', md: 'The four-band resistor code is the one marking you will read constantly. The first two bands are digits, the third is the number of zeros to add, and the fourth is tolerance. Gold in the fourth position means plus or minus five percent.' },
          { kind: 'interactive', simId: 'multimeter', config: { preset: 'identify' } },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm1-lo2-q1', competency: 'Discuss electronic components identification.',
          stem: 'A resistor is banded yellow, violet, red, gold. What is its value and tolerance?',
          options: ['470 ohms, 5 percent', '4.7 kilohms, 5 percent', '47 kilohms, 5 percent', '4.7 kilohms, 10 percent'],
          answer: 1,
          rationale: [
            'That would be yellow, violet, brown.',
            'Correct. Yellow is 4, violet is 7, red adds two zeros giving 4700 ohms, and gold is 5 percent.',
            'That would be yellow, violet, orange.',
            'Gold is 5 percent. Silver would be 10 percent.',
          ] },
        { kind: 'mcq', id: 'm1-lo2-q2', competency: 'Discuss electronic components identification.',
          stem: 'Which of these is an active component?',
          options: ['Carbon film resistor', 'Electrolytic capacitor', 'Signal diode', 'Wirewound inductor'],
          answer: 2,
          rationale: [
            'Resistors are passive. They dissipate energy, they do not control it.',
            'Capacitors are passive. They store and release energy without controlling a signal.',
            'Correct. A diode controls the direction of current flow, which makes it active.',
            'Inductors are passive.',
          ] },
        { kind: 'truefalse', id: 'm1-lo2-q3', competency: 'Discuss electronic components identification.',
          stem: 'A healthy fuse should read close to zero ohms on a meter.',
          answer: true,
          rationale: 'A fuse is a deliberate low-resistance link. Near zero ohms and a continuity beep mean it is intact. An open reading means it has blown.' },
      ],
    },
    {
      id: 'lo3',
      title: 'Demonstrate procedures in testing electronic components',
      lessons: [{
        id: 'l1',
        title: 'Using the multimeter on each component type',
        blocks: [
          { kind: 'text', md: 'A digital multimeter answers a different question in each mode. Choosing the wrong mode is the most common reason a good component appears faulty.' },
          { kind: 'table',
            headers: ['Mode', 'Question it answers', 'Use it on'],
            rows: [
              ['Ohms', 'How much does this resist current?', 'Resistors, heating elements, motor windings'],
              ['Continuity', 'Is there an unbroken path?', 'Fuses, switches, cables, connectors'],
              ['Diode test', 'Does this conduct one way only?', 'Diodes, LEDs, transistor junctions'],
              ['DC volts', 'What potential is present here?', 'Live circuits, batteries, supply rails'],
            ] },
          { kind: 'steps', items: [
            'Isolate the component from the supply and discharge any capacitors.',
            'Lift at least one leg of the component out of circuit where possible.',
            'Select the mode that matches the question you are asking.',
            'Touch the probes to the leads and let the reading settle.',
            'Compare the reading against the marked value and its tolerance.',
          ] },
          { kind: 'safety', md: 'A filter capacitor can hold a lethal charge long after the unit is unplugged. Discharge it through a bleeder resistor of about 2.2 kilohms rated 5 watts. Never short the terminals with a screwdriver: it welds the tip, damages the capacitor, and throws molten metal.' },
          { kind: 'note', md: 'Measuring a resistor while it is still soldered into a circuit usually reads low, because other parts in parallel with it also carry current. Lifting one leg removes those parallel paths.' },
          { kind: 'interactive', simId: 'multimeter', config: { preset: 'test' } },
        ],
      }],
      quiz: [
        { kind: 'mcq', id: 'm1-lo3-q1', competency: 'Demonstrate procedures in testing electronic components.',
          stem: 'A 4.7 kilohm resistor marked 5 percent measures 4.61 kilohms. What do you conclude?',
          options: [
            'It has drifted and should be replaced',
            'It is within tolerance and is good',
            'The meter is faulty',
            'It is shorted',
          ],
          answer: 1,
          rationale: [
            'Drift only matters once the reading falls outside the tolerance band.',
            'Correct. Five percent of 4.7 kilohms is 235 ohms, so anything from 4.465 to 4.935 kilohms is acceptable.',
            'The reading is consistent with a healthy part, so there is no reason to suspect the meter.',
            'A shorted resistor would read near zero ohms.',
          ] },
        { kind: 'mcq', id: 'm1-lo3-q2', competency: 'Demonstrate procedures in testing electronic components.',
          stem: 'Which mode confirms that a fuse is intact?',
          options: ['DC volts', 'Continuity', 'Diode test', 'AC volts'],
          answer: 1,
          rationale: [
            'DC volts measures potential, not whether a path is unbroken.',
            'Correct. Continuity tests for an unbroken low-resistance path, which is exactly what a fuse should provide.',
            'Diode test checks one-way conduction, which a fuse does not do.',
            'AC volts measures potential in an energised circuit.',
          ] },
        { kind: 'order', id: 'm1-lo3-q3', competency: 'Demonstrate procedures in testing electronic components.',
          stem: 'Arrange the steps to safely test a resistor in a mains appliance.',
          steps: [
            'Unplug the appliance from the supply',
            'Discharge the filter capacitor through a bleeder resistor',
            'Lift one leg of the resistor out of circuit',
            'Select the ohms mode on the meter',
            'Measure and compare against the marked value',
          ] },
      ],
    },
  ],
}
```

- [ ] **Step 2: Verify it type checks**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/m1.ts
git commit -m "content: add Module 1, electronic systems and component testing"
```

**Review gate for the teacher:** the safety callout on capacitor discharge in `lo3` is the first piece of content a student could act on physically. It must be checked before `teacherReviewed` is set to true.

---

### Task 5: Quiz grading and scoring

**Files:**
- Create: `src/lib/quiz.ts`
- Test: `tests/quiz.test.ts`

**Interfaces:**
- Consumes: `QuizItem` from `src/lib/types`
- Produces:
  - `gradeItem(item: QuizItem, response: unknown): boolean`
  - `scoreQuiz(items: QuizItem[], responses: Record<string, unknown>): QuizResult`
  - `interface QuizResult { correct: number; total: number; perCompetency: Record<string, { correct: number; total: number }> }`

`perCompetency` is what makes per-competency gain reporting possible in Plan 3, so it is built now rather than retrofitted.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/quiz.test.ts
import { gradeItem, scoreQuiz } from '../src/lib/quiz'
import type { QuizItem } from '../src/lib/types'

const mcq: QuizItem = { kind: 'mcq', id: 'a', competency: 'C1', stem: '', options: ['x', 'y'], answer: 1, rationale: ['', ''] }
const tf: QuizItem = { kind: 'truefalse', id: 'b', competency: 'C1', stem: '', answer: true, rationale: '' }
const ord: QuizItem = { kind: 'order', id: 'c', competency: 'C2', stem: '', steps: ['one', 'two', 'three'] }

describe('gradeItem', () => {
  it('marks the correct multiple choice index', () => {
    expect(gradeItem(mcq, 1)).toBe(true)
    expect(gradeItem(mcq, 0)).toBe(false)
  })

  it('marks true or false', () => {
    expect(gradeItem(tf, true)).toBe(true)
    expect(gradeItem(tf, false)).toBe(false)
  })

  it('marks an ordering only when the whole sequence matches', () => {
    expect(gradeItem(ord, ['one', 'two', 'three'])).toBe(true)
    expect(gradeItem(ord, ['one', 'three', 'two'])).toBe(false)
    expect(gradeItem(ord, ['one', 'two'])).toBe(false)
  })

  it('treats a missing or malformed response as incorrect rather than throwing', () => {
    expect(gradeItem(mcq, undefined)).toBe(false)
    expect(gradeItem(ord, 'not an array')).toBe(false)
  })
})

describe('scoreQuiz', () => {
  it('totals correct answers and breaks them down by competency', () => {
    const r = scoreQuiz([mcq, tf, ord], { a: 1, b: false, c: ['one', 'two', 'three'] })
    expect(r.correct).toBe(2)
    expect(r.total).toBe(3)
    expect(r.perCompetency.C1).toEqual({ correct: 1, total: 2 })
    expect(r.perCompetency.C2).toEqual({ correct: 1, total: 1 })
  })

  it('counts unanswered items as incorrect', () => {
    const r = scoreQuiz([mcq, tf], {})
    expect(r.correct).toBe(0)
    expect(r.total).toBe(2)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/quiz.test.ts`
Expected: FAIL, cannot resolve `../src/lib/quiz`.

- [ ] **Step 3: Implement src/lib/quiz.ts**

```ts
import type { QuizItem } from './types'

export interface QuizResult {
  correct: number
  total: number
  perCompetency: Record<string, { correct: number; total: number }>
}

export function gradeItem(item: QuizItem, response: unknown): boolean {
  switch (item.kind) {
    case 'mcq':
      return response === item.answer
    case 'truefalse':
      return response === item.answer
    case 'order':
      if (!Array.isArray(response)) return false
      if (response.length !== item.steps.length) return false
      return item.steps.every((s, i) => response[i] === s)
  }
}

export function scoreQuiz(
  items: QuizItem[],
  responses: Record<string, unknown>,
): QuizResult {
  const perCompetency: QuizResult['perCompetency'] = {}
  let correct = 0

  for (const item of items) {
    const ok = gradeItem(item, responses[item.id])
    if (ok) correct++
    const bucket = perCompetency[item.competency] ?? { correct: 0, total: 0 }
    bucket.total++
    if (ok) bucket.correct++
    perCompetency[item.competency] = bucket
  }

  return { correct, total: items.length, perCompetency }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/quiz.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz.ts tests/quiz.test.ts
git commit -m "feat: add quiz grading with per-competency breakdown"
```

---

### Task 6: The measure engine

**Files:**
- Create: `src/lib/measure.ts`
- Test: `tests/measure.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type ComponentKind = 'resistor' | 'capacitor' | 'diode' | 'led' | 'fuse'`
  - `type FaultMode = 'ok' | 'open' | 'short' | 'drift'`
  - `type MeterMode = 'ohms' | 'continuity' | 'diode' | 'dcv'`
  - `interface TestComponent { id: string; kind: ComponentKind; label: string; nominal: number; tolerance: number; fault: FaultMode }`
  - `interface Reading { display: string; overload: boolean; beep: boolean }`
  - `measure(c: TestComponent, mode: MeterMode): Reading`
  - `withinTolerance(c: TestComponent, measured: number): boolean`

This engine is used by four modules, so its correctness matters more than any screen. `display` is a formatted string because that is what a real meter shows and what the UI renders directly; the engine owns formatting so the UI cannot introduce rounding differences.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/measure.test.ts
import { measure, withinTolerance } from '../src/lib/measure'
import type { TestComponent } from '../src/lib/measure'

const r = (fault: TestComponent['fault'] = 'ok'): TestComponent =>
  ({ id: 'R1', kind: 'resistor', label: '4.7 kOhm 5%', nominal: 4700, tolerance: 0.05, fault })

const fuse = (fault: TestComponent['fault'] = 'ok'): TestComponent =>
  ({ id: 'F1', kind: 'fuse', label: '2 A', nominal: 0.2, tolerance: 0.5, fault })

const diode = (fault: TestComponent['fault'] = 'ok'): TestComponent =>
  ({ id: 'D1', kind: 'diode', label: '1N4007', nominal: 0.62, tolerance: 0.1, fault })

describe('measure in ohms mode', () => {
  it('reads a healthy resistor near its nominal value', () => {
    const out = measure(r(), 'ohms')
    expect(out.overload).toBe(false)
    expect(out.display).toMatch(/^4\.\d{2} k$/)
  })

  it('reads overload for an open resistor', () => {
    expect(measure(r('open'), 'ohms').overload).toBe(true)
  })

  it('reads near zero for a shorted resistor', () => {
    expect(measure(r('short'), 'ohms').display).toBe('0.00')
  })

  it('reads outside tolerance for a drifted resistor', () => {
    const out = measure(r('drift'), 'ohms')
    const value = parseFloat(out.display) * 1000
    expect(withinTolerance(r(), value)).toBe(false)
  })
})

describe('measure in continuity mode', () => {
  it('beeps on a healthy fuse', () => {
    expect(measure(fuse(), 'continuity').beep).toBe(true)
  })

  it('does not beep on a blown fuse', () => {
    const out = measure(fuse('open'), 'continuity')
    expect(out.beep).toBe(false)
    expect(out.overload).toBe(true)
  })
})

describe('measure in diode mode', () => {
  it('shows a forward drop on a healthy diode', () => {
    expect(measure(diode(), 'diode').display).toBe('0.62')
  })

  it('shows overload on an open diode', () => {
    expect(measure(diode('open'), 'diode').overload).toBe(true)
  })

  it('shows near zero on a shorted diode', () => {
    expect(measure(diode('short'), 'diode').display).toBe('0.00')
  })
})

describe('wrong mode for the component', () => {
  it('reads overload when testing a resistor in diode mode', () => {
    expect(measure(r(), 'diode').overload).toBe(true)
  })
})

describe('withinTolerance', () => {
  it('accepts a value inside the band', () => {
    expect(withinTolerance(r(), 4610)).toBe(true)
  })
  it('rejects a value outside the band', () => {
    expect(withinTolerance(r(), 4000)).toBe(false)
  })
  it('accepts a value exactly on the boundary', () => {
    expect(withinTolerance(r(), 4465)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/measure.test.ts`
Expected: FAIL, cannot resolve `../src/lib/measure`.

- [ ] **Step 3: Implement src/lib/measure.ts**

```ts
export type ComponentKind = 'resistor' | 'capacitor' | 'diode' | 'led' | 'fuse'
export type FaultMode = 'ok' | 'open' | 'short' | 'drift'
export type MeterMode = 'ohms' | 'continuity' | 'diode' | 'dcv'

export interface TestComponent {
  id: string
  kind: ComponentKind
  label: string
  /** Ohms for resistive parts, forward volts for junctions. */
  nominal: number
  /** Fraction, so 0.05 is five percent. */
  tolerance: number
  fault: FaultMode
}

export interface Reading {
  display: string
  overload: boolean
  beep: boolean
}

const OL: Reading = { display: 'OL', overload: true, beep: false }
const SHORT: Reading = { display: '0.00', overload: false, beep: true }

/**
 * A real meter reads a little off nominal even on a good part. A fixed
 * offset keeps the engine deterministic so tests stay stable, while still
 * teaching students that a reading rarely lands exactly on the marked value.
 */
const GOOD_OFFSET = -0.019
const DRIFT_OFFSET = 0.23

function formatOhms(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} k`
  return value.toFixed(2)
}

function resistanceOf(c: TestComponent): number | null {
  switch (c.fault) {
    case 'open': return null
    case 'short': return 0
    case 'drift': return c.nominal * (1 + DRIFT_OFFSET)
    case 'ok': return c.nominal * (1 + GOOD_OFFSET)
  }
}

export function withinTolerance(c: TestComponent, measured: number): boolean {
  const band = c.nominal * c.tolerance
  return measured >= c.nominal - band && measured <= c.nominal + band
}

export function measure(c: TestComponent, mode: MeterMode): Reading {
  const resistive = c.kind === 'resistor' || c.kind === 'fuse'
  const junction = c.kind === 'diode' || c.kind === 'led'

  switch (mode) {
    case 'ohms': {
      if (junction || c.kind === 'capacitor') return OL
      const value = resistanceOf(c)
      if (value === null) return OL
      if (value === 0) return SHORT
      return { display: formatOhms(value), overload: false, beep: false }
    }

    case 'continuity': {
      if (!resistive) return OL
      const value = resistanceOf(c)
      if (value === null) return OL
      // Meters beep below roughly 50 ohms.
      const beep = value < 50
      return { display: formatOhms(value), overload: false, beep }
    }

    case 'diode': {
      if (!junction) return OL
      if (c.fault === 'open') return OL
      if (c.fault === 'short') return SHORT
      const drop = c.fault === 'drift' ? c.nominal * (1 + DRIFT_OFFSET) : c.nominal
      return { display: drop.toFixed(2), overload: false, beep: false }
    }

    case 'dcv':
      // Out of circuit there is no potential across an isolated component.
      return { display: '0.00', overload: false, beep: false }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/measure.test.ts`
Expected: 13 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/measure.ts tests/measure.test.ts
git commit -m "feat: add meter reading engine with fault modes"
```

---

### Task 7: App shell, routing, and the module map

**Files:**
- Create: `src/ui/Shell.tsx`, `src/routes/ModuleMap.tsx`, `src/routes/ModuleOverview.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `allModules`, `getModule` from `src/content`, `loadState` from `src/lib/store`
- Produces: routes `/`, `/m/:moduleId`, `/m/:moduleId/lo/:outcomeId` (the third rendered in Task 8)

Hash history is deliberate. It makes the built app work when opened from a lab PC folder or a host subpath with no server rewrite rules, which the spec requires.

- [ ] **Step 1: Write src/ui/Shell.tsx**

```tsx
import { Link, useLocation } from 'react-router'
import type { ReactNode } from 'react'

const NAV = [
  { to: '/', label: 'Modules' },
  { to: '/labs', label: 'Labs' },
  { to: '/progress', label: 'Progress' },
]

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div style={{ minHeight: '100dvh' }}>
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
          color: 'var(--ink)', fontWeight: 700, fontSize: 14,
        }}>
          <span aria-hidden style={{
            width: 22, height: 22, borderRadius: 7, background: 'var(--accent)',
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800,
          }}>E</span>
          EPAS
        </Link>
        <nav style={{ display: 'flex', gap: 18 }}>
          {NAV.map(n => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <Link key={n.to} to={n.to} style={{
                fontSize: 13, textDecoration: 'none', minHeight: 44,
                display: 'flex', alignItems: 'center',
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: active ? 620 : 400,
              }}>{n.label}</Link>
            )
          })}
        </nav>
      </header>
      <main style={{ padding: '18px 16px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Write src/routes/ModuleMap.tsx**

```tsx
import { Link } from 'react-router'
import { allModules } from '../content'
import { loadState } from '../lib/store'

export default function ModuleMap() {
  const state = loadState()
  const modules = allModules()

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 2px' }}>
        Modules
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        Grade 12 · one term · 11 weeks
      </p>

      <ul style={{
        listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      }}>
        {modules.map(m => {
          const done = state.modules[m.id]?.completedOutcomes.length ?? 0
          const pct = Math.round((done / m.outcomes.length) * 100)
          return (
            <li key={m.id}>
              <Link to={`/m/${m.id}`} className="tile" style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: `var(--${m.tint})`, color: 'var(--ink)',
                borderRadius: 14, padding: 14, minHeight: 120, textDecoration: 'none',
                border: '1px solid rgba(0,0,0,0.045)',
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: `var(--${m.tint}-ink)` }}>
                    {m.week.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 640, lineHeight: 1.3, marginTop: 6 }}>
                    {m.title}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.09)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: `var(--${m.tint}-ink)` }} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: `var(--${m.tint}-ink)`, fontVariantNumeric: 'tabular-nums',
                  }}>{pct}%</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
```

- [ ] **Step 3: Add the tile press interaction to src/index.css**

Frequency-rationed motion per DESIGN.md: a press and nothing else.

```css
.tile {
  transition: transform 140ms var(--ease-out);
}
.tile:active {
  transform: scale(0.98);
}
```

- [ ] **Step 4: Write src/routes/ModuleOverview.tsx**

```tsx
import { Link, useParams } from 'react-router'
import { getModule } from '../content'
import { loadState } from '../lib/store'

export default function ModuleOverview() {
  const { moduleId = '' } = useParams()
  const m = getModule(moduleId)
  const state = loadState()

  if (!m) {
    return <p style={{ color: 'var(--ink-2)' }}>That module does not exist yet. <Link to="/">Back to modules</Link></p>
  }

  const done = state.modules[m.id]?.completedOutcomes ?? []

  return (
    <>
      <Link to="/" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Modules</Link>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 2px' }}>{m.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px' }}>{m.week}</p>

      {!m.teacherReviewed && (
        <p role="status" style={{
          fontSize: 12, color: 'var(--caution)', background: 'var(--surface)',
          border: '1px solid var(--line)', borderLeft: '3px solid var(--caution)',
          borderRadius: '0 10px 10px 0', padding: '10px 12px', margin: '0 0 16px',
        }}>
          This module has not yet been reviewed by your teacher. Confirm any procedure with them before performing it on real equipment.
        </p>
      )}

      <h2 style={{ fontSize: 13, fontWeight: 660, margin: '0 0 8px' }}>Learning competencies</h2>
      <ul style={{ margin: '0 0 22px', paddingLeft: 18 }}>
        {m.competencies.map(c => (
          <li key={c} style={{ fontSize: 13.5, lineHeight: 1.62, color: 'var(--ink-2)', marginBottom: 4 }}>{c}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 13, fontWeight: 660, margin: '0 0 8px' }}>Outcomes</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {m.outcomes.map(o => (
          <li key={o.id}>
            <Link to={`/m/${m.id}/lo/${o.id}`} className="tile" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
              padding: '13px 14px', textDecoration: 'none', color: 'var(--ink)', minHeight: 44,
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>{o.title}</span>
              {done.includes(o.id) && (
                <span style={{ fontSize: 11, color: 'var(--pass)', fontWeight: 640, flex: 'none' }}>Done</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
```

- [ ] **Step 5: Wire the router in src/App.tsx**

```tsx
import { createHashRouter, RouterProvider } from 'react-router'
import { Shell } from './ui/Shell'
import ModuleMap from './routes/ModuleMap'
import ModuleOverview from './routes/ModuleOverview'
import LessonReader from './routes/LessonReader'

const router = createHashRouter([
  { path: '/', element: <Shell><ModuleMap /></Shell> },
  { path: '/m/:moduleId', element: <Shell><ModuleOverview /></Shell> },
  { path: '/m/:moduleId/lo/:outcomeId', element: <Shell><LessonReader /></Shell> },
])

export default function App() {
  return <RouterProvider router={router} />
}
```

`LessonReader` does not exist until Task 8. Complete Task 8 before running the dev server, or temporarily stub the import to keep the build green.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/ui/Shell.tsx src/routes/ModuleMap.tsx src/routes/ModuleOverview.tsx src/index.css
git commit -m "feat: add app shell, hash routing, and module map"
```

---

### Task 8: Block renderer and lesson reader

**Files:**
- Create: `src/ui/blocks/BlockRenderer.tsx`, `src/routes/LessonReader.tsx`
- Test: `tests/blocks.test.tsx`

**Interfaces:**
- Consumes: `Block` from `src/lib/types`, `MultimeterTrainer` from `src/interactives/MultimeterTrainer` (Task 9)
- Produces: `<BlockRenderer blocks={Block[]} moduleId={string} />`

One component test earns its place here: safety callouts must always render with a role a screen reader announces, and that is a requirement rather than a style choice.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/blocks.test.tsx
import { render, screen } from '@testing-library/react'
import { BlockRenderer } from '../src/ui/blocks/BlockRenderer'
import type { Block } from '../src/lib/types'

describe('BlockRenderer', () => {
  it('announces a safety block to assistive technology', () => {
    const blocks: Block[] = [{ kind: 'safety', md: 'Unplug the appliance first.' }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Unplug the appliance first.')
  })

  it('renders table headers and rows', () => {
    const blocks: Block[] = [{ kind: 'table', headers: ['Mode', 'Use'], rows: [['Ohms', 'Resistors']] }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getByText('Mode')).toBeInTheDocument()
    expect(screen.getByText('Resistors')).toBeInTheDocument()
  })

  it('renders ordered steps as a list', () => {
    const blocks: Block[] = [{ kind: 'steps', items: ['First', 'Second'] }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/blocks.test.tsx`
Expected: FAIL, cannot resolve `BlockRenderer`.

- [ ] **Step 3: Implement src/ui/blocks/BlockRenderer.tsx**

```tsx
import type { Block } from '../../lib/types'
import { MultimeterTrainer } from '../../interactives/MultimeterTrainer'

const text: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.62, color: 'var(--ink-2)',
  maxWidth: '60ch', margin: '0 0 14px',
}

function Callout({ tone, children }: { tone: 'safety' | 'note'; children: React.ReactNode }) {
  const colour = tone === 'safety' ? 'var(--danger)' : 'var(--ink-3)'
  return (
    <div role="note" style={{
      borderLeft: `3px solid ${colour}`, background: 'var(--surface)',
      border: '1px solid var(--line)', borderLeft: `3px solid ${colour}`,
      borderRadius: '0 10px 10px 0', padding: '11px 13px', margin: '0 0 16px',
      fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', maxWidth: '60ch',
    }}>
      <strong style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: colour, marginBottom: 4 }}>
        {tone === 'safety' ? 'Safety' : 'Note'}
      </strong>
      {children}
    </div>
  )
}

export function BlockRenderer({ blocks, moduleId }: { blocks: Block[]; moduleId: string }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'text':
            return <p key={i} style={text}>{b.md}</p>

          case 'safety':
            return <Callout key={i} tone="safety">{b.md}</Callout>

          case 'note':
            return <Callout key={i} tone="note">{b.md}</Callout>

          case 'steps':
            return (
              <ol key={i} style={{ ...text, paddingLeft: 20 }}>
                {b.items.map((s, j) => <li key={j} style={{ marginBottom: 6 }}>{s}</li>)}
              </ol>
            )

          case 'table':
            return (
              <div key={i} style={{ overflowX: 'auto', margin: '0 0 18px' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 420 }}>
                  <thead>
                    <tr>{b.headers.map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)',
                        fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-3)',
                      }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, ri) => (
                      <tr key={ri}>{row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink-2)', lineHeight: 1.5 }}>{cell}</td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          case 'figure':
            return (
              <figure key={i} style={{ margin: '0 0 18px' }}>
                <img src={b.src} alt={b.alt} style={{ maxWidth: '100%', borderRadius: 14 }} />
                {b.caption && <figcaption style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{b.caption}</figcaption>}
              </figure>
            )

          case 'interactive':
            if (b.simId === 'multimeter') {
              return <MultimeterTrainer key={i} moduleId={moduleId} config={b.config} />
            }
            return (
              <p key={i} style={{ ...text, color: 'var(--ink-3)' }}>
                This activity is not available yet.
              </p>
            )
        }
      })}
    </>
  )
}
```

- [ ] **Step 4: Implement src/routes/LessonReader.tsx**

```tsx
import { Link, useParams, useNavigate } from 'react-router'
import { getModule } from '../content'
import { markOutcomeComplete } from '../lib/store'
import { BlockRenderer } from '../ui/blocks/BlockRenderer'
import { Quiz } from '../ui/Quiz'

export default function LessonReader() {
  const { moduleId = '', outcomeId = '' } = useParams()
  const navigate = useNavigate()
  const m = getModule(moduleId)
  const outcome = m?.outcomes.find(o => o.id === outcomeId)

  if (!m || !outcome) {
    return <p style={{ color: 'var(--ink-2)' }}>Not found. <Link to="/">Back to modules</Link></p>
  }

  return (
    <>
      <Link to={`/m/${m.id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
        {m.title}
      </Link>
      <h1 style={{ fontSize: 20, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 16px', maxWidth: '30ch' }}>
        {outcome.title}
      </h1>

      {outcome.lessons.map(l => (
        <section key={l.id} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 10px' }}>{l.title}</h2>
          <BlockRenderer blocks={l.blocks} moduleId={m.id} />
        </section>
      ))}

      <Quiz
        items={outcome.quiz}
        moduleId={m.id}
        onFinish={() => {
          markOutcomeComplete(m.id, outcome.id)
          navigate(`/m/${m.id}`)
        }}
      />
    </>
  )
}
```

- [ ] **Step 5: Implement src/ui/Quiz.tsx**

```tsx
import { useState } from 'react'
import type { QuizItem } from '../lib/types'
import { gradeItem, scoreQuiz } from '../lib/quiz'
import { recordAttempt } from '../lib/store'

export function Quiz({ items, moduleId, onFinish }: {
  items: QuizItem[]
  moduleId: string
  onFinish: () => void
}) {
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    for (const item of items) {
      recordAttempt({
        itemId: item.id,
        moduleId,
        competency: item.competency,
        correct: gradeItem(item, responses[item.id]),
        at: new Date().toISOString(),
        context: 'formative',
      })
    }
    setSubmitted(true)
  }

  const result = submitted ? scoreQuiz(items, responses) : null

  return (
    <section style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 14, padding: 16, maxWidth: '60ch',
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 14px' }}>Check your understanding</h2>

      {items.map(item => {
        const answered = responses[item.id]
        const correct = submitted && gradeItem(item, answered)
        return (
          <fieldset key={item.id} style={{ border: 0, padding: 0, margin: '0 0 20px' }}>
            <legend style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, padding: 0, marginBottom: 8 }}>
              {item.stem}
            </legend>

            {item.kind === 'mcq' && item.options.map((opt, i) => (
              <label key={i} style={{
                display: 'flex', gap: 9, alignItems: 'flex-start', minHeight: 44,
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)',
                border: `1px solid ${submitted && i === item.answer ? 'var(--pass)' : 'transparent'}`,
              }}>
                <input type="radio" name={item.id} disabled={submitted}
                  checked={answered === i}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: i }))}
                  style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
                <span>{opt}</span>
              </label>
            ))}

            {item.kind === 'truefalse' && [true, false].map(v => (
              <label key={String(v)} style={{
                display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 13.5,
                color: 'var(--ink-2)',
                border: `1px solid ${submitted && v === item.answer ? 'var(--pass)' : 'transparent'}`,
              }}>
                <input type="radio" name={item.id} disabled={submitted}
                  checked={answered === v}
                  onChange={() => setResponses(r => ({ ...r, [item.id]: v }))}
                  style={{ accentColor: 'var(--accent)' }} />
                <span>{v ? 'True' : 'False'}</span>
              </label>
            ))}

            {item.kind === 'order' && (
              <OrderInput item={item} disabled={submitted}
                onChange={seq => setResponses(r => ({ ...r, [item.id]: seq }))} />
            )}

            {submitted && (
              <p style={{
                fontSize: 12.5, lineHeight: 1.55, marginTop: 8,
                color: correct ? 'var(--pass)' : 'var(--caution)',
              }}>
                {correct ? 'Correct. ' : 'Not quite. '}
                {item.kind === 'mcq' ? item.rationale[item.answer]
                  : item.kind === 'truefalse' ? item.rationale
                  : `The correct order is: ${item.steps.join(', ')}.`}
              </p>
            )}
          </fieldset>
        )
      })}

      {!submitted ? (
        <button onClick={submit} className="tile" style={{
          background: 'var(--accent)', color: '#fff', border: 0, borderRadius: 10,
          padding: '11px 18px', fontSize: 14, fontWeight: 620, cursor: 'pointer', minHeight: 44,
        }}>Check answers</button>
      ) : (
        <div>
          <p style={{ fontSize: 14, fontWeight: 620, margin: '0 0 12px' }}>
            You scored {result!.correct} out of {result!.total}.
          </p>
          <button onClick={onFinish} className="tile" style={{
            background: 'var(--accent)', color: '#fff', border: 0, borderRadius: 10,
            padding: '11px 18px', fontSize: 14, fontWeight: 620, cursor: 'pointer', minHeight: 44,
          }}>Mark this outcome complete</button>
        </div>
      )}
    </section>
  )
}

function OrderInput({ item, disabled, onChange }: {
  item: Extract<QuizItem, { kind: 'order' }>
  disabled: boolean
  onChange: (seq: string[]) => void
}) {
  // Deterministic shuffle: reverse. Keeps the exercise real without adding
  // randomness that would make the student's experience irreproducible.
  const [pool, setPool] = useState<string[]>(() => [...item.steps].reverse())
  const [chosen, setChosen] = useState<string[]>([])

  function pick(step: string) {
    const nextChosen = [...chosen, step]
    setChosen(nextChosen)
    setPool(p => p.filter(s => s !== step))
    onChange(nextChosen)
  }

  function reset() {
    setPool([...item.steps].reverse())
    setChosen([])
    onChange([])
  }

  return (
    <div>
      <ol style={{ paddingLeft: 20, margin: '0 0 8px', fontSize: 13.5, color: 'var(--ink)' }}>
        {chosen.map(s => <li key={s} style={{ marginBottom: 4 }}>{s}</li>)}
      </ol>
      {!disabled && pool.map(s => (
        <button key={s} onClick={() => pick(s)} style={{
          display: 'block', width: '100%', textAlign: 'left', minHeight: 44,
          background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10,
          padding: '9px 11px', marginBottom: 6, fontSize: 13.5, color: 'var(--ink-2)',
          cursor: 'pointer', font: 'inherit',
        }}>{s}</button>
      ))}
      {!disabled && chosen.length > 0 && (
        <button onClick={reset} style={{
          background: 'none', border: 0, color: 'var(--accent)', fontSize: 12,
          cursor: 'pointer', padding: '8px 0', minHeight: 44,
        }}>Start over</button>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/blocks.test.tsx`
Expected: 3 passing.

- [ ] **Step 7: Commit**

```bash
git add src/ui src/routes/LessonReader.tsx tests/blocks.test.tsx
git commit -m "feat: add block renderer, lesson reader, and quiz"
```

---

### Task 9: The Multimeter Trainer

**Files:**
- Create: `src/interactives/types.ts`, `src/interactives/MultimeterTrainer.tsx`

**Interfaces:**
- Consumes: `measure`, `withinTolerance`, `TestComponent`, `MeterMode` from `src/lib/measure`; `recordSim` from `src/lib/store`
- Produces: `SimEvent`, `<MultimeterTrainer moduleId config />`. Every later interactive implements the same `SimEvent` contract.

- [ ] **Step 1: Write src/interactives/types.ts**

```ts
export type SimEvent =
  | { type: 'progress'; pct: number }
  | { type: 'attempt'; correct: boolean }
  | { type: 'complete'; score: number; evidence: Record<string, unknown> }

export interface InteractiveProps {
  moduleId: string
  config?: Record<string, unknown>
  onEvent?: (e: SimEvent) => void
}
```

- [ ] **Step 2: Write src/interactives/MultimeterTrainer.tsx**

The bench holds five components with mixed fault states. The student selects a mode, probes a part, reads the meter, and judges it good or faulty. The instrument keeps the dark skin from DESIGN.md section 4; that break is contained inside this panel.

```tsx
import { useState } from 'react'
import { measure, withinTolerance } from '../lib/measure'
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

export function MultimeterTrainer({ moduleId, onEvent }: InteractiveProps) {
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
        evidence: { verdicts: next },
      })
      onEvent?.({ type: 'complete', score, evidence: { verdicts: next } })
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

      <div style={{ background: '#141A21', padding: 14 }}>
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
            {mode.toUpperCase()}{reading?.beep ? '  BEEP' : ''}
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
```

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: all tests pass across `store`, `quiz`, `measure`, and `blocks`.

- [ ] **Step 4: Run the app and walk the whole slice by hand**

Run: `npm run dev`

Confirm each of these:
- Module map shows M1 with a 0 percent bar
- M1 overview shows the unreviewed warning and three outcomes
- Outcome 3 renders the table, the steps, the safety callout, and the trainer
- Probing F1 in continuity mode reads `OL` and does not beep
- Probing R1 in ohms mode reads about `4.61 k`
- Probing R1 in diode mode reads `OL`, which is the teaching point about wrong modes
- Judging all five parts shows a score
- Completing the quiz returns to the overview with the outcome marked Done
- Reloading the browser keeps the progress
- The module map bar now reads 33 percent

- [ ] **Step 5: Commit**

```bash
git add src/interactives
git commit -m "feat: add Multimeter Trainer with SimEvent contract"
```

---

## Self-Review

**Spec coverage for this slice.** Content model, Task 3. Module 1 content, Task 4. Routing subset, Task 7. `lib/measure` and flagship simulation 1, Tasks 6 and 9. `SimEvent` contract, Task 9. Storage with versioned schema, Task 2. Design tokens and motion rules, Task 1 and Task 7 step 3. `teacherReviewed` surfaced in the UI, Task 7 step 4. Testing scope, Tasks 2, 5, 6, 8.

Deliberately out of this plan and carried into later ones: `lib/signal` and `lib/diagnose` (Plan 2), the three light-interactive engines (Plan 2), Modules 2 to 9 (Plan 2), pre-test and post-test, performance task sheets, evaluation survey, export, teacher merge (Plan 3), PWA and deployment (Plan 4). The `/labs` and `/progress` nav links render nothing until Plan 2 and Plan 3; that is expected and visible.

**Placeholder scan.** No TBDs. Every code step carries runnable code. The one forward reference, `LessonReader` imported in Task 7 before Task 8 creates it, is called out in Task 7 step 5.

**Type consistency.** `TestComponent`, `MeterMode`, `FaultMode` and `Reading` are defined once in Task 6 and imported unchanged in Task 9. `QuizItem` is defined in Task 3 and consumed identically in Tasks 4, 5 and 8. `Attempt` and `SimRecord` are defined in Task 2 and constructed with matching fields in Tasks 8 and 9. `gradeItem` and `scoreQuiz` signatures match between Task 5 and Task 8.
