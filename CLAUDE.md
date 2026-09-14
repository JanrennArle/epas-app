# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An offline-capable learning app for EPAS (Electronics Products Assembly and Servicing), built for a Filipino teacher's Grade 12 class and submitted as part of a research paper.

Two consequences that are not visible from the code:

- **Students follow these procedures on real mains-powered appliances.** A wrong step is a physical hazard, not a content bug.
- **The quizzes, tests and simulation scores are the research instrument.** Anything that lets a student score well without doing the work invalidates the data, so treat scoring defects as severe even when they look cosmetic.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm test           # vitest run
npm run test:watch # vitest watch
npm run icons          # regenerate the app icons from scripts/make-icons.mjs
npm run verify:offline # build, then fail if any emitted file is not precached
```

Type-check without building: `npx tsc -b`

Run one file or one test:

```bash
npx vitest run tests/diagnose.test.ts
npx vitest run -t "returns an empty string for an unknown test point"
```

`.claude/launch.json` defines an `epas-dev` config, so the dev server can be started for browser checks. **Do them.** Two defects on this project were reachable only by driving the app: a route that showed a finished test as already complete and recorded nothing, and a consent gate that a deep link walked straight past. Neither is catchable by a unit test of a pure engine, which is where all the testing lives.

## Architecture

**Content is data, not components.** The nine modules in `src/content/m1.ts` .. `m9.ts` are typed `Module` objects (`src/lib/types.ts`). Lessons are arrays of `Block` unions rendered by `src/ui/blocks/BlockRenderer.tsx`; formative quizzes are `QuizItem` unions rendered by `src/ui/Quiz.tsx`. Adding a lesson, a quiz or a whole module means editing data and nothing else. Five shared sub-registries work the same way: `src/content/activities/` (match, hotspot, sequence data), `src/content/scenarios/` (fault-diagnosis scenarios), `src/content/bank/` (pre-test and post-test items), `src/content/tasks/` (the eight Budget of Work performance task sheets) and `src/content/labs.ts` (the Labs gallery, which is **derived** from the activity and scenario registries rather than listed, so authoring an exercise puts it on the gallery and a shell can never open an exercise of the wrong kind).

**Logic lives in pure engines under `src/lib/`,** each total, dependency-free and unit-tested:

| Module | Owns |
|---|---|
| `measure.ts` | Meter readings for a component under a fault mode |
| `signal.ts` | Power-supply waveforms per stage |
| `diagnose.ts` | Fault-scenario scoring. **Frozen**, see below |
| `activity.ts` | One scorer serving all three activity formats |
| `quiz.ts` | Formative quiz grading |
| `assess.ts` | Test-form grading and per-competency learning gain |
| `export.ts` | CSV quoting, the JSON bundle, the 141 column row, the class table and the codebook |
| `merge.ts` | Which students' work belongs in a merged class table |
| `store.ts` | The only localStorage owner (key `epas.v1`) |

The UI is deliberately not unit-tested. Put behaviour worth testing in an engine, then test the engine, then check the screen in a browser.

**Simulations register themselves once.** `src/interactives/registry.ts` maps a `simId` to a component; a lesson embeds one with `{ kind: 'interactive', simId, config }`. Adding a simulation is one registry entry plus one component file.

**Persistence goes through `src/lib/store.ts` only.** Never touch `localStorage` elsewhere. On an unreadable or unknown-version payload it salvages the raw string to `epas.v1.unreadable.<timestamp>` before overwriting, because silently wiping a student's data mid-study destroys research results.

**Routing uses `createHashRouter` and `base: './'`** so the built app runs from any static host or the filesystem. Keep it that way. `src/ui/Shell.tsx` wraps every route and is where the consent gate lives, because it is the only place that can cover all of them; gating a single screen leaves deep links open.

TypeScript runs with `strict`, `noUnusedLocals`, `noUnusedParameters` and `noUncheckedIndexedAccess`. Indexed access yields `T | undefined`; handle it rather than asserting past it.

## The assessment layer

This is what the research paper reports, so its invariants are load-bearing.

**Two disjoint item sets.** The 84 formative items live inside lessons and explain every option. The 56 bank items in `src/content/bank/` are the pre-test (form A) and post-test (form B), a matched pair for each of the 28 competencies. `BankItem` has **no `rationale` field, by design**: showing a student why an answer was wrong between the two measurements teaches them, which is exactly what the gain is trying to detect. Do not add one, and do not reuse `Quiz.tsx` for a test.

**One sitting is one run.** `recordAttempt` stamps a `runId` taken once per submission. `attemptsFor(moduleId, context)` returns only the newest run, so a retake supersedes rather than averages. A record with no `runId` predates the field and is returned as one legacy run.

**`competencyGains(pre, post)` is the headline number.** `gained` means the student did *not* have the competency and now does, in that order. A competency already held is not a gain; a pre-test written after the post-test sets `ordered: false` and counts as nothing.

## Authoring rules

These are not style preferences. Each one is a defect that shipped and was caught in review.

**Trace the power state of every procedure, step by step, as you write it.** A `steps` block or an `order` quiz that isolates the supply and then requires a live measurement is impossible to perform. This shipped six times across five plans, and twice survived a review that had been warned about it. Every power transition must be named in the step text itself: "Restore the supply and...", "Isolate again and...". See `m9-lo2-q3`, `m9-lo4-q3` and `m9-lo6-q3` for the house pattern. No test can catch this; power state is not encoded in the data.

**A `safety` block must not forbid a test the student is later required to perform.** If an outcome needs live measurements, say so in the safety block and teach the technique. This has happened four times, always as a blanket rule copied from somewhere it was right: "close the unit before you charge it" banned the one measurement m4 teaches, "switch off before you move the probes" banned the comparisons m8 is built on, and m5's own line banned the powered reading its own quiz key requires. Narrow the rule to the hazard; never ban the technique the module teaches. Check the rubric in the same pass, because a rubric left grading the blanket version marks a student down for following the steps.

**A permission must be a positive list.** A safety rule that says "the teacher will mark the dangerous points" makes everything unmarked safe by omission, which is the opposite of what it means. Have the teacher mark what is *permitted*, state that everything else is off limits until they say otherwise, and make sure the procedure can still be completed when the permitted list turns out to be empty.

**Hunt the exploit family before adding items, and before writing anything a student reads near one.** Seven separate ways to score without reading have been found and fixed, and they are one defect in different clothes: a surface feature correlating with correctness. Keys bunched on one option (43 of 45 on B). The key being the longest option (48 of 56). Pairs mismatched in difficulty. Keys balanced across the whole bank but not within each form, which a student sits one of.

The sixth and seventh were found in plan 8 and neither was in an item:

- **An answer pool listed in its own answer order.** Two match activities and one hotspot listed their choices in exactly the order their questions asked for them, and both formats render the pool in array order, so picking the Nth option for the Nth question scored five of five without reading. Guarded forwards and backwards by `tests/activities.test.ts`.
- **A surface outside the exercise carrying its answer.** The Labs gallery blurbs named the answers in order: "Put microphone, mixer, amplifier and speaker into the order the sound travels" is the whole key, and by omission names the distractor too. Guarded by `tests/registry.test.tsx`. **Card copy, tile labels, link text, headings and instructions are all surfaces a student reads before answering.** Name the subject, never the answers.

**Measure anything new for an eighth** across position, length, phrasing, ordering, and anything that differs systematically between form A and form B. The guard suites hold the seven that were found and cannot hold one nobody has looked for. **Mutation-check every guard you write before believing it:** two written in plan 8 passed against the exact defect they were written for, one because a word-boundary escape written with a single backslash inside a template literal becomes the backspace character, one because it never advanced the clock past a debounce.

**Consent is decided per student, and the rule is not the risky part.** The consent screen promises a declining student that nothing of theirs reaches the teacher's report. That promise broke three times while the export was built, and every time it broke in the glue rather than in the rule: consent decided per file, then an accumulation key on the filename, then an eviction key on the filename. Every export a student saves is named `epas-<code>.json`, so anything keyed on a filename silently merges two different sittings. `src/lib/merge.ts` owns the whole path now. Change it there, with tests, never in a component.

**Distractors must be wrong, and stay wrong when edited.** Rewriting a wrong option into a fuller, more specific sentence can make it true. That happened twice in one commit. Re-read every distractor you lengthen and confirm a competent technician would still reject it.

**No em dashes anywhere in user-visible copy.** Absolute. Applies to lesson text, quiz and test stems, options, rationales, scenario readings and remedies.

**Red (`--danger`) is reserved for safety hazards.** Never for wrong answers, errors or emphasis.

**Every `competency` string must match a competency of its own module character for character,** and item ids must be globally unique across the formative quizzes and the bank together.

The curriculum authority is the **DepEd TechPro Grade 12 elective Budget of Work**, organised week by week (`docs/reference/`). It is not TESDA NC II units; do not map content onto those.

## Guard tests

Thirteen suites walk the whole content set and configuration and turn silent authoring mistakes into build failures. Extend these rather than adding per-module assertions.

- `tests/activities.test.ts` resolves every activity, scenario and `simId` reference, and checks hotspot regions and sequence orders.
- `tests/quiz-keys.test.ts` holds the formative items: key spread, and that a key points at the rationale explaining it.
- `tests/bank.test.ts` holds the test items: 56 pinned, one A and one B per competency, no id colliding with a formative item, key spread **within each form**, and two length tells with a cap on the gap between the forms.
- `tests/assess.test.ts` pins what a gain means. Three plausible misreadings of `gained` once passed the whole suite; they are now killed by name.
- `tests/survey.test.ts` holds the twenty evaluation items: four per category, unique ids, none colliding with the two reserved keys.
- `tests/export.test.ts` holds the CSV. Quoting, the formula guard, the defensive bundle parser, and that the header, the row and the codebook agree.
- `tests/merge.test.ts` holds the consent rule. **Read its comments before changing anything about how files reach `groupByStudent`.** It also holds `markingList`, the one output consent deliberately does not filter, and says why.
- `tests/tasks.test.ts` holds the eight performance task sheets: the brief quoted verbatim from the Budget of Work, the rubric counts, and the alternation between individual and group work.
- `tests/registry.test.tsx` holds the Labs gallery: every simulation reachable, every activity and scenario carrying a card, every shell classified, and **no card naming its own answers**.
- `tests/task-sheet.test.tsx` is the only UI suite here and it is an exception with a reason. The defect it guards, a route seeding state from its param in a `useState` initialiser while the router keeps the component mounted, shipped twice and the suite noticed neither time.
- `tests/manifest.test.ts` holds the web app manifest and `index.html`: `start_url` lands on a route the consent gate covers, everything in the manifest is relative, every icon it names exists, and every `href`/`src` in `index.html` is scanned rather than a named handful, so an added absolute URL fails loudly.
- `tests/icons.test.ts` decodes the generated PNGs pixel by pixel rather than checking headers alone, because a header check passes for a blank tile: the plain icon and the maskable icon each have their glyph and their corner-transparency checked, and so does `apple-touch-icon.png`.
- `tests/updates.test.ts` holds `mayPrompt`: the two routes a reload must never interrupt, that a trailing slash does not evade the match, and that an unrecognised route defaults to allowed rather than blocked. `tests/update-prompt.test.tsx` holds the component that calls it: that the bar is actually withheld and re-offered across a real route change, and that only its own button calls `updateServiceWorker`.

**Mutation-check every guard before you believe it.** Change the code so the defect is present, run the test, watch it fail, put the code back. Four guards written on this project passed against the exact defect they were written for: two because of an escaping mistake, one because it never advanced the clock past a debounce, one because it checked the format the defect was found in rather than all three.

`src/lib/diagnose.ts` is frozen. `requiredTests` returns the *position* of the last implicating test point, which is what makes the taught diagnostic sweep outscore a lucky first guess. Changing `PENALTY`, `FLOOR` or that function rescores every scenario in the app.

## The service worker

`vite-plugin-pwa` precaches the whole build. Three things about it are
load-bearing:

**`registerType` is `'prompt'` and must stay that way.** The spec's promise is
that the worker "prompts to update rather than reloading, so it never
interrupts a quiz in progress". `Assessment.tsx` holds a whole sitting in
React state until submit, and a student who has seen the pre-test items
cannot sit it again honestly. `src/lib/updates.ts` decides where the prompt
may appear; it withholds rather than discards, so a suppressed update is
offered as soon as the student is somewhere a reload costs nothing.

**Run `npm run verify:offline` before deploying.** It fails when a file the
build emitted is missing from the precache manifest. That failure is
invisible any other way: everything works on the bench, because the bench has
a network, and the missing file only shows up on a student's phone with no
signal.

**The manifest lives in `src/pwa/manifest.ts`,** not inline in the Vite
config, so `tests/manifest.test.ts` reads the object that actually ships.
`start_url` is `'./'` and everything in it is relative, because an absolute
path breaks the moment the app is served from the project subdirectory a
GitHub Pages URL gives you. `start_url` must also land on a route the consent
gate covers.

Icons are generated by `scripts/make-icons.mjs`, which writes PNG bytes with
`zlib` and fetches nothing, because the spec forbids external assets. Re-run
`npm run icons` after changing the accent colour.

**A service worker serving a stale bundle to a device holding newer data is
the one way this app can lose a student's work, and `SCHEMA_VERSION` in
`src/lib/store.ts` is the trap door.** `migrate()` returns `freshState()` for
any `schemaVersion` it does not recognise, and `loadState` then salvages the
raw string to `epas.v1.unreadable.<timestamp>` before overwriting it, which is
the safety net, not the hazard: the hazard is that a student's own
`localStorage` reaches a schema newer than the cached bundle running against
it knows how to read. Today this cannot happen: `cleanupOutdatedCaches: true`
evicts a device's old precache the moment a newer bundle's worker activates,
`localStorage` is per device, and there is no schema 2 in existence, so a
device can never hold data newer than the newest bundle it has ever run. That
guarantee is structural, not permanent. **The next person who bumps
`SCHEMA_VERSION` must re-check it**, because the failure mode is silent and
total: the student sees an empty app, and their real data is recoverable only
by a teacher who knows to go looking for the salvage key.

## Reference documents

- `docs/superpowers/plans/STATUS.md` says what is built, what is left, and what the next plan must honour. Start here after a break.
- `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` is the binding product spec.
- `docs/DESIGN.md` is the visual authority: tokens, the nine module tints, motion rules, and an explicit ban list.
- `docs/DEPLOY.md` walks a teacher through the three ways to get the built app in front of a class, including the lab-PC-with-no-internet case.
- `docs/OFFLINE-CHECK.md` is the manual phone check that no automated test can do: installing, going into flight mode, and confirming nothing was lost.
- `docs/superpowers/plans/CARRY-FORWARD.md` records known deferred defects and is grouped by the plan that raised each one. **Read it before starting new work.** Resolved entries are marked rather than deleted, so check the marker before trusting an entry. The live traps include that `simId` alone no longer identifies an exercise, that success is encoded four different ways across the simulations, that a missing row is not proof of no engagement, and that the export must filter on `participant.research` or the consent screen becomes a false statement.
