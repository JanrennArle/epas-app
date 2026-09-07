# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An offline-capable learning app for EPAS (Electronics Products Assembly and Servicing), built for a Filipino teacher's Grade 12 class and submitted as part of a research paper.

Two consequences that are not visible from the code:

- **Students follow these procedures on real mains-powered appliances.** A wrong step is a physical hazard, not a content bug.
- **The quizzes and simulation scores are the research instrument.** Anything that lets a student score well without doing the work invalidates the data, so treat scoring defects as severe even when they look cosmetic. This has already happened twice: 43 of 45 multiple-choice items keyed to option B (fixed, now guarded), and the troubleshooter still awards a perfect score for a zero-test guess (open, see `docs/superpowers/plans/CARRY-FORWARD.md`).

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm test           # vitest run
npm run test:watch # vitest watch
```

Type-check without building: `npx tsc -b`

Run one file or one test:

```bash
npx vitest run tests/diagnose.test.ts
npx vitest run -t "returns an empty string for an unknown test point"
```

## Architecture

**Content is data, not components.** The nine modules in `src/content/m1.ts` .. `m9.ts` are typed `Module` objects (`src/lib/types.ts`). Lessons are arrays of `Block` unions rendered by `src/ui/blocks/BlockRenderer.tsx`; quizzes are `QuizItem` unions rendered by `src/ui/Quiz.tsx`. Adding a lesson, a quiz or a whole module means editing data and nothing else. Two shared sub-registries work the same way: `src/content/activities/` (match, hotspot, sequence data) and `src/content/scenarios/` (fault-diagnosis scenarios).

**Logic lives in pure engines under `src/lib/`,** each total, dependency-free and unit-tested:

| Module | Owns |
|---|---|
| `measure.ts` | Meter readings for a component under a fault mode |
| `signal.ts` | Power-supply waveforms per stage |
| `diagnose.ts` | Fault-scenario scoring. **Frozen**, see below |
| `activity.ts` | One scorer serving all three activity formats |
| `quiz.ts` | Quiz grading |
| `store.ts` | The only localStorage owner (key `epas.v1`) |

The UI is deliberately not unit-tested. Put behaviour worth testing in an engine, then test the engine.

**Simulations register themselves once.** `src/interactives/registry.ts` maps a `simId` to a component; a lesson embeds one with `{ kind: 'interactive', simId, config }`. Adding a simulation is one registry entry plus one component file.

**Persistence goes through `src/lib/store.ts` only.** Never touch `localStorage` elsewhere. On an unreadable or unknown-version payload it salvages the raw string to `epas.v1.unreadable.<timestamp>` before overwriting, because silently wiping a student's data mid-study destroys research results.

**Routing uses `createHashRouter` and `base: './'`** so the built app runs from any static host or the filesystem. Keep it that way.

TypeScript runs with `strict`, `noUnusedLocals`, `noUnusedParameters` and `noUncheckedIndexedAccess`. Indexed access yields `T | undefined`; handle it rather than asserting past it.

## Authoring rules

These are not style preferences. Each one is a defect that shipped and was caught in review.

**Trace the power state of every procedure, step by step, as you write it.** A `steps` block or an `order` quiz that isolates the supply and then requires a live measurement is impossible to perform. This shipped six times across five plans, and twice survived a review that had been warned about it. Every power transition must be named in the step text itself: "Restore the supply and...", "Isolate again and...". See `m9-lo2-q3`, `m9-lo4-q3` and `m9-lo6-q3` for the house pattern. No test can catch this; power state is not encoded in the data.

**A `safety` block must not forbid a test the student is later required to perform.** If an outcome needs live measurements, say so in the safety block and teach the technique.

**No em dashes anywhere in user-visible copy.** Absolute. Applies to lesson text, quiz stems, options, rationales, scenario readings and remedies.

**Red (`--danger`) is reserved for safety hazards.** Never for wrong answers, errors or emphasis.

**Every quiz `competency` string must match a competency of its own outcome character for character,** and quiz ids must be globally unique.

**Spread multiple-choice answer keys.** Options render in authored order, so keys that bunch onto one position make every quiz answerable without reading it.

The curriculum authority is the **DepEd TechPro Grade 12 elective Budget of Work**, organised week by week (`docs/reference/`). It is not TESDA NC II units; do not map content onto those.

## Guard tests

`tests/activities.test.ts` and `tests/quiz-keys.test.ts` walk the whole content set and turn silent authoring mistakes into build failures: unresolvable activity, scenario or `simId` references, duplicate quiz ids, competency mismatches, hotspot regions outside 0 to 100 percent, a sequence whose display order equals its answer, answer keys bunched on one option, and a key pointing at a rationale that does not explain it. Extend these rather than adding per-module assertions.

`src/lib/diagnose.ts` is frozen. `requiredTests` returns the *position* of the last implicating test point, which is what makes the taught diagnostic sweep outscore a lucky first guess. Changing `PENALTY`, `FLOOR` or that function rescores every scenario in the app.

## Reference documents

- `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` is the binding product spec.
- `docs/DESIGN.md` is the visual authority: tokens, the nine module tints, motion rules, and an explicit ban list.
- `docs/superpowers/plans/CARRY-FORWARD.md` records known deferred defects. **Read it before starting new work**; several are load-bearing traps, including that `onEvent` is never wired, that repeat runs append duplicate records, and that a `simId` alone no longer identifies an exercise.
