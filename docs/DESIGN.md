# DESIGN.md

Visual authority for the EPAS Interactive Learning App. Records the world as it shipped on branch `feat/shadow-board`, superseding the 2026-09-06 teal-and-pastel record in full.

**Mode:** Operate. The visitor completes a task on a phone in a workshop, often with no signal. Scanability and the accessibility floor outrank expression. The one exception is the module map's opening drop, the app's single authored Persuade moment.

**World:** Shadow Board. The app is a technician's pegboard: nine modules are nine tools with painted outlines, and finishing a module hangs the tool on its hook. The eight fault-diagnosis labs switch to a scoped second world, Service Mode: a sixteen-colour pixel repair shop.

---

## 1. Colour

### Ground and ink

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#E3E8E4` | `#24302A` | Page ground, perforated pegboard |
| `--surface` | `#EEF2EF` | `#2C3A33` | Cards, panels, plates behind content |
| `--hole` | `#CBD2CD` | `#1B231F` | The pegboard's own holes, painted into `body`'s background |
| `--ink` | `#18201C` | `#E6EBE7` | Primary text |
| `--ink-2` | `#3F4A44` | `#B3BDB7` | Secondary text |
| `--ink-3` | `#56615B` | `#97A39C` | Tertiary text, labels |
| `--line` | `#C3CBC6` | `#3A4A42` | Hairlines, borders |

No pure black, no pure white anywhere in the base palette. The page ground is not flat: `body` paints one radial-gradient dot per `--pitch` cell, so the board texture is structural, not a background image.

### Paint, accent and chrome

The board has exactly one painted colour, and which colour that is flips with the theme:

- **Light mode:** `--paint` / `--accent` = `#26302B`, a near-black paint. `--chrome` (structural furniture: rack borders, icons, nav underline, focus ring, links, checked controls) equals `--paint` here, so light mode reads as one tone.
- **Dark mode:** `--paint` / `--accent` = `#F2C230`, work-lamp yellow. `--chrome` becomes `#C9D6CC`, a chalk-on-steel grey distinct from the paint, so the yellow plate stays the one yellow object on a dark screen (~9:1 on `#24302A`).

`--on-accent` (`#F2F3EE` light / `#141816` dark) is the text colour that sits on a filled accent surface.

**The yellow plate** (`--plate: #F2C230`, `--plate-ink: #141816`, both fixed regardless of theme) is the one primary action per screen: a single painted-steel button (`.plate--primary`) with two rivets, a soft gradient face and a resting drop shadow. A screen has at most one.

### Semantic status

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--danger` | `#B3372A` | `#EF7A68` | **Safety hazards only** |
| `--pass` | `#186A3F` | `#6FD49B` | Correct, within tolerance, passed |
| `--caution` | `#8A500A` | `#E8B25A` | Incorrect answer, out of tolerance, warning |

**Red is reserved for safety hazards.** In an app about live mains voltage, red cannot also mean "wrong answer." Incorrect answers and quiz feedback use `--caution` plus written text, never colour alone (`desktop-quiz-submitted.png` confirms: wrong answers get an amber "Not quite." line, not a red mark).

### Module tints, retired

Nine `--m1`..`--m9` washes still exist as tokens but are load-bearing for exactly two things: `src/content/activities/flat-iron-parts.ts` (M4) and `src/content/activities/tv-boards.ts` (M9), frozen lab diagrams that fill component parts with them. No route, card or tile reads a module tint for identity. **Module identity is carried by a Phosphor icon (the tool) and the tape-heading title, not by colour.** Do not reintroduce per-module colour coding outside those two frozen diagrams; the shipped system deliberately replaced pastel-tile identity with the tool metaphor.

### The lamp

`--lamp` (`rgba(255,244,214,0.55)` light / `rgba(255,226,150,0.20)` dark) and `--shade` (a near-black wash used for drop shadows, tinted per theme) are the only alpha tokens. `--lamp` lights the tool board from a fixed `--lx`/`--ly` point with two stacked radial gradients; `--shade` is the drop-shadow tint for plates, signs and callouts, never pure black.

---

## 2. Type

Four families, each doing one job. No CDN; all self-hosted via `@fontsource`.

| Role | Family | Token | Notes |
|---|---|---|---|
| Body text | Atkinson Hyperlegible Next Variable | `--font-sans` | Default `body` font, 17px (`1.0625rem`), 1.6 leading. Chosen for legibility on low-end screens, not for character. |
| Headings, labels, nav, plates | Barlow Condensed (600/700) | `--font-display` | Every tape heading, `.label`, `.back`, `.nav-link`, `.plate`, `.callout` lede and `.rack .t`/`.w` module titles. Bold, condensed, uppercase, letter-spaced 0.06-0.09em. This is the voice of the board's own signage, not body prose. |
| Measured and technical readings | Geist Mono Variable | `--font-mono` | Declared as `--font-mono`; used inside the multimeter trainer's digital readout and other simulation numerics. |
| Service Mode | DotGothic16 | `--font-pixel` | Only inside `.service`. Pixel-shop dialogue, menus, readings. Never leaks outside a fault-diagnosis lab. |

