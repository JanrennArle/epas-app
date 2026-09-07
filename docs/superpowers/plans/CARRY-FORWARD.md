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
- **The six simulations record on different triggers.** `multimeter` writes one row when all five components have been judged. `psu` writes a row on every Test press, with `solved` true or false. `troubleshoot` writes one row when the student names a fault, correct or not. An export must not average `score` across simIds without accounting for this, and should use `evidence.solved` rather than a non-zero score to decide whether a psu attempt succeeded. sequence writes one row on Check, only once every position is filled, and records its per-item detail as an ordered chain array rather than the responses map that match and hotspot use.
- **`simId` alone no longer identifies an exercise.** There are now five troubleshoot embeds across four modules and two sequence embeds across two. An export must key on `evidence.scenario` or `evidence.activity` as well as `simId` and `moduleId`.
- **"Did the student succeed" is encoded four different ways.** `troubleshoot` writes `evidence.correct`, `psu` writes `evidence.solved`, `multimeter` means success by `score === 1`, and `match` and `hotspot` mean it by `evidence.wrong.length === 0`. Read the right field per simId; do not compare `score` across them.
- **A missing row is not proof of no engagement.** `match` and `hotspot` write nothing until every item is answered, so a partial attempt leaves no row at all. `psu` writes a row per Test press, while the other four write once.

### Open for the teacher, not for code

- **Every module ships `teacherReviewed: false`** and the UI shows an unreviewed warning until it is cleared. M1's `lo3` contains a capacitor-discharge procedure describing a lethal hazard. That content must be checked by the teacher before the flag is flipped. This is the one item in the project that cannot be resolved by an agent.

## From plan 5 (m8-m9)

- **The `motor-control` scenario's `coil` decoy is mislabelled and unreachable.** `src/content/scenarios/motor-control.ts` declares a fault `coil` labelled "Open relay coil", but the reading `tp-coil` returns for it is "Coil is energised when it should not be", which describes a stuck output rather than an open coil. An open coil is found with an ohmmeter and cannot be energised at all, and at this test point it would in fact read the same 0.0 V as a healthy dropped-out relay, so `tp-coil` cannot distinguish it. The decoy never fires because `actualFault` is fixed to `contacts`, so it touches neither `readingAt` nor scoring. It also now contradicts M9 lo4's lesson text, which teaches the open-coil and welded-contact failure modes correctly. **Anyone reusing this scenario with a different `actualFault` must fix the fault label, the reading, or both before doing so.** Raised three times across Tasks 2 and 5+6 and deferred each time as dead code.

- **The power-state defect is systematic, not incidental.** Six shipped instances across five plans: the flat iron pilot lamp, the M5 CCTV step order, the CCTV scenario safety gate, the M8 amplifier step order, `m9-lo4-q3`, and `m9-lo2-q3`. Every one was a `steps` array or an `order` quiz that isolated the supply and then required a live measurement, or the reverse. Two of the six survived a task review that had been explicitly warned about the pattern. **Any future task that authors a `steps` array or an `order` quiz touching a powered appliance must have its power state written out step by step, and every transition must be named in the step text itself** ("Restore the supply and…", "Isolate again and…"). The house pattern is established in `m9-lo2-q3`, `m9-lo4-q3` and `m9-lo6-q3`. A guard test cannot catch this, because power state is not encoded in the data.

- **A student can score a perfect diagnosis with zero tests.** `src/interactives/SystemTroubleshooter.tsx:112` lets the student name a fault before running any test point, and `src/lib/diagnose.ts` floors the penalty rather than requiring evidence, so a 1-in-5 guess scores 1.00 in all eight scenarios. This is the same class of problem as the answer-key bunching fixed in `730dd44`: a score obtainable without doing the work, in an app whose purpose is to measure whether the work was done. **This should be settled in the assessment plan (Plan 6), not left to the content plans**, because the fix is a design decision about what the troubleshooter is scoring: requiring at least one test before accusing, scaling the score by evidence gathered, or recording tests-run alongside the score so the teacher can see it in the export. Raised by the final whole-branch review of `feat/m8-m9` and deferred deliberately.

## From plan 6 (assessment)

- **Every answer key ships in the bundle, and the store is hand editable.** All 56 pre-test and post-test keys are readable in `dist/assets/index-*.js`, and `localStorage` key `epas.v1` can be edited in dev tools. This is inherent to an app with no server that must work offline on a lab PC, and no amount of obfuscation changes it for a determined student. **It belongs in the research paper's limitations section, not in a future plan**: the mitigation is procedural, meaning the teacher invigilates the pre-test and post-test the same way they would a paper one. Raised by the final whole-branch review of `feat/assessment`.

- **Eliminate-the-absolute still returns a small edge.** Absolute qualifiers ("always", "never", "only", "cannot") appear in about 30 percent of distractors against about 11 percent of keys, so a student who eliminates absolutely-worded options and guesses among the rest scores around 33 percent against a 25 percent baseline. The single item that was solvable outright by that strategy is fixed. The residual 8 point edge is far below the three exploits already closed (key bunching, longest-option, per-form key imbalance) and rewriting fifty distractors was judged disproportionate. **If a later plan touches the bank, reduce absolutes in distractors rather than adding them to keys.**

- **The exploit family is the thing to check, not the individual exploit.** Four separate ways to score without reading were found and fixed on this branch: keys bunched on one option, the key being the longest option in 48 of 56 items, pairs mismatched in difficulty, and keys balanced across the bank but not within each form. They are all the same defect: a surface feature of the items correlating with correctness. **Any future change to the item bank should be measured for a fifth**, across position, length, phrasing, grammatical agreement with the stem, and any property that differs systematically between form A and form B. `tests/bank.test.ts` guards the four that were found; it cannot guard the one nobody has looked for.
