import type { Scenario } from '../../lib/diagnose'

export const ampScenario: Scenario = {
  id: 'amp',
  appliance: 'Audio amplifier',
  symptom: 'The right channel is silent. The left channel plays normally at the same volume setting, and neither channel hums or crackles.',
  safety: [
    'Switch the amplifier off and unplug it before opening the case.',
    'The filter capacitors in the supply hold their charge after the mains is removed, so discharge them through a bleeder resistor and then confirm with the meter that they read close to zero volts before touching the board.',
    'Turn the volume fully down before you switch on again, because a fault can put full output into a speaker without warning.',
  ],
  faults: [
    { id: 'lead', label: 'Faulty input lead', remedy: 'Replace the lead. The break is usually at the plug, where the cable is flexed.' },
    { id: 'output', label: 'Failed output stage', remedy: 'The output devices and their emitter resistors are replaced as a set, and the bias is reset afterwards.' },
    { id: 'speakerlead', label: 'Broken speaker lead', remedy: 'Re-terminate or replace the lead, and check the terminal is gripping copper and not insulation.' },
    { id: 'driver', label: 'Failed speaker driver', remedy: 'Replace the driver with one of the same impedance and power rating.' },
    { id: 'rails', label: 'Loss of a supply rail', remedy: 'Find why the rail is missing, usually a fuse or a rectifier, before fitting anything new.' },
  ],
  actualFault: 'output',
  testPoints: [
    {
      id: 'tp-lead', label: 'Input lead', action: 'Swap the left and right input leads at the amplifier and listen again.',
      readings: { lead: 'The silence follows the lead to the other channel', '*': 'The silence stays on the right channel' },
      implicates: ['lead'],
    },
    {
      id: 'tp-rails', label: 'Supply rails', action: 'DC volts on the positive and negative rails feeding the right output stage.',
      readings: { rails: 'Positive rail correct, negative rail at 0.0 V', '*': 'Plus 42 V and minus 42 V, both steady' },
      implicates: ['rails'],
    },
    {
      id: 'tp-out', label: 'Amplifier output', action: 'AC volts at the right speaker terminals with a test tone playing and the volume at one quarter.',
      readings: { output: '0.00 V AC while the left terminals read 2.4 V AC', '*': '2.4 V AC, matching the left channel' },
      implicates: ['output'],
    },
    {
      id: 'tp-speakerlead', label: 'Speaker lead', action: 'Continuity through the right speaker lead, disconnected at both ends.',
      readings: { speakerlead: 'OL on one conductor', '*': '0.5 ohm, meter beeps' },
      implicates: ['speakerlead'],
    },
    {
      id: 'tp-driver', label: 'Speaker driver', action: 'Resistance across the right speaker terminals with the lead disconnected.',
      readings: { driver: 'OL', '*': '6.4 ohm against a marked 8 ohm' },
      implicates: ['driver'],
    },
  ],
}
