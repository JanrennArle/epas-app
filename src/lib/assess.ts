import type { Attempt } from './store'
import type { BankItem } from './types'

export interface FormResult {
  correct: number
  total: number
  /** True where the student answered that competency's item correctly. */
  byCompetency: Record<string, boolean>
}

/**
 * Grades one form. An unanswered item counts as wrong rather than being
 * dropped, because a blank on a test is not the same as a shorter test and
 * the denominator has to stay comparable between the two forms.
 */
export function gradeForm(items: BankItem[], responses: Record<string, unknown>): FormResult {
  const byCompetency: Record<string, boolean> = {}
  let correct = 0
  for (const it of items) {
    const ok = responses[it.id] === it.answer
    if (ok) correct++
    byCompetency[it.competency] = ok
  }
  return { correct, total: items.length, byCompetency }
}

export interface Gain {
  competency: string
  /** Null where that side was never taken. */
  pre: boolean | null
  post: boolean | null
  /** Wrong before the teaching and right after it. */
  gained: boolean
}

/**
 * Per-competency gain across a matched pair of forms. `gained` is
 * deliberately narrow: it means the student did not have the competency
 * and now does. A competency already held before the lesson is not a gain,
 * and reporting it as one would inflate the result.
 */
export function competencyGains(pre: Attempt[], post: Attempt[]): Gain[] {
  const preBy = new Map<string, boolean>()
  for (const a of pre) preBy.set(a.competency, a.correct)
  const postBy = new Map<string, boolean>()
  for (const a of post) postBy.set(a.competency, a.correct)

  const names = [...new Set([...preBy.keys(), ...postBy.keys()])].sort()
  return names.map(competency => {
    const before = preBy.has(competency) ? preBy.get(competency)! : null
    const after = postBy.has(competency) ? postBy.get(competency)! : null
    return { competency, pre: before, post: after, gained: before === false && after === true }
  })
}
