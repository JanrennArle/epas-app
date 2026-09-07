import { describe, expect, it } from 'vitest'
import type { BankItem } from '../src/lib/types'
import { BANK, bankFor } from '../src/content/bank'
import { allModules } from '../src/content'

const modules = allModules()

describe('the item bank', () => {
  it('has items', () => {
    expect(BANK.length).toBeGreaterThan(0)
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

  it('gives every item four options and an answer that indexes them', () => {
    for (const i of BANK) {
      expect(i.options.length, i.id).toBe(4)
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

  it('uses no em dashes in anything a student reads', () => {
    for (const i of BANK) {
      const copy = [i.stem, ...i.options].join(' ')
      expect(copy.includes('—'), `${i.id}`).toBe(false)
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
})
