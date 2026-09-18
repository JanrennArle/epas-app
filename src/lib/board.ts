/**
 * The shadow board: which tools hang, and what the student should do next.
 * Pure and total, like every engine in this folder.
 */
export interface ToolState {
  moduleId: string
  done: number
  total: number
  fraction: number
  hung: boolean
}

export function toolStates(
  modules: { id: string; outcomes: { id: string }[] }[],
  progress: Record<string, { completedOutcomes: string[] } | undefined>,
): ToolState[] {
  return modules.map(m => {
    const own = new Set(m.outcomes.map(o => o.id))
    const completed = new Set((progress[m.id]?.completedOutcomes ?? []).filter(id => own.has(id)))
    const total = own.size
    const done = completed.size
    return { moduleId: m.id, done, total, fraction: total ? done / total : 0, hung: total > 0 && done === total }
  })
}

export function nextAction(tools: ToolState[]): { moduleId: string; verb: 'Start' | 'Continue' } | null {
  const next = tools.find(t => t.total > 0 && !t.hung)
  return next ? { moduleId: next.moduleId, verb: next.done > 0 ? 'Continue' : 'Start' } : null
}
