import type { SequenceActivityData } from '../../lib/activity'

export const cctvSignal: SequenceActivityData = {
  kind: 'sequence',
  id: 'cctv-signal',
  instruction: 'Build the path a picture takes, from where it is captured to where someone watches it. One of these parts matters but is not in that path, so leave it out.',
  choices: [
    { id: 'recorder', label: 'Recorder, the DVR or NVR' },
    { id: 'psu', label: 'Camera power supply' },
    { id: 'camera', label: 'Camera' },
    { id: 'monitor', label: 'Monitor' },
    { id: 'cable', label: 'Cable run and connectors' },
  ],
  items: [
    { id: 'p1', prompt: 'First', answer: 'camera' },
    { id: 'p2', prompt: 'Second', answer: 'cable' },
    { id: 'p3', prompt: 'Third', answer: 'recorder' },
    { id: 'p4', prompt: 'Fourth', answer: 'monitor' },
  ],
}
