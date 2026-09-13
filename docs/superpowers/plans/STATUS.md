# Project status

Last updated 2026-09-13, after plan 8 merged.

## Where things stand

`master` is green: `npx tsc -b --force` clean, 302 tests across 17 files, `npm run build` clean. No open branches. No active plan workspace.

Every part of the app a student or teacher touches is built. One step of the spec's build order (section 14 of `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md`) remains, and it is packaging.

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

**Plan 9: packaging and deployment.** The last one.

- `vite-plugin-pwa` with Workbox precaching the whole app; the service worker prompts to update rather than reloading, so it never interrupts a test in progress.
- Offline verification on a real phone.
- Deploy to a static host. The same build also runs from a `dist/` folder on a lab PC if the domain is blocked.

## What plan 9 must honour

Recorded in full in `CARRY-FORWARD.md` and repeated here because each is a promise the app has already made.

1. **The consent filter must not be undone.** `src/lib/merge.ts` decides consent per student and fails closed, and `markingList` beside it is the one output it deliberately does not filter. The rule broke three times while being built, every time in glue code around it rather than in the rule.
2. **`simId` alone does not identify an exercise, and success is encoded four different ways across the simulations.** An export that averages `score` across simIds will be wrong.
3. **A missing row is not proof of no engagement.** `match` and `hotspot` write nothing until every item is answered.
4. **The store's schema version stays 1 and `store.ts` stays the only owner of `localStorage`.** A service worker that serves a stale bundle to a device holding newer data is the one way this app can lose a student's work; the salvage path in `loadState` is what stands between that and a destroyed result set.
5. **Nothing in the offline shell may bypass the consent gate in `src/ui/Shell.tsx`.** A precached start URL that lands past it would record attempts before consent, which a deep link already did once.

## Resuming

Read `CLAUDE.md` first, then `CARRY-FORWARD.md`. Say "plan 9" to have the last plan written and executed; the eight prior plans in this directory are the house pattern for what one looks like.

The one item in the project that no agent can resolve: every module ships `teacherReviewed: false`, and the app shows an unreviewed warning until the teacher clears it. M1 `lo3` contains a capacitor-discharge procedure describing a lethal hazard. That flag is the teacher's to flip.

Plan 8 made that more important, not less. The eight performance task sheets are procedures a student carries out on a live mains appliance, and they took three dedicated safety passes to settle: the first found three Blocking defects, the second two, the third one, and two of those were introduced by the fix for the one before. Every power and enclosure transition is now named in the step that makes it, and each sheet has been read against the module that teaches the same procedure. **Read all eight before your class does.** They are the part of this app that can hurt someone.
