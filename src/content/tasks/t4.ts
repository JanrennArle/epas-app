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
    'Keep the charger plug where you can see it whenever the unit is open, so nobody else can plug it in while you are working.',
    'Never solder directly onto the body of a cell. The heat damages it and can make it vent. Use a cell with tags already fitted, or ask your teacher.',
    'Never leave the unit charging with the case open and the cell exposed. If you need one reading from the charging circuit while it is on charge, take it with your teacher present and unplug again straight away.',
  ],
  steps: [
    'Agree as a group what the lamp does now: how long it runs, whether it charges, and whether the switch does anything.',
    'Unplug the charger and open the unit, then inspect the cell for swelling, heat or leakage before you test anything.',
    'With the charger still unplugged, measure the cell voltage, then run the lamp for a few minutes and measure again, because a failed cell reads a plausible voltage at rest and collapses as soon as anything draws from it.',
    'Plug the charger in on its own, away from the open unit, measure its output at the jack against the rating printed on it, then unplug it again.',
    'With your teacher present, connect the charger lead to the unit, plug the charger back into the mains just long enough to read the charging circuit output at the cell terminals, then unplug it from the mains again before you go any further. The unit is open for this one reading and for nothing else.',
    'With the charger unplugged once more, disconnect the cell before you go any further. Every measurement below is a resistance or a diode test, and both push their own small current through the circuit, which only reads what it should with the cell out of it. A slipped probe then cannot short the cell across the board either. Unplug it at its connector, or ask your teacher to lift a tag if it is soldered in, and never cut or unsolder a cell lead yourself.',
    'Put the disconnected cell somewhere it cannot be shorted while you work: out of the case, clear of the bench edge, with its terminals not touching each other, any tool, or anything metal. A lithium cell shorted across a dropped screwdriver is the one thing on this task that can catch fire.',
    'With the cell disconnected, check continuity through the switch and the wiring between the cell terminals, the driver and the light emitting diodes.',
    'Test the light emitting diodes with the meter on its diode range, one device at a time, because one open device darkens a whole series string and looks identical to a dead driver from outside.',
    'Replace what the readings condemned, using a cell of the same chemistry, voltage and capacity as the original, with its protection circuit intact.',
    'Reconnect the cell at its connector, close the unit completely, then reconnect the charger and watch it through a full charge cycle, noting whether it warms more than it should.',
    'Unplug the charger again and run the lamp on battery alone to confirm the runtime the group expected.',
  ],
  rubric: [
    { criterion: 'Systematic diagnosis', descriptor: 'Charger, cell, charging circuit, wiring, diodes and switch are each measured in turn rather than swapped at random.', points: 5 },
    { criterion: 'Battery handling', descriptor: 'The cell is assessed under load rather than at rest, a failed cell is isolated rather than charged or refitted, and the unit is closed before it is left on charge.', points: 6 },
    { criterion: 'Repair and testing', descriptor: 'The replacement matches the original rating, and the unit is tested on charge and on battery.', points: 5 },
    { criterion: 'Working as a group', descriptor: 'Findings are shared as they are made and every member can explain what was wrong with the unit.', points: 4 },
  ],
}
