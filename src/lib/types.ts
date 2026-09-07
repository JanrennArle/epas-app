export type Block =
  | { kind: 'text'; md: string }
  | { kind: 'figure'; src: string; alt: string; caption?: string }
  | { kind: 'safety'; md: string }
  | { kind: 'note'; md: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'interactive'; simId: string; config?: Record<string, unknown> }

export type QuizItem =
  | { kind: 'mcq'; id: string; competency: string; stem: string; options: string[]; answer: number; rationale: string[] }
  | { kind: 'truefalse'; id: string; competency: string; stem: string; answer: boolean; rationale: string }
  | { kind: 'order'; id: string; competency: string; stem: string; steps: string[] }

export interface Lesson {
  id: string
  title: string
  blocks: Block[]
}

export interface LearningOutcome {
  id: string
  title: string
  lessons: Lesson[]
  quiz: QuizItem[]
}

export interface Module {
  id: string
  week: string
  title: string
  tint: string
  competencies: string[]
  teacherReviewed: boolean
  outcomes: LearningOutcome[]
}

/** Which of the two matched forms an item belongs to. A is the pre-test. */
export type FormId = 'A' | 'B'

/**
 * A pre-test or post-test item. Always multiple choice, so the two forms
 * match on format as well as on competency. Carries no rationale: showing
 * a student why an answer was wrong between the pre-test and the post-test
 * would teach them, which is exactly what the gain is trying to measure.
 */
export interface BankItem {
  id: string
  moduleId: string
  competency: string
  form: FormId
  /** Matched pair key. The A and B items for one competency share it. */
  pair: string
  stem: string
  options: string[]
  answer: number
}
