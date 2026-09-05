import type { QuizItem } from './types'

export interface QuizResult {
  correct: number
  total: number
  perCompetency: Record<string, { correct: number; total: number }>
}

export function gradeItem(item: QuizItem, response: unknown): boolean {
  switch (item.kind) {
    case 'mcq':
      return response === item.answer
    case 'truefalse':
      return response === item.answer
    case 'order':
      if (!Array.isArray(response)) return false
      if (response.length !== item.steps.length) return false
      return item.steps.every((s, i) => response[i] === s)
  }
}

export function scoreQuiz(
  items: QuizItem[],
  responses: Record<string, unknown>,
): QuizResult {
  const perCompetency: QuizResult['perCompetency'] = {}
  let correct = 0

  for (const item of items) {
    const ok = gradeItem(item, responses[item.id])
    if (ok) correct++
    const bucket = perCompetency[item.competency] ?? { correct: 0, total: 0 }
    bucket.total++
    if (ok) bucket.correct++
    perCompetency[item.competency] = bucket
  }

  return { correct, total: items.length, perCompetency }
}
