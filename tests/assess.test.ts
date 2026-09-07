import { describe, expect, it } from 'vitest'
import type { BankItem } from '../src/lib/types'
import type { Attempt } from '../src/lib/store'
import { competencyGains, gradeForm } from '../src/lib/assess'

function item(over: Partial<BankItem> = {}): BankItem {
  return {
    id: 'i1', moduleId: 'm1', competency: 'C1', form: 'A', pair: 'm1-c1',
    stem: 'S', options: ['a', 'b', 'c', 'd'], answer: 2, ...over,
  }
}

function attempt(over: Partial<Attempt> = {}): Attempt {
  return {
    itemId: 'i1', moduleId: 'm1', competency: 'C1', correct: true,
    at: '2026-01-01T00:00:00.000Z', context: 'pretest', ...over,
  }
}

describe('gradeForm', () => {
  it('counts a correct response', () => {
    const r = gradeForm([item()], { i1: 2 })
    expect(r.correct).toBe(1)
    expect(r.total).toBe(1)
  })

  it('counts a wrong response', () => {
    expect(gradeForm([item()], { i1: 0 }).correct).toBe(0)
  })

  it('treats an unanswered item as wrong rather than skipping it', () => {
    const r = gradeForm([item()], {})
    expect(r.correct).toBe(0)
    expect(r.total).toBe(1)
  })

  it('reports the outcome per competency', () => {
    const items = [item(), item({ id: 'i2', competency: 'C2', answer: 1 })]
    const r = gradeForm(items, { i1: 2, i2: 3 })
    expect(r.byCompetency).toEqual({ C1: true, C2: false })
  })

  it('scores an empty form as zero of zero rather than dividing by zero', () => {
    const r = gradeForm([], {})
    expect(r).toEqual({ correct: 0, total: 0, byCompetency: {} })
  })
})

describe('competencyGains', () => {
  it('reports a competency the student gained', () => {
    const pre = [attempt({ correct: false })]
    const post = [attempt({ correct: true, context: 'posttest' })]
    expect(competencyGains(pre, post)).toEqual([
      { competency: 'C1', pre: false, post: true, ordered: true, gained: true },
    ])
  })

  it('does not count a competency already held before the lesson', () => {
    const g = competencyGains([attempt({ correct: true })], [attempt({ correct: true, context: 'posttest' })])
    expect(g[0]?.gained).toBe(false)
  })

  it('records a competency that was lost', () => {
    const g = competencyGains([attempt({ correct: true })], [attempt({ correct: false, context: 'posttest' })])
    expect(g[0]).toEqual({ competency: 'C1', pre: true, post: false, ordered: true, gained: false })
  })

  it('reports null for a side that was never taken', () => {
    expect(competencyGains([attempt()], [])).toEqual([
      { competency: 'C1', pre: true, post: null, ordered: true, gained: false },
    ])
  })

  it('covers every competency named on either side', () => {
    const pre = [attempt({ competency: 'C1' })]
    const post = [attempt({ competency: 'C2', context: 'posttest' })]
    expect(competencyGains(pre, post).map(g => g.competency)).toEqual(['C1', 'C2'])
  })

  it('returns competencies in a stable order', () => {
    const pre = [attempt({ competency: 'Zed' }), attempt({ competency: 'Alpha' })]
    expect(competencyGains(pre, []).map(g => g.competency)).toEqual(['Alpha', 'Zed'])
  })

  // Without this, `after === true && before !== true` passes the whole
  // suite, and that reading counts a competency with no baseline as a gain.
  it('does not count a competency the student never sat before the lesson', () => {
    const g = competencyGains([], [attempt({ correct: true, context: 'posttest' })])
    expect(g[0]?.pre).toBe(null)
    expect(g[0]?.gained).toBe(false)
  })

  // Without this, dropping `&& after === true` passes the whole suite.
  it('does not count a competency that is still wrong afterwards', () => {
    const g = competencyGains(
      [attempt({ correct: false })],
      [attempt({ correct: false, context: 'posttest' })],
    )
    expect(g[0]?.gained).toBe(false)
  })

  it('takes the last attempt when one side names a competency twice', () => {
    const g = competencyGains(
      [attempt({ itemId: 'i1', correct: true }), attempt({ itemId: 'i2', correct: false })],
      [attempt({ correct: true, context: 'posttest' })],
    )
    expect(g[0]?.pre).toBe(false)
    expect(g[0]?.gained).toBe(true)
  })

  // A student who sits the post-test, sees their gain, then retakes the
  // easier pre-test and answers badly would otherwise raise their own
  // reported figure.
  it('does not count a pre-test taken after the post-test', () => {
    const g = competencyGains(
      [attempt({ correct: false, at: '2026-03-01T00:00:00.000Z' })],
      [attempt({ correct: true, context: 'posttest', at: '2026-02-01T00:00:00.000Z' })],
    )
    expect(g[0]?.ordered).toBe(false)
    expect(g[0]?.gained).toBe(false)
  })

  it('still counts a pair sat in the right order', () => {
    const g = competencyGains(
      [attempt({ correct: false, at: '2026-02-01T00:00:00.000Z' })],
      [attempt({ correct: true, context: 'posttest', at: '2026-03-01T00:00:00.000Z' })],
    )
    expect(g[0]?.ordered).toBe(true)
    expect(g[0]?.gained).toBe(true)
  })

  it('returns nothing when neither side was taken', () => {
    expect(competencyGains([], [])).toEqual([])
  })
})
