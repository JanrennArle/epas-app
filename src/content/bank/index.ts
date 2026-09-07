import type { BankItem, FormId } from '../../lib/types'
import { m1Bank } from './m1'
import { m2Bank } from './m2'
import { m3Bank } from './m3'
import { m4Bank } from './m4'
import { m5Bank } from './m5'
import { m6Bank } from './m6'
import { m7Bank } from './m7'
import { m8Bank } from './m8'

/**
 * Every pre-test and post-test item. Disjoint from the formative items in
 * src/content/m*.ts, which students meet inside the lessons: reusing those
 * here would measure whether they remember the lesson's own examples.
 */
export const BANK: BankItem[] = [
  ...m1Bank, ...m2Bank, ...m3Bank, ...m4Bank, ...m5Bank, ...m6Bank, ...m7Bank, ...m8Bank,
]

export function bankFor(moduleId: string, form: FormId): BankItem[] {
  return BANK.filter(i => i.moduleId === moduleId && i.form === form)
}
