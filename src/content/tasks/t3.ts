import type { PerformanceTask } from '../../lib/types'

export const t3: PerformanceTask = {
  id: 't3',
  kind: 'individual',
  title: 'Servicing and functional testing of a motor operated or heating appliance',
  brief:
    'The learner individually diagnoses and services a common household appliance (e.g., electric fan, blender, flat iron, or rice cooker) by inspecting components such as motor windings or heating elements, checking wiring continuity, replacing defective parts if necessary, reassembling the unit, and performing operational testing while strictly observing electrical safety procedures.',
  modules: ['m3', 'm4'],
  safety: [
    'Unplug the appliance at the wall before you open it, and keep the plug where you can see it so nobody else can plug it back in while your hands are inside.',
    'A motor run capacitor holds its charge after the appliance is unplugged. Discharge it through a bleeder resistor and confirm with a meter before you touch its terminals.',
    'A heating element and its soleplate stay hot long after the appliance is switched off. Let it cool before you handle it.',
    'Never bridge or bypass a thermal cutout to get an appliance working. It opened for a reason, and the reason is still there.',
  ],
  steps: [
    'Confirm the fault for yourself and write down exactly what the appliance does and does not do.',
    'Unplug the appliance, open it, and look for anything obvious: a burnt smell, a discoloured lead, a loose terminal.',
    'With the appliance still unplugged, check continuity through the supply cord from the plug pins to the internal terminals, flexing the cord at the plug and at the entry while you watch the meter, because a break there shows only while it moves.',
    'Still unplugged, check continuity from the earth pin of the plug to any exposed metal the user can touch.',
    'Still unplugged, test the switch, the thermal cutout, and the winding or element, one at a time, and write each reading down.',
    'If the appliance has a capacitor, discharge it first, then measure it and compare against the value marked on it.',
    'Replace what the readings condemned, and nothing that they did not.',
    'Reassemble the appliance completely, then plug it in and run it through every speed or heat setting.',
    'If anything still needs attention, unplug the appliance again before you reopen it, and repeat the test once it is closed.',
  ],
  rubric: [
    { criterion: 'Diagnosis', descriptor: 'The faulty part is identified from measurements rather than from guessing, and the readings are written down.', points: 6 },
    { criterion: 'Repair', descriptor: 'Only what the readings condemned is replaced, and it is fitted to the same rating as the original.', points: 5 },
    { criterion: 'Reassembly and testing', descriptor: 'The appliance goes back together fully and is tested on every setting it offers.', points: 5 },
    { criterion: 'Electrical safety', descriptor: 'The appliance was isolated before opening and any capacitor proved discharged before contact.', points: 6 },
  ],
}
