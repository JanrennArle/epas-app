import { describe, expect, it } from 'vitest'
import { LIKERT, SURVEY, SURVEY_CATEGORIES } from '../src/content/survey'

describe('the evaluation instrument', () => {
  it('holds twenty items', () => {
    expect(SURVEY.length).toBe(20)
  })

  it('gives every category four items', () => {
    for (const c of SURVEY_CATEGORIES) {
      const n = SURVEY.filter((i) => i.category === c).length
      expect(n, `${c} has ${n} items`).toBe(4)
    }
  })

  it('uses no category outside the five declared', () => {
    for (const i of SURVEY) {
      expect(SURVEY_CATEGORIES, i.id).toContain(i.category)
    }
  })

  // The id is a CSV column name. A duplicate silently merges two questions
  // into one column and the merge is invisible in the output.
  it('gives every item a unique id', () => {
    const ids = SURVEY.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // `respondent` and `comments` share the survey record with the item ids.
  it('uses no id that collides with the two reserved keys', () => {
    for (const i of SURVEY) {
      expect(['respondent', 'comments'], i.id).not.toContain(i.id)
    }
  })

  it('offers a five point scale', () => {
    expect(LIKERT.length).toBe(5)
  })

  it('asks every item as a statement a respondent can agree with', () => {
    for (const i of SURVEY) {
      expect(i.text.endsWith('.'), `${i.id} does not end in a full stop`).toBe(true)
      expect(i.text.includes('?'), `${i.id} is phrased as a question`).toBe(false)
    }
  })

  it('uses no long dashes in anything a respondent reads', () => {
    for (const i of SURVEY) {
      expect(/[–—―]/.test(i.text), i.id).toBe(false)
    }
  })
})
