# EPAS Interactive Learning App: Design Specification

**Date:** 2026-09-06
**Status:** Approved design, ready for implementation planning
**Source curriculum:** DepEd TechPro, IA Industrial Technologies, Grade 12 elective, *Electronics Product Assembly and Servicing*, Three-Term Budget of Work, last updated 28 April 2026. Copy held at `docs/reference/`.

---

## 1. Purpose

An offline-capable web app that teaches the Grade 12 TechPro EPAS elective and, at the same time, produces the quantitative evidence needed for the teacher's research submission.

Two audiences, one artifact:

- **Students** work through nine modules that mirror the Budget of Work week by week, practise on simulations that stand in for equipment the school may not have in sufficient quantity, and self-check with quizzes.
- **The teacher-researcher** collects pre-test and post-test scores per competency, simulation completion data, and an ISO/IEC 25010 acceptability survey, then merges a whole class into one analysis-ready CSV.

The app is a learning resource first. The research instrumentation is built into the same data path rather than bolted on, so the numbers describe what students actually did.

## 2. Non-goals

- Not a learning management system. No accounts, no server, no roster, no grading workflow.
- Not a circuit design tool. It does not build arbitrary circuits (see 6.1).
- Not a replacement for the shop. Every simulation states the real procedure it stands in for, and performance tasks remain physical.
- No photo or file upload in v1.
- English only in v1. Content is authored as data, so a Filipino translation can be added later without touching code.

## 3. Delivery

An installable PWA. Students open a link once on a phone or lab PC; the service worker precaches the entire app, and it then runs with no internet. Progress lives on the device. Deployed to a free static host, which also yields a stable URL to cite in the paper.

Rationale: the app must work in a classroom with unreliable Wi-Fi and on students' own phones where mobile data is a real cost. A hosted app with accounts was rejected because it adds hosting cost, ongoing maintenance, and student-data privacy exposure for no research benefit that on-device storage plus export does not already provide.

## 4. Module map

Nine modules following the Budget of Work's own week clusters. Learning competencies are quoted from the source document.

| # | Module | Week | Learning competencies |
|---|---|---|---|
| M1 | Electronic Systems and Component Testing | 1 | Explain the overview of Electronic Systems Servicing. Discuss electronic components identification. Demonstrate procedures in testing electronic components. |
| M2 | PCB, Soldering and Power Supplies | 2 | Discuss the procedures for PCB designing, including design software and layout transfer techniques. Discuss soldering and desoldering. Discuss the different types of power supplies. Perform variable regulated power supply assembly. |
| M3 | Appliances with Electric Motors | 3 | Discuss the procedures in servicing appliances with electric motors. Apply procedures in servicing appliances with electric motors. |
| M4 | Heating Appliances and Lighting Units | 4 to 5 | Discuss and apply procedures in servicing appliances with heating components. Discuss the procedures in servicing rechargeable and electronic-controlled lighting units. Demonstrate the procedure in servicing electronic controlled lighting units. Discuss the principles of Closed-Circuit Television (CCTV) system. |
| M5 | CCTV Systems | 6 | Demonstrate the procedure in CCTV system installation. Perform CCTV system servicing. |
| M6 | Fire Alarm Principles and Installation | 7 | Discuss the principles of fire alarm systems. Perform the procedure in fire alarm system installation. |
| M7 | Fire Alarm Servicing and Audio Introduction | 8 | Perform the procedure in fire alarm system servicing. Discuss audio products and systems. |
| M8 | Audio Products and Systems | 9 | Perform the installation and operation of audio products and systems. Perform procedure in servicing audio products and systems. |
| M9 | Television, Control Boards, Sensors and Actuators | 10 to 11 | Discuss television. Perform the procedure in servicing television. Discuss control boards and motor controllers. Perform the procedure in servicing control boards and motor controllers. Discuss sensors and actuators. Perform the procedure in servicing sensors and actuators. |

The fire alarm content spans M6 and M7 because the Budget of Work splits it that way: installation in week 7, servicing in week 8.

The Budget of Work's eight performance tasks are carried as guided task sheets, four individual and four group, attached to the modules they belong to. Task text is quoted from the source.

## 5. Content model

A competency is data, not a component. Each module is one typed content file consumed by shared renderers, so adding or correcting a module means editing data.

```
Module
 └── LearningOutcome            quoted competency text from the BOW
      ├── Lesson
      │    └── Block[]          text · figure · safety-callout · table
      │                         · checklist · procedure-steps · interactive
      └── QuizItem[]            mcq · true-false · match · hotspot
                                · procedure-ordering
```

`procedure-ordering` exists because EPAS is assessed on correct sequence under safety constraints. "Arrange the steps to safely discharge a filter capacitor" is a question a paper worksheet handles badly and this app handles well.

