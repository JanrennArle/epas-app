# Carry-forward notes

Deferred items from executed plans. Each was reviewed, judged non-blocking, and consciously left. Read this before writing the next plan.

## From Plan 1, foundation and the M1 vertical slice (branch `feat/foundation-m1`)

### Deferred, triaged as "stays deferred" by the final whole-branch review

**Storage**
- `resetAll()` lacks the try/catch that `saveState()` has, so it would propagate in a blocked-storage environment. Exported but called from nowhere yet. Give it the guard when `/settings` is built.
- The v0 migration now also writes a `epas.v1.unreadable.<timestamp>` salvage copy, a side effect of the `migrated !== parsed` guard added in the final fix wave. Harmless and arguably safer. No test covers it.

**Test tightening, all on code that is already correct**
- `gradeItem` has no regression test for an `order` response longer than `steps`, for an mcq string-vs-number (`'1'` against answer `1`), or for `null` as a response.
- `measure` has no test pinning `beep` on the ohms-mode shorted-resistor path, and none for diode-in-ohms mode.
- The healthy-resistor test is a range check that does not pin `GOOD_OFFSET` tightly, and the drift test round-trips through the display string rather than checking resistance directly.

**UI**
- `Quiz.submit()` has no explicit `if (submitted) return` guard. Unreachable today because the button unmounts, but it would matter after a refactor.
- The catch-all route copy says "coming in a later version", which is accurate for `/labs` and `/progress` but misleading for a genuine 404. Revisit when those routes land.
- ~~The `order` question shuffles by reversing the authored steps.~~ **Resolved in Plan 2.** The reverse presented the pool as the exact inverse of the answer, so the item could be solved bottom-up without reading it. `shuffleSteps` in `src/ui/Quiz.tsx` now interleaves odd-indexed steps before even-indexed ones: still deterministic for every student, with no such shortcut.
- Several radii sit off the 14/10/pill scale: the logo chip at 7, the meter screen at 7, progress bars at 2. `DESIGN.md` section 3 was amended to permit smaller radii on decorative sub-elements rather than churning the code. Revisit if the scale is ever tightened.

### Load-bearing for later plans

- **`SimEvent.onEvent` is never wired.** `BlockRenderer` mounts interactives without passing `onEvent`, so the `progress` and `attempt` events go nowhere and only the aggregate `recordSim` survives. Per-probe data is lost. The export in Plan 3 needs this wired, or it needs to accept that only aggregates exist.
- **Repeat runs append duplicate records.** Re-taking a quiz or re-running a simulation appends more rows. Legitimate as "attempts", but the export must decide first, best, or last, and nothing currently marks which run is which.
- **`zustand` and `@phosphor-icons/react` are dependencies with zero imports.** Tree-shaken from the bundle. Either use them in Plan 2 or drop them.
- **Lesson ids are not module-unique.** All three M1 lessons use `id: 'l1'`, unique only within their outcome. Anything keying lessons globally must use `outcomeId + lessonId`.
- **`match` and `hotspot` quiz kinds do not exist yet.** Deliberately deferred from the content model; the assessment layer in Plan 3 adds them.
- **The three simulations record on different triggers.** `multimeter` writes one row when all five components have been judged. `psu` writes a row on every Test press, with `solved` true or false. `troubleshoot` writes one row when the student names a fault, correct or not. An export must not average `score` across simIds without accounting for this, and should use `evidence.solved` rather than a non-zero score to decide whether a psu attempt succeeded.
- **`simId` alone no longer identifies an exercise.** Module 4 embeds `troubleshoot` twice, with the `flat-iron` and `lamp` scenarios. An export must key on `evidence.scenario` or `evidence.activity` as well as `simId` and `moduleId`.
- **"Did the student succeed" is encoded four different ways.** `troubleshoot` writes `evidence.correct`, `psu` writes `evidence.solved`, `multimeter` means success by `score === 1`, and `match` and `hotspot` mean it by `evidence.wrong.length === 0`. Read the right field per simId; do not compare `score` across them.
- **A missing row is not proof of no engagement.** `match` and `hotspot` write nothing until every item is answered, so a partial attempt leaves no row at all. `psu` writes a row per Test press, while the other four write once.

### Open for the teacher, not for code

- **Every module ships `teacherReviewed: false`** and the UI shows an unreviewed warning until it is cleared. M1's `lo3` contains a capacitor-discharge procedure describing a lethal hazard. That content must be checked by the teacher before the flag is flipped. This is the one item in the project that cannot be resolved by an agent.
