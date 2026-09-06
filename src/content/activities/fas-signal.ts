import type { SequenceActivityData } from '../../lib/activity'

export const fasSignal: SequenceActivityData = {
  kind: 'sequence',
  id: 'fas-signal',
  instruction: 'Build the path an alarm takes, from the thing that notices a fire to the thing that warns the building. One of these parts matters but is not in that path, so leave it out.',
  choices: [
    { id: 'panel', label: 'Control panel' },
    { id: 'detector', label: 'Smoke detector' },
    { id: 'battery', label: 'Standby battery' },
    { id: 'sounder', label: 'Sounder and strobe' },
    { id: 'loop', label: 'Zone wiring' },
  ],
  items: [
    { id: 'p1', prompt: 'First', answer: 'detector' },
    { id: 'p2', prompt: 'Second', answer: 'loop' },
    { id: 'p3', prompt: 'Third', answer: 'panel' },
    { id: 'p4', prompt: 'Fourth', answer: 'sounder' },
  ],
}
