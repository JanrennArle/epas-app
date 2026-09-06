import type { Activity } from '../../lib/activity'
import { flatIronParts } from './flat-iron-parts'
import { lightingParts } from './lighting-parts'

export const ACTIVITIES: Record<string, Activity> = {
  'flat-iron-parts': flatIronParts,
  'lighting-parts': lightingParts,
}
