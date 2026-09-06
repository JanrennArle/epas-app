import type { ComponentType } from 'react'
import type { InteractiveProps } from './types'
import { HotspotActivity } from './HotspotActivity'
import { MatchActivity } from './MatchActivity'
import { MultimeterTrainer } from './MultimeterTrainer'
import { PowerSupplySim } from './PowerSupplySim'
import { SystemTroubleshooter } from './SystemTroubleshooter'

/**
 * Every simulation in the app. Adding one is a single entry here plus the
 * component file; nothing else in the app needs to know it exists.
 */
export const SIMS: Record<string, ComponentType<InteractiveProps>> = {
  hotspot: HotspotActivity,
  match: MatchActivity,
  multimeter: MultimeterTrainer,
  psu: PowerSupplySim,
  troubleshoot: SystemTroubleshooter,
}

export function getSim(id: string): ComponentType<InteractiveProps> | undefined {
  return SIMS[id]
}
