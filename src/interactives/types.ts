export type SimEvent =
  | { type: 'progress'; pct: number }
  | { type: 'attempt'; correct: boolean }
  | { type: 'complete'; score: number; evidence: Record<string, unknown> }

export interface InteractiveProps {
  moduleId: string
  config?: Record<string, unknown>
  onEvent?: (e: SimEvent) => void
}
