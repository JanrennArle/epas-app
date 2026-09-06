import type { MatchActivityData } from '../../lib/activity'

export const lightingParts: MatchActivityData = {
  kind: 'match',
  id: 'lighting-parts',
  instruction: 'A rechargeable LED lamp contains these parts. Match each description to the part it names.',
  choices: [
    { id: 'cell', label: 'Rechargeable cell' },
    { id: 'charger', label: 'Charging circuit' },
    { id: 'driver', label: 'LED driver' },
    { id: 'led', label: 'LED array' },
    { id: 'switch', label: 'Control switch' },
  ],
  items: [
    { id: 'q1', prompt: 'Stores the energy that runs the lamp when it is unplugged.', answer: 'cell' },
    { id: 'q2', prompt: 'Controls how much current goes into the cell, and stops when it is full.', answer: 'charger' },
    { id: 'q3', prompt: 'Holds the current through the LEDs steady as the cell voltage falls.', answer: 'driver' },
    { id: 'q4', prompt: 'Turns electricity into light, and dims as it ages.', answer: 'led' },
    { id: 'q5', prompt: 'Selects brightness, and is the part a user wears out fastest.', answer: 'switch' },
  ],
}