Each module also carries a `teacherReviewed` boolean, defaulting to `false`. See 12.2.

## 6. Simulation architecture

Three flagship simulations and a set of light interactives, all sharing one event interface.

### 6.1 No general circuit solver

An earlier draft proposed a shared nodal-analysis solver. It was dropped after reading the Budget of Work. The competencies are servicing competencies, measure this component, diagnose this dead appliance, not circuit-design competencies. A general solver is the highest-risk component in the build and buys almost nothing here.

Three small deterministic engines replace it, each authorable as data:

| Engine | Answers | Drives |
|---|---|---|
| `lib/measure` | What does a meter read on this component, good or faulty? | Multimeter and Component Testing Lab |
| `lib/signal` | What is the waveform at each power supply stage? | Power Supply Assembly Simulator |
| `lib/diagnose` | Symptom, test, reading, next step. | System Troubleshooter |

### 6.2 Flagship simulations

1. **Multimeter and Component Testing Lab.** Measure resistance, voltage, continuity and diode drop on good and faulty parts. Reused by M1, M2, M8 and M9, which is why it is built first.
2. **Power Supply Assembly Simulator.** Transformer, rectifier, filter, regulator: place, solder, then measure, with the waveform visible at each stage. Serves the M2 competency and Individual Performance Task 1 directly.
3. **System Troubleshooter.** One fault-tree engine, eight scenarios as data: electric fan, flat iron, rechargeable lamp, CCTV, fire alarm, audio amplifier, television, motor controller. M3 through M9 all reuse this engine.

### 6.3 Light interactives

Three generic engines cover every remaining interactive, all data-driven:

- **MatchEngine.** Component identification matching, passive/active/IC sorting, schematic symbol matching.
- **HotspotEngine.** Click-to-label diagrams: motor anatomy, heating element, control board, television internals.
- **SequenceEngine.** Ordering and signal-chain building: PCB layout planning, CCTV, fire alarm and audio signal flow, procedure ordering.

All of these derive from the Budget of Work's own Suggested Activities column.

### 6.4 One interface

Every interactive, flagship or light, mounts inline in a lesson or full screen in `/labs`, and reports identically:

```ts
type SimEvent =
  | { type: 'progress', pct: number }
  | { type: 'attempt',  correct: boolean }
  | { type: 'complete', score: number, evidence: Record<string, unknown> }
```

The `complete` event is the spine of the research export. Uniform instrumentation is what keeps the exported data defensible.

### 6.5 Rendering

SVG throughout. No canvas, no WebGL, no external assets. Crisp at any zoom, themes through CSS variables, works on a low-end phone, and ships inside the PWA.

## 7. Routing

- `/` module map, the home surface
- `/m/:moduleId` module overview, outcomes, pre-test entry
- `/m/:moduleId/lo/:outcomeId` lesson reader with inline interactives
- `/labs`, `/labs/:simId` simulation gallery and full-screen simulation
- `/tools` calculators and a Component Explorer tile grid
- `/tasks/:taskId` performance task sheets
- `/progress` mastery view and results export
- `/evaluate` ISO/IEC 25010 survey
- `/teacher` PIN-gated class merge tool
- `/settings`

## 8. Assessment and research layer

Four instruments, one store.

1. **Pre-test and post-test per module.** Drawn from a tagged item bank as disjoint but matched forms: same competency, same difficulty, different items. This is what supports a learning-gain claim rather than a memory effect. Items are tagged to the competency they assess, so gains can be reported per competency.
2. **Formative quizzes** inside lessons. Instant feedback with a rationale on every option. Logged as attempts, excluded from the gain calculation.
3. **Performance task sheets.** The eight Budget of Work tasks with task text quoted, an ordered step checklist, safety callouts, and the rubric visible to the student from the start. Students tick steps and record notes; the rubric exports for teacher scoring.
4. **Evaluation instrument.** ISO/IEC 25010 based: Functional Suitability, Reliability, Usability, Performance Efficiency, Portability. Four items each, five-point Likert, plus open comments and a respondent-type field of student, teacher, or expert validator. All twenty items live in a data file and can be replaced without code changes.

**Consent and identity.** First launch shows a short editable consent screen and issues a participant code. Name is optional. Nothing leaves the device unless the student exports it.

**Export.** `/progress` produces CSV for statistical software and JSON for lossless transfer. `/teacher` accepts a set of student JSON files and merges them into one CSV: a row per student, pre, post and gain columns per competency, survey items appended.

## 9. Design system

**Design read:** Operate-mode learning app for Grade 12 TVL students on low-end phones in a workshop, soft-pastel language, Tailwind v4 with CSS variable tokens, rationed motion.
**Dials:** DESIGN_VARIANCE 4, MOTION_INTENSITY 3, VISUAL_DENSITY 5.

