import type { Scenario } from '../../lib/diagnose'
import { fanScenario } from './fan'

export const SCENARIOS: Record<string, Scenario> = {
  fan: fanScenario,
}
