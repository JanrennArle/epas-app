# Shadow Board Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the whole student app into the Shadow Board world the teacher chose, and give the eight fault-diagnosis labs the Service Mode pixel world, without changing a single behaviour, score, stored record or piece of copy a test depends on.

**Architecture:** Visual only. The legacy tokens every screen already reads (`--paper`, `--surface`, `--ink`, `--line`, `--accent`, `--pass`, `--caution`, `--danger`) are remapped to Shadow Board values first, so every screen changes palette at once. Shared primitives (`Tape`, `PlateLink`, `PlateButton`, the module tool map) and global classes in `src/index.css` then replace inline heading and button styles screen by screen. One new pure engine, `src/lib/board.ts`, decides which tools hang and what the next action is. Service Mode is scoped under a `.service` class and a `src/interactives/service/` folder, used by `SystemTroubleshooter` only.

**Tech Stack:** React 19, Tailwind v4 (only for its preflight; styling stays CSS classes plus inline style as the codebase does), `@phosphor-icons/react` (already a dependency, unused until now), and three new self-hosted font packages: `@fontsource/barlow-condensed`, `@fontsource-variable/atkinson-hyperlegible-next`, `@fontsource/dotgothic16`. Geist Mono stays for measured values. Geist Sans is removed.

**Spec:** The direction contract in `.impeccable/surfaces/src-routes-modulemap-tsx.md`, the creative direction in `design-concepts/CREATIVE-DIRECTION.md` (directions 1 and 5), and the two approved samples, copied into the repo in Task 1 as `docs/design/reference/shadow-board.html` and `docs/design/reference/service-mode.html`. Product constraints: `docs/PRODUCT.md`, `CLAUDE.md`.

## Global Constraints

- **Behaviour is frozen.** No change to anything under `src/lib/` except the new `src/lib/board.ts`. No change to `src/content/`. No change to scoring, recording, consent, routing, the service worker, or what a button does. This plan changes how things look.
- **Copy a test reads is frozen.** Headings, button names, labels, status text and error text keep their exact wording, because `tests/registry.test.tsx`, `tests/task-sheet.test.tsx`, `tests/update-prompt.test.tsx` and `tests/blocks.test.tsx` query by role, name and text. The only new copy is named in Task 2 and Task 7.
- **No surface may carry an answer.** CLAUDE.md: "Card copy, tile labels, link text, headings and instructions are all surfaces a student reads before answering. Name the subject, never the answers." A pixel scene is a surface. It shows the appliance, never the fault. Option order stays array order.
- **Red (`--danger`) is reserved for safety hazards.** Never for wrong answers, errors, emphasis, or the pixel sky. Incorrect answers use `--caution`.
- **No em dashes anywhere in user-visible copy.** Absolute. This includes CSS `content:` strings and `aria-label`s.
- **Offline, no CDN, no WebGL, no canvas.** Fonts are imported from npm packages, latin subsets only where the package offers them. Pixel art is SVG `rect`s.
- **44px minimum touch targets.** Every link and button.
- **Reduced motion honoured.** Every animation in this plan has a `prefers-reduced-motion: reduce` path that shows the finished state immediately.
- **One authored motion per screen.** The module map's opening drop and the troubleshooter's typed complaint are the only two. Everywhere else: `scale(0.98)` on press, 140ms, `--ease-out`, and nothing else.
- **Hover styles live behind `@media (hover: hover) and (pointer: fine)`.**
- **No section-number or kicker eyebrow above a heading.** Week numbers are exempt: they are curriculum data.
- **No coloured `border-left` wider than 1px as a callout device.** The existing callouts use a 3px left stripe; Task 3 replaces it.
- **Phosphor icons only, via `@phosphor-icons/react`.** No hand-drawn icon paths. Pixel sprites in Service Mode are illustration, not icons, and are the one exception.
- **TypeScript runs with `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`.**
- **`src/lib/store.ts` stays the only owner of `localStorage`.** The opening animation's "already played" flag is a module-level variable, not storage.
- **Mutation-check every guard test before believing it.** Break the code, watch the test fail, put the code back.
- **Every task ends with** `npx tsc -b`, `npm test` (all green) and a commit.

## Tokens, exactly

Light (`:root`):

| Token | Value | Role |
|---|---|---|
| `--paper` | `#E3E8E4` | The board |
| `--surface` | `#EEF2EF` | A painted sign screwed to the board (panels) |
| `--hole` | `#CBD2CD` | Pegboard holes |
| `--ink` | `#18201C` | Text |
| `--ink-2` | `#3F4A44` | Secondary text |
| `--ink-3` | `#56615B` | Tertiary text |
| `--line` | `#C3CBC6` | Hairlines |
| `--paint` | `#26302B` | Painted outlines, focus ring |
| `--accent` | `#26302B` | Links, checked states (same as paint) |
| `--on-accent` | `#F2F3EE` | |
| `--plate` | `#F2C230` | The one primary action per screen |
| `--plate-ink` | `#141816` | |
| `--tape` | `#0E1110` | Label tape |
| `--tape-ink` | `#F2F3EE` | |
| `--steel-hi` | `#56615B` | Hooks |
| `--danger` | `#B3372A` | Safety only |
| `--pass` | `#186A3F` | Correct, passed |
| `--caution` | `#8A500A` | Incorrect, warning |
| `--lamp` | `rgba(255, 244, 214, 0.55)` | Work lamp glow |
| `--shade` | `rgba(12, 16, 14, 0.10)` | Tinted shadow |

Dark (`@media (prefers-color-scheme: dark)`):

| Token | Value |
|---|---|
| `--paper` | `#24302A` |
| `--surface` | `#2C3A33` |
| `--hole` | `#1B231F` |
| `--ink` | `#E6EBE7` |
| `--ink-2` | `#B3BDB7` |
| `--ink-3` | `#97A39C` |
| `--line` | `#3A4A42` |
| `--paint` | `#F2C230` |
| `--accent` | `#F2C230` |
| `--on-accent` | `#141816` |
| `--steel-hi` | `#7E8B84` |
| `--danger` | `#EF7A68` |
| `--pass` | `#6FD49B` |
| `--caution` | `#E8B25A` |
| `--lamp` | `rgba(255, 226, 150, 0.20)` |
| `--shade` | `rgba(0, 0, 0, 0.42)` |

`--plate`, `--plate-ink`, `--tape`, `--tape-ink` are the same in both themes. `--pitch` is `24px`, `32px` from 768px, `36px` from 1200px.

Service Mode palette (scoped to `.service`, same in both themes): night `#10132E`, deep `#0A0C1E`, dusk `#232A63`, teal `#1F6F74`, amber `#F2B138`, sunset `#E8622C`, white `#F1EFE6`, grey `#8B93A8`, phosphor `#5BD26B`, danger `#D8352A`.

## File structure

| File | Responsibility |
|---|---|
| `docs/design/reference/shadow-board.html`, `service-mode.html` | **New.** The two approved samples, token sources (not built), for implementers to read. |
| `package.json` | **Modify.** Add the three font packages, remove `@fontsource-variable/geist`. |
| `src/index.css` | **Modify.** Font imports, remapped tokens, the board ground, global primitives (`.tape`, `.plate`, `.sign`, `.callout`, `.rack`, `.board`, `.slot`), Service Mode scope. |
| `src/ui/board/Tape.tsx` | **New.** Label-tape heading. |
| `src/ui/board/Plate.tsx` | **New.** `PlateLink` and `PlateButton`. |
| `src/ui/board/tools.ts` | **New.** Module id to Phosphor icon. |
| `src/ui/board/ToolBoard.tsx` | **New.** The lamp-lit 3x3 board and its opening moment. |
| `src/lib/board.ts` | **New.** Pure: tool states and the next action. |
| `tests/board.test.ts` | **New.** Pins `board.ts` and the tool map. |
| `src/ui/Shell.tsx` | **Modify.** Tape brand, condensed nav, board ground. |
| `src/routes/ModuleMap.tsx` | **Modify.** Hero, board, rack. |
| `src/routes/ModuleOverview.tsx`, `LessonReader.tsx`, `src/ui/blocks/BlockRenderer.tsx`, `src/ui/Quiz.tsx` | **Modify.** Reading surfaces. |
| `src/routes/Assessment.tsx`, `Consent.tsx`, `Evaluate.tsx`, `Progress.tsx`, `TaskSheet.tsx`, `Teacher.tsx`, `src/ui/UpdatePrompt.tsx`, `src/App.tsx` | **Modify.** Record surfaces. |
| `src/routes/Labs.tsx`, `src/interactives/MatchActivity.tsx`, `HotspotActivity.tsx`, `SequenceActivity.tsx`, `MultimeterTrainer.tsx`, `PowerSupplySim.tsx` | **Modify.** Labs and instruments. |
| `src/interactives/service/sprites.ts` | **New.** Palette and one sprite per scenario. |
| `src/interactives/service/PixelScene.tsx` | **New.** The repair shop at sunset with the appliance in the window. |
| `tests/service.test.ts` | **New.** Sprite integrity and the no-answer guard. |
| `src/interactives/SystemTroubleshooter.tsx` | **Modify.** Service Mode windows. Logic untouched. |
| `src/pwa/manifest.ts`, `index.html`, `tests/manifest.test.ts`, `scripts/make-icons.mjs`, generated icons | **Modify.** Brand colours. |
| `CLAUDE.md`, `docs/superpowers/plans/STATUS.md`, `docs/superpowers/plans/CARRY-FORWARD.md` | **Modify.** Record the new world. `docs/DESIGN.md` is rewritten after the build by the documenter, not in a task. |