Tokens, module tints and the applied module map are specified in `docs/DESIGN.md`. The rules that govern them:

- **Pastel is identity, never status.** A module tint says where you are. It never says pass, fail, or danger.
- **Red is reserved for electrical safety.** In an app about live voltage, red cannot also mean "wrong answer". Incorrect answers use caution amber plus a written reason.
- **Nine tints at equal luminance,** so no module appears more important than another.
- **One accent, teal `#0E6E63`,** on everything interactive. No second accent anywhere.
- **One radius scale:** cards 14px, controls 10px, pills full.
- **Almost no elevation.** Flat fills with hairlines. Shadows only on genuinely floating layers, tinted to the ground, never pure black.
- **Instruments keep a dark skin inside their panels.** The single deliberate theme break, contained within lab panels, so the chrome stays calm and the multimeter looks like a multimeter.
- **Motion rationed by frequency.** Module grid: a 140ms press and nothing else. Modals: 200ms, entering from `scale(0.96)` with opacity, never from `scale(0)`. Meter needles and waveforms animate freely because there the motion is the content. No celebration animation on correct answers, which students see hundreds of times. Everything honours `prefers-reduced-motion`, and only `transform` and `opacity` are animated.
- **Dark mode is designed, not inverted.** Every tint has a hand-picked dark counterpart at equivalent relative contrast.
- **Banned:** emoji as icons, decorative status dots, gradient mesh backgrounds, hand-drawn decorative SVG, three equal feature cards, fake screenshots, em dashes in any user-visible copy.

## 10. Storage, offline and deployment

**Stack.** Vite, React, TypeScript, Tailwind v4, React Router, `vite-plugin-pwa` with Workbox precaching the whole app. Zustand for the progress store. Phosphor icons at 1.5 stroke. Geist and Geist Mono self-hosted. No CDN, which is what allows fully offline operation.

**Storage.** One versioned root key in `localStorage`:

```
epas.v1 -> { schemaVersion, participant, modules{}, attempts[], sims[], survey }
```

A term of data for one student is tens of kilobytes, well inside the budget, and synchronous reads keep screens simple. Every write goes through `lib/store.ts`; no component touches storage directly. A schema version and migration function exist from day one, because the shape will change mid-term and a lost class dataset is not recoverable.

**Service worker.** Prompts to update rather than reloading, so it never interrupts a quiz in progress.

**Deployment.** Static host such as Netlify or GitHub Pages, free, citable URL, installable on Android. The same build produces a `dist/` folder that can be served locally on lab PCs if the domain is blocked.

## 11. Testing

Vitest covers the four areas where a silent bug corrupts research rather than visibly breaking a screen:

1. `lib/measure` component readings and fault variants
2. `lib/signal` power supply stage waveforms
3. `lib/diagnose` fault-tree transitions
4. `lib/store` migrations, scoring, and CSV export shape

The UI is not unit tested. Screens change constantly; those four must not.

## 12. Risks

1. **Content volume is the long pole, not the code.** Nine modules of lesson text is where this slips. Mitigation: content is data, and M1 is written to completion first as the standard every other module matches.
2. **Technical accuracy.** The lesson content is drafted from the competencies, and students may act on it near live voltage. Every safety-critical procedure is flagged for teacher review, and each module carries a `teacherReviewed` flag defaulting to `false` that is visible in the UI until cleared. The app states that a module is unreviewed rather than letting a student trust an unverified discharge procedure.
3. **Scope.** Full curriculum coverage plus three flagship simulations plus assessment plus survey is substantial. If something gives, it will be depth in M6 through M9, and that will be reported rather than quietly absorbed.

## 13. Repository shape

```
src/
  content/        nine module files, the Budget of Work as data
  lib/            measure · signal · diagnose · store · export
  interactives/   three flagship simulations, three generic engines
  routes/         modules · lesson · labs · tools · tasks · progress · evaluate · teacher
  ui/             tokens and primitives
docs/
  PRODUCT.md      product context
  DESIGN.md       visual authority
  reference/      the source Budget of Work
  superpowers/specs/
```

## 14. Build order

1. Tokens, shell, routing, storage module with migrations, and the M1 content file end to end. This establishes the standard.
2. `lib/measure` and the Multimeter and Component Testing Lab, which four modules depend on.
3. The three generic light-interactive engines.
4. M2 content, `lib/signal`, and the Power Supply Assembly Simulator.
5. `lib/diagnose` and the System Troubleshooter engine, then its eight scenarios as data alongside M3 to M9 content.
6. Assessment: item banks, pre-test and post-test, performance task sheets.
7. Evaluation survey, export, and the teacher merge tool.
8. PWA packaging, offline verification on a real phone, deployment.

Detailed task breakdown belongs in the implementation plan, not here.
