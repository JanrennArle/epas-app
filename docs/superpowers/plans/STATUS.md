# Project status

Last updated 2026-09-12, after plan 7 was written.

## Where things stand

`master` is green: `npx tsc -b` clean, 139 tests across 12 files, `npm run build` clean. No open branches. No active plan workspace.

Six of the eight steps in the spec's build order (section 14 of `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`) are done.

| Built | Detail |
|---|---|
| All nine modules | `src/content/m1.ts` .. `m9.ts`, 84 formative quiz items, 28 competencies |
| Six simulations | `src/interactives/registry.ts` |
| Eight fault scenarios | `src/content/scenarios/` |
| Seven activities | `src/content/activities/` |
| Assessment layer | 56-item pre/post bank, `src/lib/assess.ts`, consent, test runner |

## What is left

Three plans. Plan 7 is written; 8 and 9 are not.

**Plan 7: survey, export, teacher merge** (`2026-09-12-epas-research-output.md`, 6 tasks)

- ISO/IEC 25010 evaluation survey, 20 items, five categories, held as data.
- `/progress`: the student's own view, plus JSON and CSV downloads.
- `/teacher`: PIN gated, merges student JSON files into one class CSV, plus a codebook.

**Plan 8: student surfaces**

- The eight Budget of Work performance task sheets at `/tasks/:taskId`, with rubrics visible to the student from the start. These add columns to the export built in plan 7 rather than a second format.
- The `/labs` gallery and `/labs/:simId`, which the nav already advertises and which currently dead-ends. Open question for that plan: whether a simulation run started from Labs counts as research data or is marked practice and excluded, the way formative quizzes are.

**Plan 9: packaging and deployment**

- `vite-plugin-pwa` with Workbox precaching the whole app; the service worker prompts to update rather than reloading, so it never interrupts a test in progress.
- Offline verification on a real phone.
- Deploy to a static host. The same build also runs from a `dist/` folder on a lab PC if the domain is blocked.

## Three things plan 7 must honour

These are recorded in full in `CARRY-FORWARD.md`; they are repeated here because each one is a promise the app has already made.

1. **The export must filter on `participant.research`.** The consent screen tells a student who declines that nothing of theirs is included in what the teacher reports. `inStudy()` exists to enforce that and currently has no caller. A missing `research` field on an older record means unknown, not yes.
2. **`simId` alone does not identify an exercise, and success is encoded four different ways across the simulations.** An export that averages `score` across simIds will be wrong.
3. **A missing row is not proof of no engagement.** `match` and `hotspot` write nothing until every item is answered.

## Resuming

Read `CLAUDE.md` first, then `CARRY-FORWARD.md`. Say "plan 7" to have the plan written and executed; the six prior plans in this directory are the house pattern for what one looks like.

The one item in the project that no agent can resolve: every module ships `teacherReviewed: false`, and the app shows an unreviewed warning until the teacher clears it. M1 `lo3` contains a capacitor-discharge procedure describing a lethal hazard. That flag is the teacher's to flip.
