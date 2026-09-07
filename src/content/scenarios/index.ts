import type { Scenario } from '../../lib/diagnose'
import { fanScenario } from './fan'
import { flatIronScenario } from './flat-iron'
import { lampScenario } from './lamp'
import { cctvScenario } from './cctv'
import { fasZoneScenario } from './fas-zone'
import { ampScenario } from './amp'
import { tvScenario } from './tv'
import { motorControlScenario } from './motor-control'

export const SCENARIOS: Record<string, Scenario> = {
  fan: fanScenario,
  'flat-iron': flatIronScenario,
  lamp: lampScenario,
  cctv: cctvScenario,
  'fas-zone': fasZoneScenario,
  amp: ampScenario,
  tv: tvScenario,
  'motor-control': motorControlScenario,
}