### The tape heading

Headings are not styled `<h1>`/`<h2>`/`<h3>` text; they are a real heading element wrapping a `<span class="tape">`, an embossed label-tape graphic (dark ground, repeating fine ribbing, inset highlight/shadow text-shadow, `box-decoration-break: clone` so a heading that wraps still looks like continuous tape line by line).

| Size | Class | clamp | Leading | Use |
|---|---|---|---|---|
| Hero | `tape-heading--hero` | `2.1rem` to `4.2rem` | 1.45 | Module-map headline only |
| Page | `tape-heading--page` | `1.45rem` to `2.2rem`, max 32ch | 1.5 | Route and lesson titles |
| Section | `tape-heading--section` | `1.1rem` to `1.35rem` | 1.5 | In-lesson subheads |

### Everything else

- `.label`: 0.95rem, 700, uppercase, 0.08em tracking, `--ink-2`. Used for standalone captions such as rail sidebars.
- `.back` / `.nav-link`: Barlow Condensed 600, uppercase, 44px min-height (touch target), underline-on-current rather than a filled pill.
- Body copy stays in Atkinson Hyperlegible Next at the base size; lesson prose is not artificially widened or narrowed beyond its container.

Restrained scale: hierarchy comes from the tape device and weight, not from a long size ramp.

---

## 3. Shape, elevation and the pegboard ground

**Radius:** `--radius-card: 6px` (cards, signs, callouts, rack tiles), `--radius-control: 3px` (plates, service window borders). Pills are not part of this system; nothing in the shipped build uses a full-round control.

**The ground is the grid.** `--pitch` (24px, 32px at 768px, 36px at 1200px) is both the hole spacing painted into `body`'s background and the spacing unit every board component multiplies (`.wrap`, `.rack`, `.board`, `.sign` padding). Changing `--pitch` changes the whole rhythm at once.

**Elevation is a cast shadow, not a blur.** `.sign` and `.callout` carry a flat, hard-offset shadow (`4px 4px 0 var(--shade)`) with a 2px solid `--line` border, reading as a signboard screwed to the board rather than a floating card. `.plate--primary` carries a small resting shadow (`0 3px 0`, plus a soft `--shade` glow) that grows on hover. This hard-offset device belongs to the pegboard/sign-painting world on purpose; it is not a neobrutalism import and is not banned here.

**Tool slots** (`.slot`) are the board's own visual unit: an aspect-ratio-1 cell holding a painted outline (`stroke: var(--paint)`), a soft blurred cast shadow, and a steel-gradient fill (SVG `linearGradient#steel`) clipped from the bottom up by `--fill` to show partial module progress. An unstarted, non-next module shows outline only (`.empty`); the single next module to work on additionally shows a faint (`opacity: 0.32`) preview of its own tool (`.ghost`) so progress has a visible payoff before any module is finished.

---

## 4. Component vocabulary

Real class names that exist in `src/index.css` and are used by more than one screen. A value or class used once is not listed here.

| Class | What it is |
|---|---|
| `.wrap` | Page content width clamp, `min(100% - pitch*2, pitch*34)`, centred |
| `.tape` / `.tape-heading[--hero\|--page\|--section]` | The label-tape heading device, see §2 |
| `.plate[--primary\|--quiet]` | Painted-steel button/link. Primary is the one yellow plate per screen; quiet is an outlined ghost button. `.plate--wrap` lets a long label (task titles) wrap instead of overflow |
| `.sign` | A bordered, hard-shadowed panel: the base "mounted signboard" surface |
| `.callout[--note\|--caution\|--safety]` | A `.sign`-family box with a bold lede line. `--safety` adds a diagonal hazard-stripe wash and turns the lede `--danger`; reserved for actual safety content |
| `.label` | Small uppercase caption text |
| `.back` | The "&larr; back to X" link, 44px tall |
| `.nav-link` | Top nav items, underline-on-`aria-current` |
| `.rack` | The module list, one column on phones, a 12-col grid at 768px (each `<li>` spans `--span`). `.rack .here` and `.rack .hung` mark the current and finished modules with a solid border |
| `.board` / `.lamp` / `.slot` | The 3x3 tool board and its lamp glow, see §3 |
| `.press`, `.tile` | Generic pressable affordance: `scale(0.98)` on `:active`, nothing else |
| `.lesson-layout` / `.lesson-main` / `.lesson-rail` | Two-column lesson reader above 1100px; the rail (a large decorative module icon, sticky) is hidden below that width rather than reflowed |
| `.instrument` | Scope override, see §5 |
| `.service` and its children | Scope override, see §5 |

---

## 5. The two scoped theme breaks

### `.instrument`

`.instrument { --accent: #F2C230; --paint: #F2C230; }`. A one-line override so any simulation panel wrapped in it always paints its accent and paint tokens work-lamp yellow, in both light and dark mode, rather than following light mode's near-black paint. It exists so a meter or trainer's active control always reads as "the highlighted one," and is a token override only, not a separate palette (it inherits `--surface`, `--ink`, etc. from the ambient theme).

### `.service`

