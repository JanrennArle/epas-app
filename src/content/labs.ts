import { ACTIVITIES } from './activities'
import { SCENARIOS } from './scenarios'

export interface Lab {
  /** What the URL carries, and what identifies the card. Not a simId. */
  id: string
  simId: string
  title: string
  blurb: string
  /** Passed straight to the simulation, exactly as a lesson block would. */
  config?: Record<string, unknown>
}

/**
 * The simulations that are shells rather than exercises, and the config key
 * that names which exercise to run.
 *
 * Four of the six registered simulations are shells. Listing bare simIds in
 * the gallery put dead cards on the screen: the shell rendered with no
 * exercise named and told the student the activity was not available. So a
 * lab is an exercise, not a simulation, and a shell appears once per exercise
 * it can run. `tests/registry.test.tsx` pins this table against the registry,
 * because a fifth shell added later and left out of it would bring the dead
 * card back with a green suite.
 */
export const SHELLS: Record<string, 'activity' | 'scenario'> = {
  hotspot: 'activity',
  match: 'activity',
  sequence: 'activity',
  troubleshoot: 'scenario',
}

/** Simulations that carry their own exercise and need no config at all. */
export const STANDALONE: Lab[] = [
  {
    id: 'multimeter',
    simId: 'multimeter',
    title: 'Multimeter and component testing',
    blurb: 'Measure resistance, continuity, diode drop and voltage on good and faulty parts.',
  },
  {
    id: 'psu',
    simId: 'psu',
    title: 'Power supply assembly',
    blurb: 'Build a supply stage by stage and watch what each one does to the waveform.',
  },
]

/**
 * What to call each activity on its card.
 *
 * A card is a surface outside the exercise, so its copy is bound by the same
 * rule the test bank is: nothing about it may let a student answer without
 * doing the work. The first version of these blurbs broke that. "Put
 * microphone, mixer, amplifier and speaker into the order the sound travels"
 * is the answer to the sequence exercise, in order, and by omission it names
 * the distractor as well. A student reading the gallery could score every
 * signal path exercise without opening one. That is the fifth member of the
 * exploit family CLAUDE.md describes, and the first found outside the item
 * banks; `tests/registry.test.tsx` guards it now.
 * An activity carries an instruction
 * for the student who is already inside it, which is the wrong length and the
 * wrong voice for a card, so the card copy is authored here. The guard test
 * requires an entry for every activity; a new one without copy still gets a
 * working card, it just gets a worse one, and the suite says so.
 */
const ACTIVITY_COPY: Record<string, { title: string; blurb: string }> = {
  'flat-iron-parts': {
    title: 'Parts of a flat iron',
    blurb: 'Point to the element, thermostat, thermal fuse and cord on a cutaway.',
  },
  'tv-boards': {
    title: 'Boards inside a television',
    blurb: 'Find the power supply, main board, backlight and panel from what each one does.',
  },
  'lighting-parts': {
    title: 'Parts of a rechargeable lamp',
    blurb: 'Pair the cell, charger, driver, LEDs and switch with the job each one does.',
  },
  'control-board': {
    title: 'Parts on a control board',
    blurb: 'Pair the relay, regulator, optocoupler, capacitor and microcontroller with what they do.',
  },
  'audio-signal': {
    title: 'Audio signal path',
    blurb: 'Put the parts of a sound system into the order the sound travels through them.',
  },
  'cctv-signal': {
    title: 'CCTV signal path',
    blurb: 'Put the parts of a camera system into the order the picture travels through them.',
  },
  'fas-signal': {
    title: 'Fire alarm signal path',
    blurb: 'Put the parts of a fire alarm system into the order an alarm travels through them.',
  },
}

/**
 * Every exercise a student can open on its own.
 *
 * Built from the activity and scenario registries rather than listed by hand,
 * so authoring an exercise puts it here and a shell can never point at an
 * exercise of the wrong kind: the kind is what chooses the shell.
 */
export const LABS: Lab[] = [
  ...STANDALONE,
  ...Object.entries(ACTIVITIES).map(([id, activity]): Lab => {
    const copy = ACTIVITY_COPY[id]
    return {
      id,
      simId: activity.kind,
      config: { activity: id },
      title: copy?.title ?? id,
      blurb: copy?.blurb ?? activity.instruction,
    }
  }),
  ...Object.entries(SCENARIOS).map(([id, scenario]): Lab => ({
    // Prefixed because a scenario id and an activity id are drawn from
    // different registries and nothing stops the two from colliding.
    id: `fault-${id}`,
    simId: 'troubleshoot',
    config: { scenario: id },
    title: `${scenario.appliance}: find the fault`,
    blurb: scenario.symptom,
  })),
]

/**
 * `/labs/troubleshoot` resolved before the scenario cards existed and opened
 * the fan scenario, because that is the shell's default. It is now
 * `/labs/fault-fan`, and the old URL shows the not-found message. Nothing in
 * the app ever linked it and the app has not been deployed, so no student can
 * hold that link; it is recorded here rather than aliased.
 */
export function getLab(id: string): Lab | undefined {
  return LABS.find(l => l.id === id)
}

/** Which simulations the gallery actually reaches. The guard test pins this. */
export const LAB_SIM_IDS = [...new Set(LABS.map(l => l.simId))]
