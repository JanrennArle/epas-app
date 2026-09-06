import type { Scenario } from '../../lib/diagnose'

export const flatIronScenario: Scenario = {
  id: 'flat-iron',
  appliance: 'Electric flat iron',
  symptom: 'The iron is plugged in and the dial is turned up, but the plate stays cold.',
  safety: [
    'Unplug the iron and let the plate cool completely before opening it.',
    'Check the cord along its whole length, because flexing wear hides under the sleeve near the strain relief.',
    'Keep the meter on continuity or resistance only, and never touch a plugged-in iron with a probe.',
  ],
  faults: [
    { id: 'cord', label: 'Broken supply cord', remedy: 'Replace the cord, or re-terminate it if the break is at the strain relief.' },
    { id: 'thermostat', label: 'Faulty thermostat', remedy: 'Clean the contacts if they are only dirty, otherwise fit the correct replacement thermostat.' },
    { id: 'fuse', label: 'Open thermal fuse', remedy: 'Fit a thermal fuse of the same rating and temperature. Never bridge it. Then find why the iron overheated, or the new one will open too.' },
    { id: 'element', label: 'Open heating element', remedy: 'Replace the sole plate assembly. On most irons the element is not separately serviceable.' },
  ],
  actualFault: 'element',
  testPoints: [
    {
      id: 'tp-cord', label: 'Supply cord', action: 'Continuity across the plug pins with the dial turned up.',
      readings: { cord: 'OL', '*': '1.1 ohm, meter beeps' },
      implicates: ['cord'],
    },
    {
      id: 'tp-stat', label: 'Thermostat', action: 'Continuity across the thermostat contacts with the dial turned up.',
      readings: { thermostat: 'OL with the dial at maximum', '*': '0.3 ohm, meter beeps' },
      implicates: ['thermostat'],
    },
    {
      id: 'tp-fuse', label: 'Thermal fuse', action: 'Continuity across the thermal fuse under the cover.',
      readings: { fuse: 'OL', '*': '0.2 ohm, meter beeps' },
      implicates: ['fuse'],
    },
    {
      id: 'tp-elem', label: 'Heating element', action: 'Resistance across the element terminals at the sole plate.',
      readings: { element: 'OL', '*': '48 ohm' },
      implicates: ['element'],
    },
  ],
}
