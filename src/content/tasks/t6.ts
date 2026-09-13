import type { PerformanceTask } from '../../lib/types'

export const t6: PerformanceTask = {
  id: 't6',
  kind: 'group',
  title: 'Fire alarm system inspection, troubleshooting and restoration project',
  brief:
    'In groups, learners conduct systematic inspection and servicing of a simulated fire alarm system, including smoke detectors, manual pull stations, alarm notification devices, and control panel connections, by identifying faults (e.g., open circuit, short circuit, device failure), performing corrective actions, and ensuring the system operates safely and reliably.',
  modules: ['m6', 'm7'],
  safety: [
    'Put the panel into test and tell everyone responsible for the building before you touch anything. An unannounced alarm empties a school, and an unannounced silence is worse.',
    'Never leave the system disabled at the end of a session. If the work is not finished, restore the system and say what is outstanding.',
    'Isolate the zone at the panel before you disconnect a device, and say out loud which zone you have isolated so the group knows.',
    'Sounders are loud enough to damage hearing at close range. Warn the group before any device is made to sound.',
    'The panel enclosure carries mains and a standby battery that can push a large current through a dropped tool. Open it only with your teacher at the panel with you, keep loose tools out of it, close it again as soon as the work at the terminals is done, and never leave it open while you walk away to the loop.',
  ],
  steps: [
    'Put the panel into its test state, record which zones you are working on, and tell the people responsible for the building.',
    'Read what the panel is already telling you, because a fault light names the zone before you have measured anything.',
    'Walk the zone and look at every device and every junction, since the commonest fault is a termination rather than a device.',
    'Isolate the zone at the panel. With your teacher at the panel with you, open the enclosure, take the loop reading end to end at the zone terminals and compare it against the end of line resistor value, then close the enclosure again before you walk the run.',
    'Work outward from the first junction to halve the run, rather than walking the whole loop device by device.',
    'Correct what you found, remaking terminations properly rather than twisting conductors together.',
    'With your teacher at the panel again, open the enclosure, reconnect the zone at its terminals and close the enclosure, then confirm the panel shows the zone healthy with no fault light.',
    'Prove one device on the zone while the panel is still in test, so the proof does not sound an alarm the building was not warned about.',
    'Restore the device you proved, then reset the panel, and only then take it out of test and tell the building the system is back in service.',
  ],
  rubric: [
    { criterion: 'Preparation', descriptor: 'The panel is put into test and the building is told before any work begins.', points: 5 },
    { criterion: 'Systematic fault finding', descriptor: 'The panel indication and the halving method are used, rather than walking the loop device by device.', points: 6 },
    { criterion: 'Corrective work', descriptor: 'Terminations are remade properly and the end of line arrangement is left correct.', points: 5 },
    { criterion: 'Restoration', descriptor: 'A device is proved while the panel is still in test, the system is then returned to service, and the building is told.', points: 6 },
  ],
}
