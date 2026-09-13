import type { PerformanceTask } from '../../lib/types'

/**
 * The eight Budget of Work performance tasks, in the order the course meets
 * them. Alternating individual and group is the Budget of Work's own pattern,
 * not ours.
 */
export const TASKS: PerformanceTask[] = []

export function getTask(id: string): PerformanceTask | undefined {
  return TASKS.find(t => t.id === id)
}
