import type { MatchActivityData } from '../../lib/activity'

export const controlBoard: MatchActivityData = {
  kind: 'match',
  id: 'control-board',
  instruction: 'These parts sit on a typical appliance control board. Match each description to the part it names.',
  choices: [
    { id: 'relay', label: 'Relay' },
    { id: 'regulator', label: 'Voltage regulator' },
    { id: 'opto', label: 'Opto isolator' },
    { id: 'electrolytic', label: 'Electrolytic capacitor' },
    { id: 'micro', label: 'Microcontroller' },
  ],
  items: [
    { id: 'q1', prompt: 'Uses a small current to switch a much larger one, and clicks when it operates.', answer: 'relay' },
    { id: 'q2', prompt: 'Holds a steady low voltage for the logic, and runs warm because it sheds the surplus as heat.', answer: 'regulator' },
    { id: 'q3', prompt: 'Passes a signal across a gap using light, so the mains side and the logic side never touch electrically.', answer: 'opto' },
    { id: 'q4', prompt: 'Smooths the supply, is fitted one way round only, and bulges on top when it fails.', answer: 'electrolytic' },
    { id: 'q5', prompt: 'Reads the inputs, decides what should happen, and drives the outputs.', answer: 'micro' },
  ],
}
