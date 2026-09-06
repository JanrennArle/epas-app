import type { Scenario } from '../../lib/diagnose'

export const fasZoneScenario: Scenario = {
  id: 'fas-zone',
  appliance: 'Fire alarm zone',
  symptom: 'The control panel shows an open circuit fault on zone 2. Detectors on that zone do not respond when tested, and every other zone is healthy.',
  safety: [
    'Tell the building occupants and the responsible person before you put any zone out of service.',
    'Isolate the sounders at the panel so a test does not evacuate the building.',
    'Record the time the zone went out of service, and stay with the system until it is back.',
  ],
  faults: [
    { id: 'endline', label: 'Missing end of line resistor', remedy: 'Fit the resistor value the panel calls for, at the last device on the zone and nowhere else.' },
    { id: 'wiring', label: 'Break in the zone wiring', remedy: 'Repair the break in a proper enclosure, then confirm the zone reads its normal standing resistance.' },
    { id: 'base', label: 'Detector not seated in its base', remedy: 'Seat the head correctly until it latches, then retest that device.' },
    { id: 'head', label: 'Failed detector head', remedy: 'Replace the head with the same type, and record its position and date.' },
    { id: 'card', label: 'Faulty panel zone card', remedy: 'The panel needs service. Do not leave the zone disabled without telling the responsible person.' },
  ],
  actualFault: 'wiring',
  testPoints: [
    {
      id: 'tp-panel', label: 'Panel terminals', action: 'Resistance across the zone 2 terminals with the zone disconnected at the panel.',
      readings: { card: '6.8 kilohm, the zone itself is healthy', '*': 'OL' },
      implicates: ['card'],
    },
    {
      id: 'tp-first', label: 'First junction', action: 'Resistance looking outward from the first junction box on the zone.',
      readings: { wiring: 'OL', '*': '6.8 kilohm' },
      implicates: ['wiring'],
    },
    {
      id: 'tp-base', label: 'Detector bases', action: 'Check each head is latched into its base and its base terminals are tight.',
      readings: { base: 'One head turns freely in its base and does not latch', '*': 'Every head is latched and every terminal is tight' },
      implicates: ['base'],
    },
    {
      id: 'tp-endline', label: 'End of line', action: 'Resistance across the end of line resistor at the last device.',
      readings: { endline: 'OL, and no resistor is fitted', '*': '6.8 kilohm' },
      implicates: ['endline'],
    },
    {
      id: 'tp-head', label: 'Detector heads', action: 'Substitute a head known to be working, one device at a time.',
      readings: { head: 'The zone reads normally with the substitute fitted', '*': 'No change with the substitute fitted' },
      implicates: ['head'],
    },
  ],
}
