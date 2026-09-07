import type { SequenceActivityData } from '../../lib/activity'

export const audioSignal: SequenceActivityData = {
  kind: 'sequence',
  id: 'audio-signal',
  instruction: 'Build the path sound takes, from the person talking to the people listening. One of these parts matters but is not in that path, so leave it out.',
  choices: [
    { id: 'amplifier', label: 'Power amplifier' },
    { id: 'stand', label: 'Microphone stand' },
    { id: 'microphone', label: 'Microphone' },
    { id: 'speaker', label: 'Speaker' },
    { id: 'mixer', label: 'Mixer' },
  ],
  items: [
    { id: 'p1', prompt: 'First', answer: 'microphone' },
    { id: 'p2', prompt: 'Second', answer: 'mixer' },
    { id: 'p3', prompt: 'Third', answer: 'amplifier' },
    { id: 'p4', prompt: 'Fourth', answer: 'speaker' },
  ],
}