---

### Task 1: Foundation: fonts, tokens, primitives, Shell

**Files:**
- Create: `docs/design/reference/shadow-board.html`, `docs/design/reference/service-mode.html`
- Create: `src/ui/board/Tape.tsx`, `src/ui/board/Plate.tsx`, `src/ui/board/tools.ts`
- Create: `tests/board.test.ts` (tool map half only; Task 2 adds the engine half)
- Modify: `package.json`, `src/index.css`, `src/ui/Shell.tsx`

**Interfaces:**
- Produces: `Tape({ as?: 'h1' | 'h2' | 'h3', size?: 'hero' | 'page' | 'section', id?: string, children })`; `PlateLink({ to, variant?: 'primary' | 'quiet', children, ...LinkProps })`; `PlateButton({ variant?: 'primary' | 'quiet', children, ...ButtonHTMLAttributes })`; `MODULE_TOOLS: Record<string, Icon>` and `toolFor(moduleId: string): Icon`; CSS classes `.tape`, `.plate`, `.plate--primary`, `.plate--quiet`, `.sign`, `.callout`, `.callout--safety`, `.callout--note`, `.callout--caution`, `.label`, `.rack`, `.board`, `.lamp`, `.slot`, `.back`, `.wrap`, `.press`.

- [ ] **Step 1: Copy the reference samples in.**

```bash
mkdir -p docs/design/reference
cp "C:/Users/Lenovo/AppData/Local/Temp/claude/C--Users-Lenovo-Desktop-epas-app/b5cdd9f9-241a-4155-b743-412bca151dcf/scratchpad/src/01-shadow-board.html" docs/design/reference/shadow-board.html
cp "C:/Users/Lenovo/AppData/Local/Temp/claude/C--Users-Lenovo-Desktop-epas-app/b5cdd9f9-241a-4155-b743-412bca151dcf/scratchpad/src/05-service-mode.html" docs/design/reference/service-mode.html
```

These are the unbuilt sources: `{{FONT:...}}` and `{{ICON:...}}` tokens stand where the built samples embed base64. They are for reading, never served.

- [ ] **Step 2: Install fonts.**

```bash
npm install @fontsource/barlow-condensed@^5.3.0 @fontsource-variable/atkinson-hyperlegible-next@^5.3.0 @fontsource/dotgothic16@^5.3.0
npm uninstall @fontsource-variable/geist
```

- [ ] **Step 3: Write the failing tool-map test.**

`tests/board.test.ts`:

```ts
import { allModules } from '../src/content'
import { MODULE_TOOLS, toolFor } from '../src/ui/board/tools'
import { Wrench } from '@phosphor-icons/react'

describe('module tools', () => {
  // A module added without a tool would hang an anonymous wrench on the board
  // and nobody would notice until a student asked which one it was.
  it('gives every module its own tool', () => {
    const ids = allModules().map(m => m.id)
    for (const id of ids) expect(MODULE_TOOLS[id], id).toBeDefined()
    const icons = ids.map(id => MODULE_TOOLS[id])
    expect(new Set(icons).size).toBe(ids.length)
  })

  it('falls back to a wrench for an unknown id', () => {
    expect(toolFor('nope')).toBe(Wrench)
  })
})
```

- [ ] **Step 4: Run it, expect FAIL** (`Cannot find module '../src/ui/board/tools'`).

Run: `npx vitest run tests/board.test.ts`

- [ ] **Step 5: Write `src/ui/board/tools.ts`.**

```ts
import type { Icon } from '@phosphor-icons/react'
import {
  BellRinging, Cpu, Fan, Gauge, LightbulbFilament, SecurityCamera, Siren, SpeakerHifi, Television, Wrench,
} from '@phosphor-icons/react'

/** The tool that stands for each module on the board, in module order. */
export const MODULE_TOOLS: Record<string, Icon> = {
  m1: Gauge,
  m2: Cpu,
  m3: Fan,
  m4: LightbulbFilament,
  m5: SecurityCamera,
  m6: Siren,
  m7: BellRinging,
  m8: SpeakerHifi,
  m9: Television,
}

export function toolFor(moduleId: string): Icon {
  return MODULE_TOOLS[moduleId] ?? Wrench
}
```

- [ ] **Step 6: Run the test, expect PASS.** Mutation-check: map `m9` to `Fan`, watch "gives every module its own tool" fail, restore.

- [ ] **Step 7: Write `src/ui/board/Tape.tsx`.**

```tsx
import type { ReactNode } from 'react'

/**
 * Embossed label tape. It is the heading, not a decoration on one: the text
 * stays a real h1/h2/h3 so screen readers and tests see the heading, and the
 * tape wraps line by line on a long module title.
 */
export function Tape({ as: Tag = 'h1', size = 'page', id, children }: {
  as?: 'h1' | 'h2' | 'h3'
  size?: 'hero' | 'page' | 'section'
  id?: string
  children: ReactNode
}) {
  return (
    <Tag id={id} className={`tape-heading tape-heading--${size}`}>
      <span className="tape">{children}</span>
    </Tag>
  )
}
```

- [ ] **Step 8: Write `src/ui/board/Plate.tsx`.**

```tsx
import { Link } from 'react-router'
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'quiet'

/**
 * A painted steel plate. `primary` is the yellow one, and a screen has at most
 * one: it is the action the student came for. Everything else is `quiet`.
 */
export function PlateLink({ variant = 'quiet', children, className, ...rest }:
  { variant?: Variant; children: ReactNode } & ComponentProps<typeof Link>) {
  return (
    <Link {...rest} className={`plate plate--${variant}${className ? ` ${className}` : ''}`}>
      {children}
    </Link>
  )
}

export function PlateButton({ variant = 'quiet', children, className, type = 'button', ...rest }:
  { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type={type} className={`plate plate--${variant}${className ? ` ${className}` : ''}`}>
      {children}
    </button>
  )
}
```

- [ ] **Step 9: Replace `src/index.css` entirely.**

