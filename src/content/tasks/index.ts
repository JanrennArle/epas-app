import type { PerformanceTask } from '../../lib/types'
import { t1 } from './t1'
import { t2 } from './t2'
import { t3 } from './t3'
import { t4 } from './t4'
import { t5 } from './t5'
import { t6 } from './t6'
import { t7 } from './t7'
import { t8 } from './t8'

export const TASKS: PerformanceTask[] = [t1, t2, t3, t4, t5, t6, t7, t8]

export function getTask(id: string): PerformanceTask | undefined {
  return TASKS.find(t => t.id === id)
}
