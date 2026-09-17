import type { Icon } from '@phosphor-icons/react'
import {
  BellRinging, Cpu, Fan, Gauge, LightbulbFilament, SecurityCamera, Siren, SpeakerHifi, Television, Wrench,
} from '@phosphor-icons/react'

/** The tool that stands for each module on the board, in module order. */
export const MODULE_TOOLS: Record<string, Icon> = {
  m1: Gauge,
  m2: Cpu,
  m3: Fan,
  m4: LightbulbFilament,
  m5: SecurityCamera,
  m6: Siren,
  m7: BellRinging,
  m8: SpeakerHifi,
  m9: Television,
}

export function toolFor(moduleId: string): Icon {
  return MODULE_TOOLS[moduleId] ?? Wrench
}