```css
@import "tailwindcss";
@import "@fontsource/barlow-condensed/latin-600.css";
@import "@fontsource/barlow-condensed/latin-700.css";
@import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
@import "@fontsource-variable/geist-mono";
@import "@fontsource/dotgothic16/latin-400.css";

@theme {
  --font-sans: "Atkinson Hyperlegible Next Variable", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Barlow Condensed", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
  --font-pixel: "DotGothic16", ui-monospace, monospace;
  --radius-card: 6px;
  --radius-control: 3px;
}

/* A painted pegboard in daylight: the workshop scene most students are in. */
:root {
  --paper: #E3E8E4;
  --surface: #EEF2EF;
  --hole: #CBD2CD;
  --ink: #18201C;
  --ink-2: #3F4A44;
  --ink-3: #56615B;
  --line: #C3CBC6;
  --paint: #26302B;
  --accent: #26302B;
  --on-accent: #F2F3EE;
  --plate: #F2C230;
  --plate-ink: #141816;
  --tape: #0E1110;
  --tape-ink: #F2F3EE;
  --steel-hi: #56615B;
  --danger: #B3372A;
  --pass: #186A3F;
  --caution: #8A500A;
  --lamp: rgba(255, 244, 214, 0.55);
  --shade: rgba(12, 16, 14, 0.10);
  --pitch: 24px;

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

  color-scheme: light dark;
}

/* The same board after hours: dark paint, yellow outlines, one work lamp. */
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #24302A;
    --surface: #2C3A33;
    --hole: #1B231F;
    --ink: #E6EBE7;
    --ink-2: #B3BDB7;
    --ink-3: #97A39C;
    --line: #3A4A42;
    --paint: #F2C230;
    --accent: #F2C230;
    --on-accent: #141816;
    --steel-hi: #7E8B84;
    --danger: #EF7A68;
    --pass: #6FD49B;
    --caution: #E8B25A;
    --lamp: rgba(255, 226, 150, 0.20);
    --shade: rgba(0, 0, 0, 0.42);
  }
}
@media (min-width: 768px) { :root { --pitch: 32px; } }
@media (min-width: 1200px) { :root { --pitch: 36px; } }

html { scrollbar-color: var(--paint) var(--paper); }
body {
  margin: 0;
  min-height: 100dvh;
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 1.0625rem;
  line-height: 1.6;
  background-color: var(--paper);
  /* Every hole on one pitch, and the pitch is the layout grid. */
  background-image: radial-gradient(circle at center, var(--hole) 0 calc(var(--pitch) * 0.075), transparent calc(var(--pitch) * 0.095));
  background-size: var(--pitch) var(--pitch);
  background-position: calc(var(--pitch) / 2) calc(var(--pitch) / 2);
  caret-color: var(--paint);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  overflow-x: clip;
}
::selection { background: var(--plate); color: var(--plate-ink); }

:focus-visible {
  outline: 3px solid var(--paint);
  outline-offset: 3px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Restore list semantics that Tailwind preflight removes. Inline
   listStyle:'none' still wins where a list is used for layout. */
ol { list-style: decimal; }
ul { list-style: disc; }

.wrap { width: min(100% - var(--pitch) * 2, calc(var(--pitch) * 34)); margin-inline: auto; }

/* Anything pressable that is not a plate. */
.press, .tile { transition: transform 140ms var(--ease-out); }
.press:active, .tile:active { transform: scale(0.98); }

/* ---------- label tape ---------- */
.tape {
  padding: 0.16em 0.42em 0.1em;
  background:
    repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, #1B201E, var(--tape) 55%, #080A09);
  color: var(--tape-ink);
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 -1px 0 rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.28);
  box-shadow: 0 2px 3px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08);
  border-radius: 2px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
.tape-heading { margin: 0; font-weight: 700; }
.tape-heading--hero { font-size: clamp(2.1rem, 7vw, 4.2rem); line-height: 1.45; }
.tape-heading--page { font-size: clamp(1.45rem, 2.4vw + 0.9rem, 2.2rem); line-height: 1.5; max-width: 32ch; }
.tape-heading--section { font-size: clamp(1.1rem, 0.8vw + 0.95rem, 1.35rem); line-height: 1.5; }

/* ---------- plates ---------- */
.plate {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.55em;
  min-height: 48px; padding: 0 calc(var(--pitch) * 0.65);
  border: 0; border-radius: 3px; cursor: pointer;
  font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; line-height: 1;
  letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; white-space: nowrap;
  transition: transform 140ms var(--ease-out), box-shadow 140ms var(--ease-out), background-color 160ms ease;
}
.plate svg { width: 1.1em; height: 1.1em; flex: none; }
.plate--primary::before, .plate--primary::after {
  content: ""; position: absolute; top: 50%; width: 6px; height: 6px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.75), rgba(0,0,0,0.45));
  transform: translateY(-50%);
}
.plate--primary::before { left: 8px; }
.plate--primary::after { right: 8px; }
.plate--primary {
  background: linear-gradient(180deg, #F6CD4A, var(--plate)); color: var(--plate-ink);
  box-shadow: 0 3px 0 rgba(0,0,0,0.12), 0 8px 18px var(--shade), inset 0 1px 0 rgba(255,255,255,0.5);
}
.plate--quiet { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--paint); }
.plate:active { transform: translateY(1px) scale(0.98); }
.plate[disabled], .plate[aria-disabled="true"] { opacity: 0.5; cursor: default; transform: none; }
@media (hover: hover) and (pointer: fine) {
  .plate--primary:hover { box-shadow: 0 3px 0 rgba(0,0,0,0.12), 0 12px 24px var(--shade), inset 0 1px 0 rgba(255,255,255,0.5); }
  .plate--quiet:hover { background: color-mix(in srgb, var(--paint) 10%, transparent); }
}
/* Long labels (task titles) may wrap inside a plate rather than overflow a phone. */
.plate--wrap { white-space: normal; text-align: left; padding-block: 10px; line-height: 1.15; }

/* ---------- signs, labels, callouts ---------- */
.sign {
  background: var(--surface);
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 8px 20px var(--shade);
  padding: calc(var(--pitch) * 0.6);
}
.label {
  font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; line-height: 1.2;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2);
}
.back {
  display: inline-flex; align-items: center; gap: 6px; min-height: 44px;
  font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--ink-2); text-decoration: none;
}
.back svg { width: 1em; height: 1em; }
@media (hover: hover) and (pointer: fine) { .back:hover { color: var(--ink); } }

.callout {
  background: var(--surface);
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 8px 20px var(--shade);
  padding: calc(var(--pitch) * 0.5) calc(var(--pitch) * 0.6);
  margin: 0 0 18px; max-width: 60ch;
  font-size: 1rem; line-height: 1.55; color: var(--ink);
}
.callout > strong:first-child {
  display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
  font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; letter-spacing: 0.06em; text-transform: uppercase;
}
.callout > strong:first-child svg { width: 1.2em; height: 1.2em; flex: none; }
.callout--note > strong:first-child { color: var(--ink-2); }
.callout--caution > strong:first-child { color: var(--caution); }
/* Hazard stripes appear on safety content and nowhere else. */
.callout--safety {
  background:
    repeating-linear-gradient(135deg, color-mix(in srgb, var(--danger) 10%, transparent) 0 10px, transparent 10px 20px),
    var(--surface);
}
.callout--safety > strong:first-child { color: var(--danger); }

/* ---------- the rack: a module list painted on the board ---------- */
.rack { list-style: none; margin: 0; padding: 0; display: grid; gap: calc(var(--pitch) * 0.5); grid-template-columns: 1fr; }
@media (min-width: 768px) { .rack { grid-template-columns: repeat(12, 1fr); } .rack > li { grid-column: span var(--span, 4); } }
.rack a {
  position: relative; display: grid; grid-template-columns: calc(var(--pitch) * 1.8) 1fr; gap: calc(var(--pitch) * 0.5); align-items: center;
  min-height: calc(var(--pitch) * 3); height: 100%;
  padding: calc(var(--pitch) * 0.5);
  color: var(--ink); text-decoration: none;
  border: 2px dashed color-mix(in srgb, var(--paint) 55%, transparent);
  border-radius: 6px;
  transition: transform 140ms var(--ease-out), background-color 160ms ease;
}
.rack a:active { transform: scale(0.985); }
@media (hover: hover) and (pointer: fine) { .rack a:hover { background: color-mix(in srgb, var(--paint) 7%, transparent); } }
.rack svg { width: 100%; height: auto; color: var(--paint); }
.rack .t { display: block; margin-top: 4px; font-family: var(--font-display); font-weight: 700; font-size: clamp(1.1rem, 0.6vw + 1rem, 1.3rem); line-height: 1.15; letter-spacing: 0.01em; }
.rack .w { display: block; margin-top: 6px; font-size: 0.92rem; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.rack .here a { border-style: solid; border-color: var(--paint); background: color-mix(in srgb, var(--plate) 16%, transparent); }
.rack .hung a { border-style: solid; }

/* ---------- the board of tools ---------- */
.board {
  position: relative; display: grid; grid-template-columns: repeat(3, 1fr);
  gap: calc(var(--pitch) * 0.5); padding: calc(var(--pitch) * 0.5); isolation: isolate;
}
.lamp {
  position: absolute; inset: calc(var(--pitch) * -3); z-index: -1; pointer-events: none;
  background: radial-gradient(circle at var(--lx, 30%) var(--ly, 20%), var(--lamp), transparent 55%);
}
@media (max-width: 959px) { .lamp { inset: calc(var(--pitch) * -3) 0; } }
.slot { position: relative; aspect-ratio: 1; display: grid; place-items: center; }
.slot .outline, .slot .shadow, .slot .tool { position: absolute; width: 70%; height: 70%; }
.slot .outline { transform: scale(1.16); overflow: visible; }
.slot .outline path { fill: none; stroke: var(--paint); stroke-width: 6; stroke-linejoin: round; }
.slot .shadow { filter: blur(5px); opacity: 0.55; transform: translate(5px, 7px); }
.slot .tool { transform: translateY(var(--ty, 0)); }
.slot .num {
  position: absolute; left: 4%; top: 2%;
  font-family: var(--font-display); font-weight: 700; font-size: clamp(0.8rem, 1vw + 0.5rem, 1.05rem); line-height: 1;
  letter-spacing: 0.06em; color: var(--paint);
}
.slot .hook { position: absolute; top: 3%; width: 16%; height: 7%; border: 3px solid var(--steel-hi); border-bottom: 0; border-radius: 8px 8px 0 0; opacity: 0.8; }
/* A tool part way through its module: the steel fills from the bottom. */
.slot .tool { clip-path: inset(calc((1 - var(--fill, 1)) * 100%) 0 0 0); }
.slot.empty .tool, .slot.empty .shadow { display: none; }

.board-opening .lamp { opacity: 0; }
.board-opening.play .lamp { animation: lamp-on 520ms linear 120ms forwards; }
.board-opening .slot .outline path { stroke-dasharray: 1200; stroke-dashoffset: 1200; }
.board-opening.play .slot .outline path { animation: outline-in 700ms var(--ease-out) forwards; animation-delay: calc(300ms + var(--i) * 70ms); }
.board-opening .slot .tool, .board-opening .slot .shadow { opacity: 0; }
@keyframes lamp-on { 0% { opacity: 0; } 18% { opacity: 1; } 30% { opacity: 0.35; } 42% { opacity: 1; } 100% { opacity: 1; } }
@keyframes outline-in { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .board-opening .lamp { opacity: 1; animation: none !important; }
  .board-opening .slot .outline path { stroke-dashoffset: 0; animation: none !important; }
  .board-opening .slot .tool { opacity: 1; }
  .board-opening .slot .shadow { opacity: 0.55; }
}

/* The instrument panels keep their dark skin in both themes; yellow reads on it. */
.instrument { --accent: #F2C230; --paint: #F2C230; }
```

- [ ] **Step 10: Replace `src/ui/Shell.tsx`'s returned markup** (keep the imports, the `NAV` array and the consent gate exactly as they are, including its comment).