Service Mode (the eight fault-diagnosis labs only) is a full palette and font swap: a sixteen-colour pixel-shop scheme (`--night`, `--deep`, `--dusk`, `--teal`, `--amber`, `--sunset`, `--white`, `--grey`, `--phosphor`, `--sv-danger`), `--font-pixel` (DotGothic16) at 1.125rem/1.7, and its own paint/accent (`--amber`). It renders a `.scene` (4:3, 16:9 from 900px, `image-rendering: pixelated`) framed by a thick double-rule border, `.win` dialogue windows with a title bar, a `.menu` of investigative actions with a phosphor-green `.used` state and a chevron cursor on focus/hover, `.reading` output lines, and `.check` safety checkboxes (22px, 44px hit target). `.win--danger` swaps the border and title to `--sv-danger` for a hazard-framed window. This is the app's one full theme break and it stays inside the lab panel: it never leaks into lesson, quiz or navigation chrome.

---

## 6. Motion

Rationed and tied to how often a student sees it.

| Element | Treatment |
|---|---|
| Any pressable control (`.press`, `.tile`, `.plate`, rack tiles) | `scale(0.98)` on `:active`, 140ms `--ease-out`. `.plate` also drops `translateY(1px)`. Nothing else. |
| Page navigation | No transition. Instant. |
| Module map opening (first launch only) | The one authored moment: the lamp fades up (520ms), painted outlines draw in stroke-by-stroke per slot (700ms, staggered 70ms), then every started/finished tool's steel drops onto its hook on a critically-damped spring (response 0.45s, no bounce). Runs once per app launch (`played` module flag, not persisted), and any pointer, key, wheel or touch input finishes it immediately. |
| Service Mode cursor | A blinking amber caret, `steps(1)` 1s |
| Quiz feedback | Colour-plus-text only; no animation is defined for it |

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

Rules actually enforced in code: `prefers-reduced-motion: reduce` collapses all animation/transition durations to 0.01ms globally, and additionally the board-opening sequence has its own reduced-motion branch that skips straight to the finished board (full lamp opacity, outlines drawn, tools placed, no spring). The service cursor's blink is also explicitly disabled under reduced motion. Hover-only effects (`.plate--quiet:hover`, `.rack a:hover`, `.back:hover`, `.nav-link:hover`, service menu hover) are gated behind `@media (hover: hover) and (pointer: fine)` so touch devices never get a stuck hover state.

No confetti, no celebration animation anywhere in the build.

---

## 7. Icons

Phosphor, `weight="fill"` for the board's tools (outline/shadow/steel layers all reuse the same filled glyph), used as one family throughout. Module-to-icon mapping (`src/ui/board/tools.ts`): M1 Gauge, M2 Cpu, M3 Fan, M4 LightbulbFilament, M5 SecurityCamera, M6 Siren, M7 BellRinging, M8 SpeakerHifi, M9 Television, with `Wrench` as the fallback for an unrecognised id. No hand-drawn SVG icon paths, no emoji anywhere in the interface.

---

## 8. Banned

- Emoji as icons, or anywhere in the interface
- A second accent colour, or a competing paint colour, alongside `--paint`/`--accent`
- Module identity carried by colour (retired; see §1). New per-module colour coding outside the two frozen lab diagrams
- Section-number eyebrows and standalone kicker labels as decoration. Week numbers are exempt: they are real curriculum data ("Module 4 · Week 4 to 5"), not decoration
- Red (`--danger`) for anything other than a safety hazard
- Em dashes in any user-visible copy
- Div-based fake screenshots, gradient mesh/aurora backgrounds, three-equal-feature-card layouts
- `.service`'s pixel/DotGothic16 skin appearing outside a fault-diagnosis lab panel
- Glyph/system-display icon fonts; Phosphor only

---

## 9. Accessibility floor

- WCAG AA minimum for text; the chrome/paint split (§1) exists specifically to keep the accent legible in both themes
- Visible focus ring on every interactive element: 3px solid `--chrome` (or `--amber` inside `.service`), 3px offset, never removed
- Touch targets 44px minimum (`.back`, `.nav-link`, `.plate`, `.service .check`, `.service .menu button` all pin `min-height: 44px` or larger explicitly)
- Both themes (light pegboard, dark after-hours board) render from the same markup via `prefers-color-scheme`, not a class toggle, and were captured in both for review
- `prefers-reduced-motion: reduce` is honoured globally plus with two named exceptions handled explicitly (board opening, service cursor)
- The tool board (`.board`) is `aria-hidden` with no focusable element inside it; the rack beneath it is the real, keyboard-reachable navigation, so the decorative board never traps or duplicates focus
- Tape headings are real heading elements, not styled decoration on top of plain text, so screen readers get real document structure

---

## Not canonized

Service Mode's `.win--danger` red-framed hazard window and the `--sv-danger` token exist only for the physical-hazard framing inside the fault labs (a live/dangerous point flagged before a student touches it). They are not recorded here as a general "danger panel" component for future non-safety surfaces, because the only shipped use is a genuine safety callout inside a scoped world; promoting it to a reusable pattern would risk the same drift the base `--danger` rule already guards against (red creeping onto non-hazard content).
