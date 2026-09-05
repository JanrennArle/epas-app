# DESIGN.md

Visual authority for the EPAS Interactive Learning App. Approved 2026-09-06.

**Mode:** Operate. The visitor completes a task. Scanability, consistency and the real usage scene (a phone held in a workshop) outrank expression. Brand lives in precise details.

**Design read:** Operate-mode learning app for Grade 12 TVL students on low-end phones, soft-pastel language, Tailwind v4 with CSS variable tokens, rationed motion.

**Dials:** DESIGN_VARIANCE 4 · MOTION_INTENSITY 3 · VISUAL_DENSITY 5.

Low variance and low motion are deliberate: this is a daily task surface for students on shared, modest hardware, and the accessibility floor outranks visual expression.

---

## 1. Colour

### Ground and ink

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FAFAF9` | `#131417` | Page ground |
| `--surface` | `#FFFFFF` | `#1A1C20` | Cards, panels |
| `--ink` | `#1A1B1E` | `#EDEEF0` | Primary text |
| `--ink-2` | `#5F646C` | `#A2A8B2` | Secondary text |
| `--ink-3` | `#8A9099` | `#767D88` | Tertiary, labels |
| `--line` | `#E7E7E9` | `#2A2D33` | Hairlines, borders |

No pure black, no pure white. Both kill depth.

### Accent

`--accent: #0E6E63` (light) / `#3FA394` (dark). Deep teal. One accent for the entire app: links, focus rings, primary buttons, active nav, checked states. A second accent never appears.

### Semantic status

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--danger` | `#B3382C` | `#EF8577` | **Electrical safety only** |
| `--pass` | `#1E7A4A` | `#5FC98E` | Correct, within tolerance, passed |
| `--caution` | `#A9650C` | `#E0A54A` | Incorrect answer, out of tolerance, warning |

**Red is reserved for electrical safety.** In an app about live voltage, red cannot also mean "wrong answer". Incorrect answers use `--caution` plus a written reason.

### Module tints

Nine identity tints at equal luminance, so no module outranks another. Each pairs a wash with an ink that passes AA on that wash.

| Module | Wash | Ink |
|---|---|---|
| M1 Component Testing | `#DDF0EC` | `#1D6B60` |
| M2 PCB, Soldering, Power | `#FAEDD6` | `#8A5B12` |
| M3 Electric Motors | `#DEECFA` | `#1F5A87` |
| M4 Heating and Lighting | `#FBE7DD` | `#8E4B2E` |
| M5 CCTV | `#E4E6FA` | `#414BA0` |
| M6 Fire Alarm Installation | `#FADEE4` | `#963C58` |
| M7 Fire Alarm Servicing, Audio | `#EFE2F7` | `#6B3D8F` |
| M8 Audio Systems | `#E9F3D8` | `#4F6B1E` |
| M9 TV, Sensors, Actuators | `#DAF0F5` | `#1B6377` |

**Pastel is identity, never status.** A tint tells you where you are. It never tells you whether something passed, failed, or is dangerous.

Dark mode tints are hand-picked counterparts at equivalent relative contrast, not algorithmic inversions.

## 2. Type

**Geist** and **Geist Mono**, self-hosted with `font-display: swap`. No webfont CDN.

| Role | Size | Weight | Leading | Notes |
|---|---|---|---|---|
| Page title | 19 to 25px | 680 | 1.15 | `letter-spacing: -0.02em` |
| Section heading | 15px | 660 | 1.3 | |
| Body | 15px | 400 | 1.62 | max 60ch measure |
| Label | 10px | 650 | 1.2 | `0.09em` tracking, uppercase |
| Measured values | 13px | 500 | 1.4 | **Geist Mono**, tabular numerals |

Every measured quantity is mono: resistance, voltage, tolerance, percentages, week numbers. Mono signals data in an app about instruments.

Restrained scale. An Operate surface does not shout. Hierarchy comes from weight and colour before size.

## 3. Shape and elevation

**One radius scale, no exceptions.** Cards and module tiles 14px. Controls, inputs, buttons 10px. Pills full.

**Almost no elevation.** Tiles are flat fills with a hairline. Shadows appear only on genuinely floating layers (modal, sheet, toast), tinted to the ground hue, never pure black.

## 4. The instrument break

Simulation panels carry their own dark instrument skin: ground `#141A21`, screen `#0C1015`, reading `#5FE3B0`, active control `#F2A93B`. Readings in Geist Mono.

This is the app's single deliberate theme break and it is contained inside a lab panel. It exists so the chrome can stay calm while the multimeter looks like a multimeter. It never leaks into lesson or navigation surfaces.

## 5. Motion

Rationed by how often a student sees it.

| Element | Treatment |
|---|---|
| Module tile, nav item, any frequent control | `scale(0.98)` on press, 140ms `--ease-out`. Nothing else. |
| Page navigation | No transition. Instant. |
| Modal, sheet | 200ms `--ease-out`, enter from `scale(0.96)` + opacity 0 |
| Popover | Same, with `transform-origin` at the trigger |
| Quiz feedback | 160ms colour transition. No celebration animation. |
| Meter needles, waveforms, signal flow | Animate freely. Here motion is the content. |

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

Rules: never animate from `scale(0)`. Never use `ease-in` on UI. Only `transform` and `opacity`. Modals keep `transform-origin: center`; popovers do not. Everything above the lowest tier honours `prefers-reduced-motion`, degrading to opacity only. Hover effects gated behind `@media (hover: hover) and (pointer: fine)`.

No confetti, no celebration animation on correct answers. Students see that response hundreds of times.

## 6. Icons

Phosphor, `strokeWidth` 1.5, one family throughout. No hand-drawn SVG icon paths. No emoji anywhere in the interface.

## 7. Banned

- Emoji as icons
- Decorative status dots
- Gradient mesh or aurora backgrounds
- Hand-drawn decorative SVG illustration
- Three equal feature cards
- Div-based fake screenshots
- Purple or violet accents, neon glows
- A second accent colour
- Em dashes in any user-visible copy
- Section-number eyebrows. Week numbers are exempt: they are real curriculum data, not decoration.

## 8. Accessibility floor

- WCAG AA minimum for all text, targeted AAA for body copy
- Visible focus ring on every interactive element, `--accent`, never removed
- Touch targets 44px minimum
- Both themes tested before any screen is called done
- Every simulation reachable and completable by keyboard