```tsx
  return (
    <div style={{ minHeight: '100dvh' }}>
      <UpdatePrompt />
      <header className="wrap" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        minHeight: 'calc(var(--pitch) * 2.5)', flexWrap: 'wrap',
      }}>
        <Link to="/" aria-label="EPAS, modules" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minHeight: 44,
        }}>
          <span className="tape" style={{ fontSize: '1.05rem' }}>EPAS</span>
          <span className="label" style={{ fontSize: '0.95rem' }}>Grade 12</span>
        </Link>
        <nav aria-label="Main" style={{ display: 'flex', gap: 'calc(var(--pitch) * 0.15)', flexWrap: 'wrap' }}>
          {NAV.map(n => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <Link key={n.to} to={n.to} aria-current={active ? 'page' : undefined} className="nav-link">
                {n.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="wrap" style={{ paddingBlock: 'calc(var(--pitch) * 0.5) calc(var(--pitch) * 2)' }}>
        {children}
      </main>
    </div>
  )
```

Add to `src/index.css` after `.back`:

```css
.nav-link {
  display: inline-flex; align-items: center; min-height: 44px; padding-inline: calc(var(--pitch) * 0.35);
  font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; line-height: 1;
  letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; color: var(--ink-2);
  text-underline-offset: 6px; text-decoration-thickness: 2px;
}
.nav-link[aria-current="page"] { color: var(--ink); text-decoration-line: underline; text-decoration-color: var(--paint); }
@media (hover: hover) and (pointer: fine) { .nav-link:hover { color: var(--ink); text-decoration-line: underline; } }
```

The aria-label on the brand link must not change what `tests/task-sheet.test.tsx` or any other test finds; run the suite to confirm.

- [ ] **Step 11: Verify.** `npx tsc -b` clean, `npm test` all green, `npm run build` clean. Grep `src` for `Geist Variable` and `--m[1-9]` tint variables used outside `ModuleMap.tsx`; there should be none (ModuleMap is replaced in Task 2).

- [ ] **Step 12: Commit.**

```bash
git add docs/design/reference package.json package-lock.json src/index.css src/ui/board src/ui/Shell.tsx tests/board.test.ts
git commit -m "feat: the Shadow Board foundation: board, tape, plates and fonts"
```

---

### Task 2: The board engine and the module map

**Files:**
- Create: `src/lib/board.ts`, `src/ui/board/ToolBoard.tsx`
- Modify: `tests/board.test.ts`, `src/routes/ModuleMap.tsx`

**Interfaces:**
- Consumes: `Tape`, `PlateLink`, `toolFor` (Task 1); `allModules()`, `loadState()`, `resetAll()`.
- Produces: `interface ToolState { moduleId: string; done: number; total: number; fraction: number; hung: boolean }`; `toolStates(modules: { id: string; outcomes: { id: string }[] }[], progress: Record<string, { completedOutcomes: string[] } | undefined>): ToolState[]`; `nextAction(tools: ToolState[]): { moduleId: string; verb: 'Start' | 'Continue' } | null`; `ToolBoard({ tools: ToolState[] })`.

- [ ] **Step 1: Append failing tests to `tests/board.test.ts`.**

```ts
import { nextAction, toolStates } from '../src/lib/board'

const mods = [
  { id: 'm1', outcomes: [{ id: 'a' }, { id: 'b' }] },
  { id: 'm2', outcomes: [{ id: 'c' }] },
  { id: 'm3', outcomes: [] },
]

describe('toolStates', () => {
  it('counts only outcomes that belong to the module, once each', () => {
    const [m1] = toolStates(mods, { m1: { completedOutcomes: ['a', 'a', 'zzz'] } })
    expect(m1).toEqual({ moduleId: 'm1', done: 1, total: 2, fraction: 0.5, hung: false })
  })

  it('hangs a tool only when every outcome is done', () => {
    const t = toolStates(mods, { m1: { completedOutcomes: ['a', 'b'] }, m2: { completedOutcomes: [] } })
    expect(t[0]?.hung).toBe(true)
    expect(t[1]?.hung).toBe(false)
  })

  // A module with no outcomes has nothing to finish, and must not count as
  // finished, or an unwritten module would hang on every student's board.
  it('never hangs a module with no outcomes', () => {
    expect(toolStates(mods, {})[2]).toEqual({ moduleId: 'm3', done: 0, total: 0, fraction: 0, hung: false })
  })
})

describe('nextAction', () => {
  it('starts the first module for a new student', () => {
    expect(nextAction(toolStates(mods, {}))).toEqual({ moduleId: 'm1', verb: 'Start' })
  })

  it('continues a module that has been started', () => {
    expect(nextAction(toolStates(mods, { m1: { completedOutcomes: ['a'] } }))).toEqual({ moduleId: 'm1', verb: 'Continue' })
  })

  it('moves to the first module not yet hung', () => {
    expect(nextAction(toolStates(mods, { m1: { completedOutcomes: ['a', 'b'] } }))).toEqual({ moduleId: 'm2', verb: 'Start' })
  })

  it('skips modules with no outcomes and returns null when everything is hung', () => {
    const t = toolStates(mods, { m1: { completedOutcomes: ['a', 'b'] }, m2: { completedOutcomes: ['c'] } })
    expect(nextAction(t)).toBeNull()
  })
})
```

- [ ] **Step 2: Run, expect FAIL** (`Cannot find module '../src/lib/board'`). `npx vitest run tests/board.test.ts`

- [ ] **Step 3: Write `src/lib/board.ts`.**

```ts
/**
 * The shadow board: which tools hang, and what the student should do next.
 * Pure and total, like every engine in this folder.
 */
export interface ToolState {
  moduleId: string
  done: number
  total: number
  fraction: number
  hung: boolean
}

export function toolStates(
  modules: { id: string; outcomes: { id: string }[] }[],
  progress: Record<string, { completedOutcomes: string[] } | undefined>,
): ToolState[] {
  return modules.map(m => {
    const own = new Set(m.outcomes.map(o => o.id))
    const completed = new Set((progress[m.id]?.completedOutcomes ?? []).filter(id => own.has(id)))
    const total = own.size
    const done = completed.size
    return { moduleId: m.id, done, total, fraction: total ? done / total : 0, hung: total > 0 && done === total }
  })
}

export function nextAction(tools: ToolState[]): { moduleId: string; verb: 'Start' | 'Continue' } | null {
  const next = tools.find(t => t.total > 0 && !t.hung)
  return next ? { moduleId: next.moduleId, verb: next.done > 0 ? 'Continue' : 'Start' } : null
}
```

- [ ] **Step 4: Run, expect PASS.** Mutation-check: change `hung: total > 0 && done === total` to `hung: done === total`, watch "never hangs a module with no outcomes" fail, restore.

- [ ] **Step 5: Write `src/ui/board/ToolBoard.tsx`.**

```tsx
import { useEffect, useRef, useState } from 'react'
import type { ToolState } from '../../lib/board'
import { toolFor } from './tools'

// Module-level, not storage: the opening plays once per app launch. Coming
// back to the map from a lesson should not replay it.
let played = false

/**
 * The lamp-lit board. Decorative: the rack below it is the navigation, so the
 * board is aria-hidden and holds no focusable element.
 *
 * Opening moment: the lamp flickers on, the painted outlines draw in, then the
 * steel of every started or finished tool drops onto its hook with a spring.
 * Any pointer, key, wheel or touch finishes it at once. Reduced motion shows
 * the finished board.
 */
export function ToolBoard({ tools }: { tools: ToolState[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const skip = useRef(played || typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [phase, setPhase] = useState<'idle' | 'play' | 'done'>(skip.current ? 'done' : 'idle')

  // Runs once. It must not depend on `phase`: setting 'play' would re-run it,
  // and the re-run's cleanup would cancel the spring it just started.
  useEffect(() => {
    if (skip.current) return
    played = true
    const el = ref.current
    const slots = el ? [...el.querySelectorAll<HTMLElement>('.slot')] : []
    let raf = 0
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      for (const s of slots) s.style.removeProperty('--ty')
      setPhase('done')
    }
    const start = requestAnimationFrame(() => setPhase('play'))

    // Critically damped spring, response 0.45s: tools land without bouncing.
    const response = 0.45
    const k = (2 * Math.PI / response) ** 2
    const c = (4 * Math.PI * 1) / response
    const state = slots.map(() => ({ y: -40, v: 0 }))
    const t0 = performance.now() + 900
    let last = 0
    const step = (t: number) => {
      const dt = Math.min(0.032, last ? (t - last) / 1000 : 1 / 60)
      last = t
      let moving = false
      slots.forEach((slot, i) => {
        const s = state[i]
        if (!s) return
        if (t < t0 + i * 70) { moving = true; slot.style.setProperty('--ty', `${s.y}px`); return }
        slot.classList.add('landed')
        s.v += (-k * s.y - c * s.v) * dt
        s.y += s.v * dt
        if (Math.abs(s.y) + Math.abs(s.v) > 0.05) moving = true
        slot.style.setProperty('--ty', `${s.y.toFixed(2)}px`)
      })
      if (moving) raf = requestAnimationFrame(step)
      else finish()
    }
    raf = requestAnimationFrame(step)

    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    for (const e of events) addEventListener(e, finish, { once: true, passive: true })
    return () => {
      cancelAnimationFrame(start)
      cancelAnimationFrame(raf)
      for (const e of events) removeEventListener(e, finish)
    }
  }, [])

  const opening = phase !== 'done'
  return (
    <div ref={ref} aria-hidden className={`board${opening ? ' board-opening' : ''}${phase === 'play' ? ' play' : ''}`}>
      <svg width="0" height="0" style={{ position: 'absolute' }} focusable="false">
        <defs>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6E7A73" />
            <stop offset="0.35" stopColor="#2B332F" />
            <stop offset="1" stopColor="#101412" />
          </linearGradient>
        </defs>
      </svg>
      <div className="lamp" />
      {tools.map((t, i) => {
        const Tool = toolFor(t.moduleId)
        const empty = t.done === 0
        return (
          <div key={t.moduleId} className={`slot${empty ? ' empty' : ''}`}
            style={{ ['--i' as string]: i, ['--fill' as string]: t.hung ? 1 : Math.max(0.12, t.fraction) }}>
            <span className="hook" />
            <Tool weight="fill" className="outline" />
            <Tool weight="fill" className="shadow" color="rgba(0,0,0,0.55)" />
            <Tool weight="fill" className="tool" color="url(#steel)" />
            <span className="num">{t.moduleId.toUpperCase()}</span>
          </div>
        )
      })}
    </div>
  )
}
```

