import { describe, expect, it } from 'vitest'
import type { BankItem } from '../src/lib/types'
import { BANK, bankFor } from '../src/content/bank'
import { allModules } from '../src/content'

const modules = allModules()

describe('the item bank', () => {
  // Pinned, not just non-zero: a refactor that dropped a module file would
  // otherwise leave every loop below quietly running on a shorter bank.
  it('holds two items for each of the 28 competencies', () => {
    expect(BANK.length).toBe(56)
  })

  it('covers every competency of every module', () => {
    for (const m of modules) {
      for (const c of m.competencies) {
        const forC = BANK.filter(i => i.moduleId === m.id && i.competency === c)
        expect(forC.map(i => i.form).sort(), `${m.id}: ${c}`).toEqual(['A', 'B'])
      }
    }
  })

  it('gives every item a globally unique id', () => {
    const ids = BANK.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('does not reuse an id from a formative quiz item', () => {
    const formative = new Set<string>()
    for (const m of modules) for (const o of m.outcomes) for (const q of o.quiz) formative.add(q.id)
    for (const i of BANK) expect(formative.has(i.id), `${i.id} collides with a formative item`).toBe(false)
  })

  it('names a module that exists', () => {
    const ids = new Set(modules.map(m => m.id))
    for (const i of BANK) expect(ids.has(i.moduleId), `${i.id} names module ${i.moduleId}`).toBe(true)
  })

  it('matches a competency of its own module character for character', () => {
    for (const i of BANK) {
      const m = modules.find(x => x.id === i.moduleId)
      expect(m, `${i.id}`).toBeDefined()
      expect(m!.competencies, `${i.id}: ${JSON.stringify(i.competency)}`).toContain(i.competency)
    }
  })

  // The export bridges an attempt to its column through the competency text
  // when a legacy record carries no usable bank id. Two competencies sharing
  // wording would file one module's gain under the other module's column, and
  // the resulting row would look entirely normal.
  it('gives no two competencies the same wording', () => {
    const byText = new Map<string, string>()
    for (const i of BANK) {
      const seen = byText.get(i.competency)
      expect(seen === undefined || seen === i.pair,
        `${i.competency} is used by both ${seen} and ${i.pair}`).toBe(true)
      byText.set(i.competency, i.pair)
    }
  })

  it('gives every item four options and an answer that indexes them', () => {
    for (const i of BANK) {
      expect(i.options.length, i.id).toBe(4)
      expect(Number.isInteger(i.answer), `${i.id} answer is not a whole number`).toBe(true)
      expect(i.answer, i.id).toBeGreaterThanOrEqual(0)
      expect(i.answer, i.id).toBeLessThan(4)
    }
  })

  it('never repeats an option inside one item', () => {
    for (const i of BANK) expect(new Set(i.options).size, i.id).toBe(4)
  })

  // The whole design rests on this: every competency gets one A item and
  // one matched B item, so the two forms are comparable.
  it('pairs exactly one A item with one B item', () => {
    const pairs = new Map<string, BankItem[]>()
    for (const i of BANK) pairs.set(i.pair, [...(pairs.get(i.pair) ?? []), i])
    for (const [pair, items] of pairs) {
      expect(items.length, `pair ${pair}`).toBe(2)
      expect(items.map(i => i.form).sort(), `pair ${pair}`).toEqual(['A', 'B'])
      expect(items[0]!.competency, `pair ${pair} spans two competencies`).toBe(items[1]!.competency)
      expect(items[0]!.moduleId, `pair ${pair} spans two modules`).toBe(items[1]!.moduleId)
    }
  })

  it('asks a different question on each side of a pair', () => {
    const pairs = new Map<string, BankItem[]>()
    for (const i of BANK) pairs.set(i.pair, [...(pairs.get(i.pair) ?? []), i])
    for (const [pair, items] of pairs) {
      expect(items[0]!.stem, `pair ${pair} repeats its stem`).not.toBe(items[1]!.stem)
    }
  })

  it('draws a form with one item per competency covered', () => {
    for (const m of modules) {
      for (const form of ['A', 'B'] as const) {
        const drawn = bankFor(m.id, form)
        if (drawn.length === 0) continue
        const comps = drawn.map(i => i.competency)
        expect(new Set(comps).size, `${m.id} form ${form} repeats a competency`).toBe(comps.length)
      }
    }
  })

  it('uses no long dashes in anything a student reads', () => {
    for (const i of BANK) {
      const copy = [i.stem, ...i.options].join(' ')
      // U+2014 em dash, U+2013 en dash, U+2015 horizontal bar.
      expect(/[–—―]/.test(copy), `${i.id}`).toBe(false)
    }
  })

  // Options render in authored order, so keys that bunch make the test
  // answerable without reading it. This shipped once at 43 of 45 on B.
  it('spreads the answer keys across the options', () => {
    const counts = [0, 0, 0, 0]
    for (const i of BANK) counts[i.answer] = (counts[i.answer] ?? 0) + 1

    // Every option must be the answer somewhere, at any bank size.
    for (let k = 0; k < 4; k++) {
      expect(counts[k], `option ${'ABCD'[k]} is never the answer`).toBeGreaterThan(0)
    }

    // A share bound is meaningless on a handful of items and would make
    // this suite fail on the half-built bank between authoring tasks, so
    // it applies once the bank is big enough for the ratio to mean anything.
    if (BANK.length >= 24) {
      for (let k = 0; k < 4; k++) {
        const share = counts[k]! / BANK.length
        expect(share, `option ${'ABCD'[k]} holds ${counts[k]}/${BANK.length}`).toBeGreaterThan(0.15)
        expect(share, `option ${'ABCD'[k]} holds ${counts[k]}/${BANK.length}`).toBeLessThan(0.4)
      }
    }
  })

  // A student who reads nothing and picks the longest option must not score
  // well. This was once true of 48 of the 56 items, on both forms equally,
  // which made a longest-picker indistinguishable from a real learner.
  it('does not make the key the longest option often enough to be a strategy', () => {
    let uniquelyLongest = 0
    for (const i of BANK) {
      const lengths = i.options.map((o) => o.length)
      const longest = Math.max(...lengths)
      if (lengths[i.answer] === longest && lengths.filter((l) => l === longest).length === 1) {
        uniquelyLongest++
      }
    }
    const share = uniquelyLongest / BANK.length
    expect(share, `the key is the longest option in ${uniquelyLongest}/${BANK.length} items`).toBeLessThan(0.4)
  })

  // A student sits ONE form, not the bank. Balancing the keys across all 56
  // let the two forms cancel each other out: form A held 14 percent of its
  // keys on option D and form B held 36 percent, so pressing D twenty-eight
  // times scored 14 percent on the pre-test and 36 percent on the post-test,
  // and the app credited that as seven competencies gained.
  it('spreads the keys across the options within each form', () => {
    for (const form of ['A', 'B'] as const) {
      const items = BANK.filter((i) => i.form === form)
      const counts = [0, 0, 0, 0]
      for (const i of items) counts[i.answer] = (counts[i.answer] ?? 0) + 1
      for (let k = 0; k < 4; k++) {
        const share = counts[k]! / items.length
        const where = `form ${form}: option ${'ABCD'[k]} holds ${counts[k]}/${items.length}`
        expect(share, where).toBeGreaterThan(0.15)
        expect(share, where).toBeLessThan(0.35)
      }
    }
  })

  // The same asymmetry in the other dimension: if the key is the shortest
  // option far more often on one form than the other, "pick the shortest"
  // scores differently on the pre-test and the post-test and the difference
  // is reported as learning.
  it('does not let option length pick the answer in either form', () => {
    const shares: Record<string, Record<string, number>> = { longest: {}, shortest: {} }
    for (const form of ['A', 'B'] as const) {
      const items = BANK.filter((i) => i.form === form)
      for (const pick of ['longest', 'shortest'] as const) {
        const n = items.filter((i) => {
          const lengths = i.options.map((o) => o.length)
          const target = pick === 'longest' ? Math.max(...lengths) : Math.min(...lengths)
          return lengths[i.answer] === target && lengths.filter((l) => l === target).length === 1
        }).length
        const share = n / items.length
        shares[pick]![form] = share
        expect(share, `form ${form}: the ${pick} option is the key in ${n}/${items.length}`).toBeLessThan(0.35)
      }
    }
    for (const pick of ['longest', 'shortest'] as const) {
      const gap = Math.abs(shares[pick]!.A! - shares[pick]!.B!)
      expect(gap, `the ${pick}-option tell differs by ${gap.toFixed(2)} between the forms`).toBeLessThan(0.15)
    }
  })

  it('keeps every key close in length to its own distractors', () => {
    for (const i of BANK) {
      const others = i.options.filter((_, n) => n !== i.answer).map((o) => o.length)
      const mean = others.reduce((a, b) => a + b, 0) / others.length
      const ratio = i.options[i.answer]!.length / mean
      expect(ratio, `${i.id} key is ${ratio.toFixed(2)}x its distractors`).toBeLessThan(2.2)
    }
  })
})
