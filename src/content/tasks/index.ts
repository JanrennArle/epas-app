import type { PerformanceTask } from '../../lib/types'
import { t1 } from './t1'
import { t2 } from './t2'

export const TASKS: PerformanceTask[] = [t1, t2]

export function getTask(id: string): PerformanceTask | undefined {
  return TASKS.find(t => t.id === id)
}