Add to `src/index.css` in the board section, so tools stay hidden until their spring starts:

```css
.board-opening.play .slot.landed .tool { opacity: 1; }
.board-opening.play .slot.landed .shadow { opacity: 0.55; }
```

- [ ] **Step 6: Replace `src/routes/ModuleMap.tsx`.** `startNewParticipant`, the `confirming` state, the shared-machines comment and every string in the "Working as ... Not you?" area are kept verbatim; only their styling changes.

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight } from '@phosphor-icons/react'
import { allModules } from '../content'
import { loadState, resetAll } from '../lib/store'
import { nextAction, toolStates } from '../lib/board'
import { Tape } from '../ui/board/Tape'
import { PlateButton, PlateLink } from '../ui/board/Plate'
import { ToolBoard } from '../ui/board/ToolBoard'
import { toolFor } from '../ui/board/tools'

// Each module's outline on the rack is sized by how many outcomes it teaches,
// on a 12-column row: 3 4 2 / 5 2 2 / 2 2 6 outcomes read as 4 4 4 / 6 3 3 / 3 3 6.
const SPAN: Record<string, number> = { m1: 4, m2: 4, m3: 4, m4: 6, m5: 3, m6: 3, m7: 3, m8: 3, m9: 6 }

export default function ModuleMap() {
  const navigate = useNavigate()
  const state = loadState()
  const modules = allModules()
  const [confirming, setConfirming] = useState(false)
  const tools = toolStates(modules, state.modules)
  const next = nextAction(tools)
  const nextModule = next ? modules.find(m => m.id === next.moduleId) : undefined

  function startNewParticipant() {
    resetAll()
    navigate('/consent', { replace: true })
  }

  return (
    <>
      <div className="map-hero">
        <div>
          <Tape as="h1" size="hero">Every tool has its place.</Tape>
          <p className="map-lede">
            Nine modules, eleven weeks. Finish a module and its tool hangs on your board.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--pitch) * 0.4)', marginTop: 'calc(var(--pitch) * 0.8)' }}>
            {next && nextModule ? (
              <PlateLink to={`/m/${next.moduleId}`} variant="primary">
                {next.verb} module {modules.indexOf(nextModule) + 1} <ArrowRight weight="bold" />
              </PlateLink>
            ) : (
              <PlateLink to="/progress" variant="primary">
                See your progress <ArrowRight weight="bold" />
              </PlateLink>
            )}
            <PlateLink to="/labs">Open the labs</PlateLink>
          </div>
        </div>
        <ToolBoard tools={tools} />
      </div>

      <Tape as="h2" size="section" id="rack-h">Your board</Tape>
      <ul className="rack" aria-labelledby="rack-h" style={{ marginTop: 'calc(var(--pitch) * 0.6)' }}>
        {modules.map((m, i) => {
          const t = tools[i]
          const Tool = toolFor(m.id)
          const here = next?.moduleId === m.id
          return (
            <li key={m.id} className={here ? 'here' : t?.hung ? 'hung' : undefined}
              style={{ ['--span' as string]: SPAN[m.id] ?? 4 }}>
              <Link to={`/m/${m.id}`}>
                <Tool weight={t?.hung ? 'fill' : 'regular'} aria-hidden />
                <span>
                  <span className="label">Module {i + 1}{here ? ` · ${next?.verb === 'Continue' ? 'Continue here' : 'Start here'}` : ''}</span>
                  <span className="t">{m.title}</span>
                  <span className="w">{m.week} · {t?.done ?? 0} of {t?.total ?? 0} outcomes</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/*
        These machines are shared. Without a way to hand the app to the next
        student, their work joined the previous student's participant record,
        they never saw the consent screen, and the two sittings resolved as one
        student retaking a test.
      */}
      <div style={{
        marginTop: 'calc(var(--pitch) * 1.5)', paddingTop: 14,
        borderTop: '2px dashed color-mix(in srgb, var(--paint) 35%, transparent)',
        fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-2)',
      }}>
        {confirming ? (
          <div>
            <p style={{ margin: '0 0 10px', color: 'var(--ink)' }}>
              This clears every answer and result stored on this device and starts a new
              participant. Work that has not been exported cannot be got back.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <PlateButton onClick={startNewParticipant}>Clear and start a new participant</PlateButton>
              <PlateButton onClick={() => setConfirming(false)}>Cancel</PlateButton>
            </div>
          </div>
        ) : (
          <span>
            Working as{' '}
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>
              {state.participant.code}
            </strong>
            {state.participant.name ? ` (${state.participant.name})` : ''}.{' '}
            <button onClick={() => setConfirming(true)} style={{
              background: 'none', border: 0, padding: 0, minHeight: 44, font: 'inherit',
              color: 'var(--ink)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4,
            }}>
              Not you?
            </button>
          </span>
        )}
      </div>
    </>
  )
}
```

Before replacing the file, diff the shared-machines comment and the confirm copy above against the current file; they must match it word for word.

Add to `src/index.css`:

```css
.map-hero {
  display: grid; grid-template-columns: 1fr; gap: calc(var(--pitch) * 1);
  align-items: center; padding-block: calc(var(--pitch) * 0.5) calc(var(--pitch) * 1.5);
}
@media (min-width: 960px) { .map-hero { grid-template-columns: calc(var(--pitch) * 15) 1fr; } }
.map-hero .board { max-width: 520px; width: 100%; justify-self: center; }
.map-lede { max-width: 36ch; margin: calc(var(--pitch) * 0.6) 0 0; font-size: clamp(1.06rem, 1vw + 0.85rem, 1.25rem); line-height: 1.5; }
```

New copy introduced by this task, all checked for em dashes: "Every tool has its place.", "Nine modules, eleven weeks. Finish a module and its tool hangs on your board.", "Start module N", "Continue module N", "See your progress", "Open the labs", "Your board", "Start here", "Continue here", "N of N outcomes". The middle dot appears at most once per line.

- [ ] **Step 7: Browser check.** Start `epas-dev` (`.claude/launch.json`), pass consent, open `/`. Confirm at 390px and 1440px, light and dark: tape headline wraps cleanly, plate reads "Start module 1", board outlines draw in and no tool shows for a new student, rack spans read 4 4 4 / 6 3 3 / 3 3 6 on desktop, no horizontal scroll. Complete one outcome of module 1 (open a lesson, answer its quiz, submit), return: plate reads "Continue module 1", the M1 tool shows part filled. Report what you saw.

- [ ] **Step 8: Verify and commit.** `npx tsc -b`, `npm test`.

```bash
git add src/lib/board.ts src/ui/board/ToolBoard.tsx src/routes/ModuleMap.tsx src/index.css tests/board.test.ts
git commit -m "feat: the module map as a shadow board"
```

---

### Task 3: Reading surfaces: module overview, lessons, blocks, quiz

**Files:**
- Modify: `src/routes/ModuleOverview.tsx`, `src/routes/LessonReader.tsx`, `src/ui/blocks/BlockRenderer.tsx`, `src/ui/Quiz.tsx`

**Interfaces:**
- Consumes: `Tape`, `PlateLink`, `PlateButton`, `toolFor`, classes `.sign`, `.label`, `.back`, `.callout*`, `.rack`.

These screens change structure only as listed. Every string stays.

- [ ] **Step 1: `BlockRenderer.tsx` callouts.** Replace `Callout` with:

```tsx
import { Info, Warning } from '@phosphor-icons/react'

