# Project status

Last updated 2026-09-13, after plan 9 merged.

## Where things stand

`master` is green: `npx tsc -b --force` clean, 325 tests across 20 files, `npm run build` clean. No open branches. No active plan workspace.

Every part of the app a student or teacher touches is built, including packaging: section 14 of `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` is done in full.

| Built | Detail |
|---|---|
| All nine modules | `src/content/m1.ts` .. `m9.ts`, 84 formative quiz items, 28 competencies |
| Six simulations | `src/interactives/registry.ts` |
| Eight fault scenarios | `src/content/scenarios/` |
| Seven activities | `src/content/activities/` |
| Assessment layer | 56-item pre/post bank, `src/lib/assess.ts`, consent, test runner |
| Research output | 20-item ISO 25010 survey, `/progress` export, `/teacher` class merge, codebook |
| Performance tasks | Eight Budget of Work sheets at `/tasks/:taskId`, 33 rubric criteria, ticks and notes stored |
| Labs | 17 exercises at `/labs`, every activity and every scenario openable on its own |
| Engagement columns | Class CSV is 141 columns, with `classTable` and a blank marking grid covering the whole class |

## What is left

Nothing in the spec's build order. Every step of section 14 is done.

What remains is the teacher's, and no agent can do it:

1. **Read the eight performance task sheets** in `src/content/tasks/`. Students
   carry these out on live mains appliances.
2. **Clear `teacherReviewed`** on each module in `src/content/m1.ts` .. `m9.ts`
   once you have read it. Until then every module shows an unreviewed warning,
   which is correct and should stay until you have actually read it.
3. **Deploy**, following `docs/DEPLOY.md`, and then work through
   `docs/OFFLINE-CHECK.md` on a real phone.
4. **Set a teacher PIN** on the device you will merge the class on. The
   `/teacher` screen asks for one the first time.

## Resuming

Read `CLAUDE.md` first, then `CARRY-FORWARD.md`. Plan 9 was the last one on the spec's build order; there is no next plan queued. What remains is listed above under "What is left", and every item there is the teacher's to do, not an agent's. The nine plans in this directory are the house pattern for what one looks like, if a new one is ever needed.

The one item in the project that no agent can resolve: every module ships `teacherReviewed: false`, and the app shows an unreviewed warning until the teacher clears it. M1 `lo3` contains a capacitor-discharge procedure describing a lethal hazard. That flag is the teacher's to flip.

Plan 8 made that more important, not less. The eight performance task sheets are procedures a student carries out on a live mains appliance, and they took three dedicated safety passes to settle: the first found three Blocking defects, the second two, the third one, and two of those were introduced by the fix for the one before. Every power and enclosure transition is now named in the step that makes it, and each sheet has been read against the module that teaches the same procedure. **Read all eight before your class does.** They are the part of this app that can hurt someone.
