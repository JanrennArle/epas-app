import type { PerformanceTask } from '../../lib/types'
import { t1 } from './t1'
import { t2 } from './t2'
import { t3 } from './t3'
import { t4 } from './t4'

export const TASKS: PerformanceTask[] = [t1, t2, t3, t4]

export function getTask(id: string): PerformanceTask | undefined {
  return TASKS.find(t => t.id === id)
}