function Callout({ tone, children }: { tone: 'safety' | 'note'; children: ReactNode }) {
  return (
    <div role="note" className={`callout callout--${tone}`}>
      <strong>
        {tone === 'safety' ? <Warning weight="fill" aria-hidden /> : <Info weight="bold" aria-hidden />}
        {tone === 'safety' ? 'Safety' : 'Note'}
      </strong>
      {children}
    </div>
  )
}
```

Change `text` to `{ fontSize: '1.0625rem', lineHeight: 1.65, color: 'var(--ink)', maxWidth: '62ch', margin: '0 0 14px' }`. Table header cells get `className="label"` and lose their inline font styles; the table sits in a `.sign` wrapper (`className="sign"`, `padding: 0`, `overflowX: 'auto'`). Figures: `borderRadius: 6`. `blocks.test.tsx` must still pass unchanged.

- [ ] **Step 2: `ModuleOverview.tsx`.**
  - "Modules" back link: `className="back"` with `<ArrowLeft weight="bold" aria-hidden />` before the text. Same for the "That module does not exist yet." fallback link.
  - `h1`: `<Tape as="h1">{m.title}</Tape>`, preceded by the module's tool icon at 40px in `var(--paint)` inside a flex row with the week as `<p className="label">`.
  - "Not yet reviewed" notice: `className="callout callout--caution"` keeping `role="status"`, `<strong>` first with a `<Warning weight="bold" />` and the text "Not yet reviewed". Caution, not danger: an unreviewed module is not a hazard in itself.
  - "Learning competencies" and "Outcomes": `<Tape as="h2" size="section">`.
  - Competency list stays a `ul`, inside a `.sign`, text `var(--ink)`, 1rem.
  - Pre-test, post-test and task links: `PlateLink` quiet; task plates add `className="plate--wrap"` and keep the title-leads comment and the kind span.
  - Outcome list: `className="rack"` with every `li` at `--span: 12`, each link showing the outcome title in `.t` and, when done, a `<CheckCircle weight="fill" />` in `var(--pass)` with the text "Done" in `.w`. Keep the text "Done".

- [ ] **Step 3: `LessonReader.tsx`.** Back link `className="back"` with `ArrowLeft`. `h1` `<Tape as="h1">`. Each lesson `h2`: `<h2 className="label" style={{ fontSize: '1.25rem', color: 'var(--ink)', margin: '0 0 10px' }}>`. Lesson sections separated by `calc(var(--pitch) * 1.2)`.

- [ ] **Step 4: `Quiz.tsx`.** The section becomes `className="sign"` with `maxWidth: '62ch'`. "Check your understanding" becomes `<Tape as="h2" size="section">`. Option labels: `border: 2px solid transparent`, `borderRadius: 3`, text `var(--ink)` 1rem; the submitted-correct border stays `var(--pass)`; an answered option gets `background: color-mix(in srgb, var(--paint) 8%, transparent)`. Radio and checkbox `accentColor: 'var(--paint)'`. The submit and finish buttons become `PlateButton variant="primary"` (only one is on screen at a time), keeping their `disabled` logic and text. Incorrect feedback colour stays `var(--caution)`, never `--danger`.

- [ ] **Step 5: Verify.** `npx tsc -b`, `npm test`. Browser: open module 1 overview and one lesson with a safety block, light and dark, 390px and 1440px. Confirm the safety callout has stripes and red heading, the note has none, no 3px left borders remain (`grep -rn "borderLeft" src` returns nothing in these four files).

- [ ] **Step 6: Commit.**

```bash
git add src/routes/ModuleOverview.tsx src/routes/LessonReader.tsx src/ui/blocks/BlockRenderer.tsx src/ui/Quiz.tsx
git commit -m "feat: lessons, quizzes and module pages on the board"
```

---

### Task 4: Record surfaces: tests, consent, survey, progress, task sheets, teacher, update bar

**Files:**
- Modify: `src/routes/Assessment.tsx`, `Consent.tsx`, `Evaluate.tsx`, `Progress.tsx`, `TaskSheet.tsx`, `Teacher.tsx`, `src/ui/UpdatePrompt.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `Tape`, `PlateLink`, `PlateButton`, classes from Task 1.

The mapping, applied to every file in this task:

| Now | Becomes |
|---|---|
| `h1` with inline 22px style | `<Tape as="h1">` with the same children |
| `h2` with inline 13 to 15px style | `<Tape as="h2" size="section">` with the same children, except inside a table or form row where it becomes `<h2 className="label">` |
| Inline `label` style object (11px uppercase) | `className="label"`, delete the style object when unused |
| A bordered white panel (`background: var(--surface)`, `border: 1px solid var(--line)`, radius 14) | `className="sign"` |
| The one button that completes the screen's job (submit a test, agree to consent, save survey, download results, merge files, unlock with PIN, reload in the update bar) | `PlateButton variant="primary"` |
| Any other button or button-like link | `PlateButton` or `PlateLink` quiet |
| "Back to ..." text link | `className="back"` with `<ArrowLeft weight="bold" aria-hidden />` |
| `accentColor: 'var(--accent)'` | `accentColor: 'var(--paint)'` |
| `borderLeft: '3px solid ...'` callout | `className="callout callout--note"` (or `--caution` where the colour was caution, `--safety` only if it was danger) |
| Radius 10 or 14 | 3 for controls, 6 for panels |
| Mono participant codes, percentages, counts | Keep `var(--font-mono)` |

Rules on top of the table:
- Exactly one primary plate visible at a time per screen. Where a screen currently shows two peers (for example download CSV and download JSON on Progress), the CSV is primary and JSON quiet, because the CSV is what the teacher asks for.
- `Assessment.tsx` must not gain anything that shows an answer or a rationale after a pre-test. Do not touch its logic or its explanatory copy.
- `UpdatePrompt.tsx` keeps its `role="status"` and the exact button name the test clicks. Its bar becomes a `.sign` pinned to the bottom with `position: sticky`, never red.
- `TaskSheet.tsx` rubric ticks keep their checkboxes and names; the notes `textarea` gets `border: 2px solid var(--line)`, `borderRadius: 3`, `background: var(--surface)`, `font: inherit`.
- `App.tsx` `NotBuiltYet`: `<Tape as="h1">Not built yet</Tape>` and the paragraph at 1rem `var(--ink-2)`.
- `Teacher.tsx` tables: header cells `className="label"`, the table wrapped in a `.sign` with `padding: 0` and `overflowX: 'auto'`.

- [ ] **Step 1:** Apply the mapping to `Consent.tsx` and `App.tsx`. Run `npm test`.
- [ ] **Step 2:** Apply it to `Assessment.tsx` and `Evaluate.tsx`. Run `npm test`.
- [ ] **Step 3:** Apply it to `Progress.tsx`, `TaskSheet.tsx`, `UpdatePrompt.tsx`. Run `npm test` (the task-sheet and update-prompt suites are the ones at risk).
- [ ] **Step 4:** Apply it to `Teacher.tsx`. Run `npx tsc -b` and `npm test`.
- [ ] **Step 5: Browser check.** Consent (new participant), module 1 pre-test (start it, do not submit), `/progress`, `/evaluate`, one task sheet, `/teacher` (PIN screen), at 390px and 1440px, light and dark. Confirm one yellow plate per screen and no horizontal scroll. Report what you saw.
- [ ] **Step 6: Commit.**

```bash
git add src/routes/Assessment.tsx src/routes/Consent.tsx src/routes/Evaluate.tsx src/routes/Progress.tsx src/routes/TaskSheet.tsx src/routes/Teacher.tsx src/ui/UpdatePrompt.tsx src/App.tsx
git commit -m "feat: tests, consent, progress, tasks and teacher tools on the board"
```

---

### Task 5: Labs gallery, activities and instruments

**Files:**
- Modify: `src/routes/Labs.tsx`, `src/interactives/MatchActivity.tsx`, `HotspotActivity.tsx`, `SequenceActivity.tsx`, `MultimeterTrainer.tsx`, `PowerSupplySim.tsx`

**Interfaces:**
- Consumes: Task 1 primitives. `LABS` entries (`id`, `title`, `blurb`, `simId`) are read, never changed.

- [ ] **Step 1: `Labs.tsx` gallery.** `h1` `<Tape as="h1">Labs</Tape>`, intro paragraph at 1.0625rem `var(--ink)`. Group cards into two racks without changing `LABS` order inside a group: fault-finding labs (`lab.simId === 'troubleshoot'`) under `<Tape as="h2" size="section">Find the fault</Tape>`, everything else under `<Tape as="h2" size="section">Practice</Tape>`. Each card is a `.rack` link (`--span: 4`) showing a Phosphor icon (`Wrench` for troubleshoot, `Gauge` for `multimeter`, `Lightning` for `power-supply`, `ListNumbers` for sequence, `ArrowsLeftRight` for match, `Crosshair` for hotspot; any other simId `Toolbox`), the title in `.t` and the blurb in `.w`. Check the simIds against `src/interactives/registry.ts` and use the real ones. Do not write any new text on a card: `tests/registry.test.tsx` guards that no card names its own answers, and the headings above are the only new copy.

- [ ] **Step 2: `LabFullScreen`.** Back link `className="back"` with `ArrowLeft`, title `<Tape as="h1">`, `maxWidth` 62ch unless `lab.simId === 'troubleshoot'`, where it is `none` (Service Mode sets its own width in Task 7).

- [ ] **Step 3: Activities.** For `MatchActivity`, `HotspotActivity`, `SequenceActivity`: the outer panel becomes `.sign` (radius 6, no 1px border); their `h3` title becomes `<h3 className="label" style={{ fontSize: '1.2rem', color: 'var(--ink)' }}>`; the check or submit button becomes `PlateButton variant="primary"` keeping its text and disabled logic; other buttons quiet plates or `.press` elements with `border: 2px solid var(--line)` and radius 3; a selected choice shows `border-color: var(--paint)`; correct `var(--pass)`, incorrect `var(--caution)`. Pool and option order stays array order (`tests/activities.test.ts`).

- [ ] **Step 4: Instruments.** `MultimeterTrainer` and `PowerSupplySim`: the outer panel becomes `.sign` with `padding: 0` and `overflow: hidden`, its header title `className="label"` at 1.2rem `var(--ink)`. Inside `.instrument`, keep the dark skin and every colour value as it is, except the active control colour `#F2A93B` becomes `#F2C230` so the one yellow is the board's yellow. Bench buttons below the instrument follow the activity rules in Step 3.

