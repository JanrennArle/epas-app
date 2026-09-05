import type { ComponentType } from 'react'
import type { InteractiveProps } from './types'
import { MultimeterTrainer } from './MultimeterTrainer'
import { PowerSupplySim } from './PowerSupplySim'

/**
 * Every simulation in the app. Adding one is a single entry here plus the
 * component file; nothing else in the app needs to know it exists.
 */
export const SIMS: Record<string, ComponentType<InteractiveProps>> = {
  multimeter: MultimeterTrainer,
  psu: PowerSupplySim,
}

export function getSim(id: string): ComponentType<InteractiveProps> | undefined {
  return SIMS[id]
}
