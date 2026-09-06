import type { Scenario } from '../../lib/diagnose'
import { fanScenario } from './fan'
import { flatIronScenario } from './flat-iron'
import { lampScenario } from './lamp'
import { cctvScenario } from './cctv'
import { fasZoneScenario } from './fas-zone'

export const SCENARIOS: Record<string, Scenario> = {
  fan: fanScenario,
  'flat-iron': flatIronScenario,
  lamp: lampScenario,
  cctv: cctvScenario,
  'fas-zone': fasZoneScenario,
}
