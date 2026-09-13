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
    'Unplug the appliance and let it cool if you ran it to confirm the fault, because an element and a soleplate stay hot long after the setting is off. Then open it and look before you touch: a burnt smell, a discoloured lead, a loose terminal.',
    'If the appliance has a capacitor, the first thing you touch inside is the bleeder resistor across its terminals. Discharge it and confirm it reads close to zero volts before anything else, because a run capacitor holds its charge with the appliance unplugged and sits directly across the winding and the terminals you are about to work on.',
    'With the appliance still unplugged, check continuity through the supply cord from the plug pins to the internal terminals, flexing the cord at the plug and at the entry while you watch the meter, because a break there shows only while it moves.',
    'Still unplugged, and only if the appliance has an earth pin, check continuity from that pin to any exposed metal the user can touch. A double insulated appliance has no earth to check.',
    'Still unplugged, test the switch, the thermal cutout, and the winding or element one at a time, and write each reading down.',
    'Measure the capacitor against the value marked on it, with one of its leads lifted so the winding is not reading in parallel with it.',
    'Replace what the readings condemned, and nothing that they did not.',
    'Reassemble the appliance completely, then plug it in and run it through every speed or heat setting.',
    'If anything still needs attention, unplug the appliance and let it cool, because a soleplate or an element stays hot long after the setting is switched off. Reopen it, discharge the capacitor again and prove it close to zero volts before you touch anything else inside, since the run you just did recharged it. Then close the appliance and repeat the test.',
  ],
  rubric: [
    { criterion: 'Diagnosis', descriptor: 'The faulty part is identified from measurements rather than from guessing, and the readings are written down.', points: 6 },
    { criterion: 'Repair', descriptor: 'Only what the readings condemned is replaced, and it is fitted to the same rating as the original.', points: 5 },
    { criterion: 'Reassembly and testing', descriptor: 'The appliance goes back together fully and is tested on every setting it offers.', points: 5 },
    { criterion: 'Electrical safety', descriptor: 'The appliance was isolated before opening and any capacitor proved discharged before contact.', points: 6 },
  ],
}
