import type { Activity } from '../../lib/activity'
import { flatIronParts } from './flat-iron-parts'
import { lightingParts } from './lighting-parts'
import { cctvSignal } from './cctv-signal'
import { fasSignal } from './fas-signal'
import { audioSignal } from './audio-signal'
import { tvBoards } from './tv-boards'
import { controlBoard } from './control-board'

export const ACTIVITIES: Record<string, Activity> = {
  'flat-iron-parts': flatIronParts,
  'lighting-parts': lightingParts,
  'cctv-signal': cctvSignal,
  'fas-signal': fasSignal,
  'audio-signal': audioSignal,
  'tv-boards': tvBoards,
  'control-board': controlBoard,
}
