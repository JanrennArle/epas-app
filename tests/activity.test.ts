import { scoreActivity } from '../src/lib/activity'
import type { ActivityItem } from '../src/lib/activity'

const items: ActivityItem[] = [
  { id: 'a', prompt: 'Which part heats the plate?', answer: 'element' },
  { id: 'b', prompt: 'Which part limits the temperature?', answer: 'thermostat' },
  { id: 'c', prompt: 'Which part cuts power permanently on overheat?', answer: 'fuse' },
]

describe('scoreActivity', () => {
  it('scores a fully correct set', () => {
    const r = scoreActivity(items, { a: 'element', b: 'thermostat', c: 'fuse' })
    expect(r.correct).toBe(3)
    expect(r.total).toBe(3)
    expect(r.wrong).toEqual([])
  })

  it('names the items answered wrongly', () => {
    const r = scoreActivity(items, { a: 'element', b: 'fuse', c: 'thermostat' })
    expect(r.correct).toBe(1)
    expect(r.wrong).toEqual(['b', 'c'])
  })

  it('counts an unanswered item as wrong rather than skipping it', () => {
    const r = scoreActivity(items, { a: 'element' })
    expect(r.correct).toBe(1)
    expect(r.total).toBe(3)
    expect(r.wrong).toEqual(['b', 'c'])
  })

  it('ignores responses for items that do not exist', () => {
    const r = scoreActivity(items, { a: 'element', b: 'thermostat', c: 'fuse', zzz: 'x' })
    expect(r.correct).toBe(3)
    expect(r.total).toBe(3)
  })

  it('handles an empty item list without dividing by anything', () => {
    const r = scoreActivity([], {})
    expect(r).toEqual({ correct: 0, total: 0, wrong: [] })
  })

  it('does not throw on a malformed response value', () => {
    const bad = { a: undefined as unknown as string, b: '', c: 'fuse' }
    expect(() => scoreActivity(items, bad)).not.toThrow()
    expect(scoreActivity(items, bad).correct).toBe(1)
  })

  it('is order independent for the same answers', () => {
    const one = scoreActivity(items, { a: 'element', b: 'thermostat', c: 'fuse' })
    const two = scoreActivity(items, { c: 'fuse', b: 'thermostat', a: 'element' })
    expect(one).toEqual(two)
  })
})
