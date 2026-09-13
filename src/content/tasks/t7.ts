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
    'Several of the checks below need the unit powered. Clip your probes on before you switch on, keep one hand away from the chassis, and switch off again before you move them.',
    'Turn the volume fully down before you switch on again. A fault can put full output into a speaker without warning, and that damages both the speaker and your hearing.',
    'Handle the board by its edges. Static from your hands damages semiconductors in ways that do not show up until later.',
  ],
  steps: [
    'Confirm the fault for yourself. On an amplifier that means listening and noting whether one channel or both are affected, which alone halves the search. On a control board it means noting which output fails to act, and at which position.',
    'Unplug the amplifier, discharge the supply capacitors, confirm they read close to zero volts, and open the case.',
    'With the amplifier still unplugged, inspect the board for bulged capacitors, discoloured resistors and dry joints.',
    'Still unplugged, check the fuses and measure continuity from the mains inlet to the transformer primary.',
    'Restore the supply with the volume down, then compare the supply rails feeding each output stage.',
    'Still powered, compare the signal at the input and at the output of the affected stage, working along the chain rather than at random.',
    'Unplug and discharge again before you unsolder or fit anything.',
    'Fit the replacement, reassemble, then restore power and confirm the unit works: both channels compared by ear at a low volume before raising it on an amplifier, or every output acting in turn on a control board.',
  ],
  rubric: [
    { criterion: 'Narrowing the fault', descriptor: 'The affected channel and stage are identified before the case is opened, and the signal path is followed in order.', points: 6 },
    { criterion: 'Measurement', descriptor: 'Rails and signals are measured at the right points with the right meter setting, and readings are written down.', points: 5 },
    { criterion: 'Repair quality', descriptor: 'The replacement matches the original rating, the joints are sound, and the board is handled by its edges.', points: 5 },
    { criterion: 'Safe working', descriptor: 'The capacitors were proved discharged before contact, probes were fitted before power, and the volume was down at switch on.', points: 6 },
  ],
}