- [ ] **Step 5: Verify.** `npx tsc -b`, `npm test`. Browser: `/labs`, one match, one hotspot, one sequence, the multimeter and the power supply, at 390px and 1440px. Confirm each still completes. Report what you saw.

- [ ] **Step 6: Commit.**

```bash
git add src/routes/Labs.tsx src/interactives/MatchActivity.tsx src/interactives/HotspotActivity.tsx src/interactives/SequenceActivity.tsx src/interactives/MultimeterTrainer.tsx src/interactives/PowerSupplySim.tsx
git commit -m "feat: labs, activities and instruments on the board"
```

---

### Task 6: Service Mode sprites and the repair shop scene

**Files:**
- Create: `src/interactives/service/sprites.ts`, `src/interactives/service/PixelScene.tsx`, `tests/service.test.ts`
- Modify: `src/index.css` (Service Mode scope)

**Interfaces:**
- Consumes: `SCENARIOS` from `src/content/scenarios`.
- Produces: `PALETTE: Record<string, string>`; `interface Sprite { rows: string[]; palette: Record<string, string> }`; `SPRITES: Record<string, Sprite>` keyed by scenario id; `TOOLBOX: Sprite`; `spriteFor(scenarioId: string): Sprite`; `PixelScene({ scenarioId: string, appliance: string })`.

- [ ] **Step 1: Write the failing guard tests.** `tests/service.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { SCENARIOS } from '../src/content/scenarios'
import { SPRITES, TOOLBOX, spriteFor } from '../src/interactives/service/sprites'

describe('service mode sprites', () => {
  it('draws every scenario appliance', () => {
    for (const id of Object.keys(SCENARIOS)) expect(SPRITES[id], id).toBeDefined()
  })

  it('keeps every sprite rectangular, at most 20 by 22, with every colour defined', () => {
    for (const [id, s] of Object.entries(SPRITES)) {
      const width = s.rows[0]?.length ?? 0
      expect(width, id).toBeGreaterThan(0)
      expect(width, id).toBeLessThanOrEqual(20)
      expect(s.rows.length, id).toBeLessThanOrEqual(22)
      for (const row of s.rows) {
        expect(row.length, `${id}: ${row}`).toBe(width)
        for (const ch of row) if (ch !== '.') expect(s.palette[ch], `${id}: ${ch}`).toMatch(/^#[0-9A-F]{6}$/)
      }
    }
  })

  // A pixel scene is a surface the student reads before answering. The
  // appliance is drawn healthy: no sprite may use the danger red, which is
  // the one colour that would point at a part.
  it('never paints an appliance in the safety red', () => {
    for (const [id, s] of Object.entries(SPRITES)) {
      expect(Object.values(s.palette).map(c => c.toUpperCase()), id).not.toContain('#D8352A')
    }
  })

  // The picture is chosen by scenario id alone. If either file ever reads the
  // fault list or the actual fault, the scene can start carrying the answer.
  it('draws the scene without reading any fault', () => {
    for (const file of ['src/interactives/service/sprites.ts', 'src/interactives/service/PixelScene.tsx']) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toMatch(/actualFault|\.faults\b|testPoints|readingAt/)
    }
  })

  it('falls back to the toolbox for an unknown scenario', () => {
    expect(spriteFor('nope')).toBe(TOOLBOX)
  })
})
```

- [ ] **Step 2: Run, expect FAIL.** `npx vitest run tests/service.test.ts`

- [ ] **Step 3: Write `src/interactives/service/sprites.ts`.** The fan is given in full. Draw the other seven the same way, recognisable at 16 to 20 pixels wide, healthy, in the scene palette only (`k` night outline `#10132E`, `g` grey `#8B93A8`, `w` white `#F1EFE6`, `t` teal `#1F6F74`, `a` amber `#F2B138`, `o` sunset `#E8622C`, `d` dusk `#232A63`, `p` phosphor `#5BD26B`): a flat iron (soleplate and handle, side view), a rechargeable LED lamp (handle, white panel), a CCTV camera (bullet body on a wall bracket), a fire alarm zone (a round bell on a small panel with a phosphor zone lamp), an audio amplifier (box with two knobs and a phosphor power lamp), a flat screen television (thin panel on a stand, dusk screen), a motor control board (a teal board with a relay, a terminal strip and components). No sprite may show a burnt part, smoke, a spark, a broken wire or anything that marks where a fault is.

```ts
export const PALETTE = {
  night: '#10132E', deep: '#0A0C1E', dusk: '#232A63', teal: '#1F6F74', amber: '#F2B138',
  sunset: '#E8622C', white: '#F1EFE6', grey: '#8B93A8', phosphor: '#5BD26B', danger: '#D8352A',
} as const

export interface Sprite {
  rows: string[]
  palette: Record<string, string>
}

const BASE: Record<string, string> = {
  k: PALETTE.night, g: PALETTE.grey, w: PALETTE.white, t: PALETTE.teal,
  a: PALETTE.amber, o: PALETTE.sunset, d: PALETTE.dusk, p: PALETTE.phosphor,
}

/** Drawn when a scenario has no sprite of its own. */
export const TOOLBOX: Sprite = {
  palette: BASE,
  rows: [
    '.....kkkkkk.....',
    '.....k....k.....',
    'kkkkkkkkkkkkkkkk',
    'kooooooooooooook',
    'kooooooooooooook',
    'kkkkkkkggkkkkkkk',
    'kooooooggooooook',
    'kooooooooooooook',
    'kooooooooooooook',
    'kkkkkkkkkkkkkkkk',
  ],
}

/** Keyed by scenario id. Drawn healthy: the picture never shows the fault. */
export const SPRITES: Record<string, Sprite> = {
  fan: {
    palette: BASE,
    rows: [
      '....kkkkkkkk....', '..kkggggggggkk..', '.kgg.g.gg.g.ggk.', '.kg.g.gkkg.g.gk.',
      'kgg..gkggkg..ggk', 'kg.ggkgwwgkgg.gk', 'kg.ggkgwwgkgg.gk', 'kgg..gkggkg..ggk',
      '.kg.g.gkkg.g.gk.', '.kgg.g.gg.g.ggk.', '..kkggggggggkk..', '....kkkkkkkk....',
      '.......kk.......', '.......kg.......', '.......kg.......', '.......kg.......',
      '.......kg.......', '.....kkkkkk.....', '...kggggggggk...', '...kkkkkkkkkk...',
    ],
  },
  // 'flat-iron', lamp, cctv, 'fas-zone', amp, tv, 'motor-control': drawn per Step 3.
}

export function spriteFor(scenarioId: string): Sprite {
  return SPRITES[scenarioId] ?? TOOLBOX
}
```

Replace the comment line inside `SPRITES` with the seven real entries, keyed exactly as `src/content/scenarios/index.ts` keys them.

- [ ] **Step 4: Run, expect PASS.** Mutation-check two guards: add `r: '#D8352A'` to the fan palette and watch "never paints an appliance in the safety red" fail; after Step 5, add a line `// actualFault` to `PixelScene.tsx` and watch "draws the scene without reading any fault" fail. Restore both.

- [ ] **Step 5: Write `src/interactives/service/PixelScene.tsx`.** Port the scene from `docs/design/reference/service-mode.html` (the `<svg class="scene">` block and the script that fills `#stars`, `#city`, `#shop`) into React: a `useMemo` that returns arrays of `{ x, y, w, h, fill }` for stars, city and shop, built with the same seeded generator (`seed = 7`), rendered as `<rect>`s. Differences from the reference:
  - `viewBox="0 0 160 90"`, `preserveAspectRatio="xMaxYMid slice"`, `shapeRendering="crispEdges"`, `role="img"`, `aria-label={`${appliance} on the repair bench`}`. The label names the appliance only.
  - The shop window shows `spriteFor(scenarioId)` instead of the fan and television, centred in the left pane (x 95 to 111) if the sprite is 16 wide or less, or across both panes with the mullion omitted if wider.
  - Pattern ids are prefixed with a `useId()` value so two scenes on one page cannot collide.
  - The sign reads `REPAIR` in the 3x5 glyphs from the reference.
  - The moon is the crescent sprite at x 84, y 4.
  - Wrap the output in `useMemo` on `scenarioId`; the scene never re-renders during the exercise.

- [ ] **Step 6: Add the Service Mode scope to `src/index.css`.**

