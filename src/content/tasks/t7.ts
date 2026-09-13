import type { PerformanceTask } from '../../lib/types'

export const t7: PerformanceTask = {
  id: 't7',
  kind: 'individual',
  title: 'Troubleshooting and servicing of an audio amplifier or control board',
  brief:
    'The learner individually diagnoses and services a defective audio amplifier or basic motor control board by inspecting components, checking power supply output, testing input/output signals, identifying faulty parts (e.g., capacitors, transistors, relays), performing necessary repairs or replacements, and conducting functional testing while strictly observing electrical and ESD safety precautions.',
  modules: ['m8', 'm9'],
  safety: [
    'The filter capacitors in an amplifier supply hold their charge after the mains is removed. Discharge them through a bleeder resistor and confirm with a meter that they read close to zero volts before touching the board.',
    'Some of the checks below need the unit powered, and you cannot tell by looking which points are safe to probe while it is. The mains half of a control board reaches parts that look like ordinary low voltage components, and some boards have no isolated half at all. So before you power anything, go over the board with your teacher and have them mark the points that are safe to probe live, and the one point you may clip your earth lead to. Every point they have not marked is mains until they say otherwise, including the inlet, the fuse and anything you are unsure of.',
    'Nothing on this sheet asks you to probe a mains point live, so do not. Everything you need to measure with the unit unplugged you measure with it unplugged. At the marked safe points you may move one probe with the unit running, with the earth lead on the point your teacher marked and your free hand off the chassis.',
    'If your teacher marks no safe points, this unit does not get the powered comparisons. Say so in your notes and work from the unpowered measurements. You are marked on agreeing the boundary and working inside it, not on having taken a live reading.',
    'Turn the volume fully down before you switch on again. A fault can put full output into a speaker without warning, and that damages both the speaker and your hearing.',
    'Handle the board by its edges. Static from your hands damages semiconductors in ways that do not show up until later.',
    'Keep the plug where you can see it whenever the unit is open, so nobody else can restore power while your hands are inside.',
  ],
  steps: [
    'Confirm the fault for yourself. On an amplifier that means listening and noting whether one channel or both are affected, which alone halves the search. On a control board it means noting which output fails to act, and at which position.',
    'Unplug the unit, discharge the supply capacitors, confirm they read close to zero volts, and open the case.',
    'With the unit still unplugged, inspect the board for bulged capacitors, discoloured resistors and dry joints.',
    'Still unplugged, check the fuses and measure continuity from the mains inlet through to where the mains side ends, which on an amplifier is the transformer primary and on a control board is whatever your teacher identified.',
    'If your teacher marked safe points, restore the supply with the volume down and compare the supply rails feeding each output stage.',
    'Still powered, and still only at the marked points, compare the signal at the input and at the output of the affected stage, working along the chain rather than at random.',
    'Unplug and discharge again before you unsolder or fit anything.',
    'Fit the replacement, reassemble, then restore power and confirm the unit works: both channels compared by ear at a low volume before raising it on an amplifier, or every output acting in turn on a control board.',
  ],
  rubric: [
    { criterion: 'Narrowing the fault', descriptor: 'The affected channel and stage are identified before the case is opened, and the signal path is followed in order.', points: 6 },
    { criterion: 'Measurement', descriptor: 'Measurements are taken at the right points with the right meter setting and written down. Where no point was safe to probe live, the unpowered measurements carry the diagnosis and the notes say so.', points: 5 },
    { criterion: 'Repair quality', descriptor: 'The replacement matches the original rating, the joints are sound, and the board is handled by its edges.', points: 5 },
    { criterion: 'Safe working', descriptor: 'The safe points were agreed with the teacher before anything was powered and nothing outside them was probed live, the capacitors were proved discharged before contact, and the volume was down at switch on.', points: 6 },
  ],
}
