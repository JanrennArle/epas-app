import { gradeItem, scoreQuiz } from '../src/lib/quiz'
import type { QuizItem } from '../src/lib/types'

const mcq: QuizItem = { kind: 'mcq', id: 'a', competency: 'C1', stem: '', options: ['x', 'y'], answer: 1, rationale: ['', ''] }
const tf: QuizItem = { kind: 'truefalse', id: 'b', competency: 'C1', stem: '', answer: true, rationale: '' }
const ord: QuizItem = { kind: 'order', id: 'c', competency: 'C2', stem: '', steps: ['one', 'two', 'three'] }

describe('gradeItem', () => {
  it('marks the correct multiple choice index', () => {
    expect(gradeItem(mcq, 1)).toBe(true)
    expect(gradeItem(mcq, 0)).toBe(false)
  })

  it('marks true or false', () => {
    expect(gradeItem(tf, true)).toBe(true)
    expect(gradeItem(tf, false)).toBe(false)
  })

  it('marks an ordering only when the whole sequence matches', () => {
    expect(gradeItem(ord, ['one', 'two', 'three'])).toBe(true)
    expect(gradeItem(ord, ['one', 'three', 'two'])).toBe(false)
    expect(gradeItem(ord, ['one', 'two'])).toBe(false)
  })

  it('treats a missing or malformed response as incorrect rather than throwing', () => {
    expect(gradeItem(mcq, undefined)).toBe(false)
    expect(gradeItem(ord, 'not an array')).toBe(false)
  })
})

describe('scoreQuiz', () => {
  it('totals correct answers and breaks them down by competency', () => {
    const r = scoreQuiz([mcq, tf, ord], { a: 1, b: false, c: ['one', 'two', 'three'] })
    expect(r.correct).toBe(2)
    expect(r.total).toBe(3)
    expect(r.perCompetency.C1).toEqual({ correct: 1, total: 2 })
    expect(r.perCompetency.C2).toEqual({ correct: 1, total: 1 })
  })

  it('counts unanswered items as incorrect', () => {
    const r = scoreQuiz([mcq, tf], {})
    expect(r.correct).toBe(0)
    expect(r.total).toBe(2)
  })
})