```css
/* ---------- Service Mode: the fault-finding labs only ---------- */
.service {
  --night: #10132E; --deep: #0A0C1E; --dusk: #232A63; --teal: #1F6F74; --amber: #F2B138;
  --sunset: #E8622C; --white: #F1EFE6; --grey: #8B93A8; --phosphor: #5BD26B; --sv-danger: #D8352A;
  --paint: #F2B138; --accent: #F2B138;
  color: var(--white); background: var(--deep);
  font-family: var(--font-pixel); font-size: 1.125rem; line-height: 1.7;
  padding: calc(var(--pitch) * 0.5); border-radius: 3px;
}
.service ::selection { background: var(--amber); color: var(--night); }
.service :focus-visible { outline: 3px solid var(--amber); outline-offset: 2px; border-radius: 0; }
.service .scene { display: block; width: 100%; aspect-ratio: 4 / 3; image-rendering: pixelated; box-shadow: 0 0 0 3px var(--deep), 0 0 0 6px var(--white); }
@media (min-width: 900px) { .service .scene { aspect-ratio: 16 / 9; } }
.service .win {
  background: var(--night);
  box-shadow: 0 0 0 3px var(--deep), inset 0 0 0 3px var(--white), inset 0 0 0 6px var(--dusk);
  padding: 20px 22px;
}
.service .win--danger { box-shadow: 0 0 0 3px var(--deep), inset 0 0 0 3px var(--sv-danger), inset 0 0 0 6px var(--night); }
.service .win-title { display: inline-block; margin: 0 0 10px; padding: 0 10px; background: var(--teal); color: var(--white); font-size: 1rem; font-weight: 400; line-height: 1.6; }
.service .win--danger .win-title { background: var(--sv-danger); }
.service .menu { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.service .menu button {
  position: relative; width: 100%; min-height: 48px; padding: 8px 12px 8px 34px;
  border: 0; background: transparent; color: var(--white); text-align: left; cursor: pointer;
  font: inherit; line-height: 1.5;
}
.service .menu button::before {
  content: ""; position: absolute; left: 10px; top: 50%; width: 12px; height: 14px; margin-top: -7px;
  background: currentColor; clip-path: polygon(0 0, 100% 50%, 0 100%); opacity: 0;
}
.service .menu button:focus-visible::before, .service .menu button[aria-current="true"]::before { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .service .menu button:not([disabled]):not([aria-disabled="true"]):hover { color: var(--amber); }
  .service .menu button:not([disabled]):not([aria-disabled="true"]):hover::before { opacity: 1; }
}
.service .menu button:active { transform: translateY(2px); }
.service .menu button[disabled], .service .menu button[aria-disabled="true"] { color: var(--grey); cursor: default; transform: none; }
.service .menu .used { color: var(--phosphor); }
.service .reading { margin: 2px 0 8px 34px; color: var(--phosphor); font-size: 1.05rem; }
.service .check { display: flex; gap: 12px; align-items: flex-start; min-height: 44px; cursor: pointer; }
.service .check input { width: 22px; height: 22px; margin-top: 4px; accent-color: var(--amber); flex: none; }
.service .cursor { display: inline-block; width: 0.55em; height: 0.2em; margin-left: 4px; background: var(--amber); animation: sv-blink 1s steps(1) infinite; }
@keyframes sv-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .service .cursor { animation: none; } }
```

- [ ] **Step 7: Verify and commit.** `npx tsc -b`, `npm test`.

```bash
git add src/interactives/service tests/service.test.ts src/index.css
git commit -m "feat: Service Mode sprites and the repair shop scene"
```

---

### Task 7: The troubleshooter in Service Mode

**Files:**
- Modify: `src/interactives/SystemTroubleshooter.tsx`
- Test: `tests/registry.test.tsx` (must pass unchanged)

**Interfaces:**
- Consumes: `PixelScene`, `.service` classes (Task 6). `readingAt`, `scoreDiagnosis`, `recordSim`, `SCENARIOS` exactly as today.

- [ ] **Step 1: Keep everything above the `return` byte for byte** (state, `safe`, `canAccuse`, `runTest`, `accuse`, the not-available branch and its comment). Only the returned JSX changes, plus the new typed-complaint hook below and new imports.

- [ ] **Step 2: Add the typed complaint** above the `if (!scenario)` guard (hooks must run unconditionally):

```tsx
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
```

`useEffect` joins the `react` import. jsdom has no `matchMedia` by default; the `typeof` check keeps tests working, and a test render simply starts typing, which no test reads.

- [ ] **Step 3: Replace the returned JSX.**

```tsx
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
```

Every string, the button accessible names (`Supply cord.` prefix, exact fault labels), `role="status"`, `aria-disabled` and `disabled` are as they were. Incorrect uses amber, never red. The old `label` style constant is now unused: delete it.

Add to `src/index.css` in the Service Mode section:

```css
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.service-stage { position: relative; }
.service-talk { margin-top: 18px; }
@media (min-width: 900px) { .service-talk { position: absolute; left: 24px; right: 24px; bottom: 24px; margin: 0; max-width: 62%; } }
.service-grid { display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 18px; }
@media (min-width: 900px) { .service-grid { grid-template-columns: 1fr 1fr; } .service-grid > .win--danger { grid-column: 1 / -1; } }
```

- [ ] **Step 4: Run** `npx vitest run tests/registry.test.tsx`, then `npm test`. All green with no test edits. If a test fails, the markup changed a name or a role: fix the markup, never the test.

- [ ] **Step 5: Browser check.** Open `/labs`, then each of the eight fault labs at 390px and 1440px. Confirm: the right appliance is in the window; the complaint types and any key finishes it; tests are inert until every safety box is ticked; readings appear in green; naming a fault needs one test; a wrong answer shows amber, never red; the page never scrolls sideways. Also open one lesson that embeds a troubleshooter (grep `simId: 'troubleshoot'` in `src/content/m*.ts`) and confirm it renders inside the lesson column. Report what you saw.

- [ ] **Step 6: Commit.**

```bash
git add src/interactives/SystemTroubleshooter.tsx src/index.css
git commit -m "feat: the fault-finding labs in Service Mode"
```

---

### Task 8: Brand colours, app icon and the docs

**Files:**
- Modify: `src/pwa/manifest.ts`, `tests/manifest.test.ts`, `index.html`, `scripts/make-icons.mjs`, the icons it writes, `CLAUDE.md`, `docs/superpowers/plans/STATUS.md`, `docs/superpowers/plans/CARRY-FORWARD.md`

- [ ] **Step 1: Update the manifest test first.** In `tests/manifest.test.ts` change the expected `theme_color` to `'#26302B'` and `background_color` to `'#E3E8E4'`. Run it, expect FAIL.

- [ ] **Step 2: Update `src/pwa/manifest.ts`** to those two values. Run, expect PASS.

- [ ] **Step 3: `index.html` theme colours:** light `#E3E8E4`, dark `#24302A`.

- [ ] **Step 4: Icons.** In `scripts/make-icons.mjs`, change the tile colour from the teal `#0E6E63` to the plate yellow `#F2C230` and the glyph colour to `#141816`; update the comments that cite the old accent so they name the Shadow Board plate, and the Android `ic_launcher_background` string to `#F2C230`. Run `npm run icons`, then `npx vitest run tests/icons.test.ts`. If the icon test pins colours, update its expectations to the new values in the same way as Step 1 (test first, watch it fail against the old icons, then regenerate).

- [ ] **Step 5: `CLAUDE.md`.** In "Reference documents", replace the `docs/DESIGN.md` line's "the nine module tints" with "the Shadow Board tokens, the Service Mode scope for the fault-finding labs". Add under "Authoring rules", after the red rule: "**A picture is a surface.** The Service Mode pixel scene draws the appliance healthy and is chosen by scenario id alone; `tests/service.test.ts` guards both."

- [ ] **Step 6: `STATUS.md` and `CARRY-FORWARD.md`.** STATUS: add a row "Visual design | Shadow Board across the app, Service Mode on the eight fault labs (plan 10)" and update the test count. CARRY-FORWARD: add a plan 10 section recording that the `tint` field on `Module` is now unused by the UI and kept only because content is frozen by this plan.

- [ ] **Step 7: Verify.** `npx tsc -b`, `npm test`, `npm run verify:offline` (the new fonts must all be precached), `npm run build:file` (the single file must still build).

- [ ] **Step 8: Commit.**

```bash
git add src/pwa/manifest.ts tests/manifest.test.ts index.html scripts/make-icons.mjs public android CLAUDE.md docs/superpowers/plans/STATUS.md docs/superpowers/plans/CARRY-FORWARD.md tests/icons.test.ts
git commit -m "chore: Shadow Board brand colours, icon and docs"
```

---

## After the tasks (controller, not a subagent task)

1. One batched browser round across the module map, a module, a lesson, a test, labs, a Service Mode lab, progress and consent, at 390px and 1440px, light and dark. Fix, confirm once more, stop.
2. Run `impeccable detect --json` over the changed files once.
3. Spawn `impeccable-finish-reviewer` with the request, the direction contract path, the screenshots, the detector output and the craft-floor reference. Act on its disposition.
4. Spawn `impeccable-documenter` to rewrite `docs/DESIGN.md` from the built app.
5. Final code review of the whole branch, then merge locally.

## Self-review

- **Contract coverage.** THESIS and FIRST VIEWPORT: Task 2. OWN-WORLD tokens, tape, plates, fonts: Task 1, applied in 3 to 5. Service Mode: Tasks 6 and 7. STORY ("watches tools hang"): `board.ts` fill and hung states in Task 2. FINISH: the controller section.
- **Invariants.** Logic files outside `board.ts` untouched; the four UI suites run unchanged in every task; no new card copy on Labs beyond two group headings; pixel scene guarded by `tests/service.test.ts`.
- **Names.** `Tape`, `PlateLink`, `PlateButton`, `toolFor`, `MODULE_TOOLS`, `toolStates`, `nextAction`, `ToolState`, `ToolBoard`, `SPRITES`, `spriteFor`, `PixelScene` are used with the same signatures in every task that consumes them.
