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
