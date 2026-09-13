import type { PerformanceTask } from '../../lib/types'

export const t4: PerformanceTask = {
  id: 't4',
  kind: 'group',
  title: 'Comprehensive servicing of rechargeable and electronic controlled lighting units',
  brief:
    'In groups, learners troubleshoot and service rechargeable lamps or electronic-controlled lighting units by checking the power supply, battery condition, charging circuit, LED components, and control switches, performing necessary repairs or replacements, and conducting final safety and performance testing in accordance with established servicing standards.',
  modules: ['m4'],
  safety: [
    'A cell that is swollen, hot, or hissing has already failed dangerously. Isolate it, never charge it, and never refit it.',
    'Unplug the charger before opening the unit. The charger side can carry mains voltage even when the lamp itself is low voltage.',
    'Never puncture, crush, or short a lithium cell, including one you have decided to throw away. Hand it to your teacher for disposal.',
    'A lamp can be bright enough to hurt your eyes at close range. Point it away from faces when you switch it on.',
  ],
  steps: [
    'Agree as a group what the lamp does now: how long it runs, whether it charges, and whether the switch does anything.',
    'Unplug the charger and open the unit, then inspect the cell for swelling, heat or leakage before you test anything.',
    'With the charger still unplugged, measure the cell voltage and compare it against the value printed on the cell.',
    'Still isolated, check continuity through the switch and the wiring between the cell, the driver and the light emitting diodes.',
    'Test the light emitting diode string the way the module taught, remembering that one open device darkens a whole series string.',
    'Replace what the readings condemned, using a cell of the same chemistry, voltage and capacity as the original.',
    'Reconnect the charger and watch the unit through a full charge cycle, noting whether it warms more than it should.',
    'Unplug the charger again, close the unit, and run it on battery alone to confirm the runtime the group expected.',
  ],
  rubric: [
    { criterion: 'Systematic diagnosis', descriptor: 'Supply, cell, charging circuit, diodes and switch are each checked in turn rather than swapped at random.', points: 5 },
    { criterion: 'Battery handling', descriptor: 'The cell is assessed before anything else, and a failed cell is isolated rather than charged or refitted.', points: 6 },
    { criterion: 'Repair and testing', descriptor: 'The replacement matches the original rating, and the unit is tested on charge and on battery.', points: 5 },
    { criterion: 'Working as a group', descriptor: 'Findings are shared as they are made and every member can explain what was wrong with the unit.', points: 4 },
  ],
}
