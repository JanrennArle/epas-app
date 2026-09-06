import { describe, expect, it } from 'vitest'
import { allModules } from '../src/content'

type Mcq = { id: string; answer: number; options: string[]; rationale: string[] }

const mcqs: Mcq[] = []
for (const m of allModules()) {
  for (const o of m.outcomes) {
    for (const q of o.quiz) {
      if (q.kind === 'mcq') mcqs.push(q)
    }
  }
}

describe('multiple choice answer keys', () => {
  it('finds the multiple choice items', () => {
    expect(mcqs.length).toBeGreaterThan(0)
  })

  // The keyed option and its explanation must stay paired. Every correct
  // rationale opens with "Correct", so a key pointing at a rationale that
  // does not is a key and rationale that have drifted apart.
  it('points each key at the rationale that explains it', () => {
    for (const q of mcqs) {
      const chosen = q.rationale[q.answer]
      expect(chosen, `${q.id} has no rationale at index ${q.answer}`).toBeDefined()
      expect(chosen!.startsWith('Correct'), `${q.id}: rationale[${q.answer}] is ${JSON.stringify(chosen)}`).toBe(true)
    }
  })

  // And no other rationale may claim to be the correct one.
  it('marks exactly one rationale correct per item', () => {
    for (const q of mcqs) {
      const marked = q.rationale.filter((r) => r.startsWith('Correct')).length
      expect(marked, `${q.id} marks ${marked} rationales correct`).toBe(1)
    }
  })

  // Options are rendered in authored order, so a key that always lands on
  // the same option makes every quiz answerable without reading it. This
  // shipped once: 43 of 45 items keyed to option B.
  it('spreads the keys across the options', () => {
    const counts = [0, 0, 0, 0]
    for (const q of mcqs) counts[q.answer] = (counts[q.answer] ?? 0) + 1
    for (let i = 0; i < 4; i++) {
      const share = counts[i]! / mcqs.length
      expect(share, `option ${'ABCD'[i]} holds ${counts[i]}/${mcqs.length} keys`).toBeGreaterThan(0.15)
      expect(share, `option ${'ABCD'[i]} holds ${counts[i]}/${mcqs.length} keys`).toBeLessThan(0.4)
    }
  })

  it('gives every item four options and four rationales', () => {
    for (const q of mcqs) {
      expect(q.options.length, q.id).toBe(4)
      expect(q.rationale.length, q.id).toBe(4)
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0)
      expect(q.answer, q.id).toBeLessThan(4)
    }
  })
})
