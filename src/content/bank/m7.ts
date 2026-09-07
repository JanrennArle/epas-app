import type { BankItem } from '../../lib/types'

export const m7Bank: BankItem[] = [
  {
    id: 'b-m7-c1-a', moduleId: 'm7', pair: 'm7-c1', form: 'A',
    competency: 'Perform the procedure in fire alarm system servicing.',
    stem: 'A zone reads open when you measure it looking outward from the first junction. Where is the break?',
    options: [
      'Between the first junction and the last device',
      'Between the panel and the first junction',
      'Inside the panel',
      'The measurement cannot tell you',
    ],
    answer: 0,
  },
  {
    id: 'b-m7-c1-b', moduleId: 'm7', pair: 'm7-c1', form: 'B',
    competency: 'Perform the procedure in fire alarm system servicing.',
    stem: 'Before you disconnect a zone to test it, what must you do first?',
    options: [
      'Sound the alarm once to check it works',
      'Put the panel into a test or disabled state and tell the people responsible for the building',
      'Remove the panel battery',
      'Nothing, a zone can be disconnected at any time',
    ],
    answer: 1,
  },
  {
    id: 'b-m7-c2-a', moduleId: 'm7', pair: 'm7-c2', form: 'A',
    competency: 'Discuss audio products and systems.',
    stem: 'What does an amplifier do in an audio chain?',
    options: [
      'It converts sound into an electrical signal',
      'It converts the electrical signal back into sound',
      'It raises a small signal to a level that can drive a loudspeaker',
      'It removes noise from the signal',
    ],
    answer: 2,
  },
  {
    id: 'b-m7-c2-b', moduleId: 'm7', pair: 'm7-c2', form: 'B',
    competency: 'Discuss audio products and systems.',
    stem: 'In what order does a signal pass through a simple public address chain?',
    options: [
      'Loudspeaker, amplifier, mixer, microphone',
      'Microphone, mixer, amplifier, loudspeaker',
      'Amplifier, microphone, mixer, loudspeaker',
      'Mixer, microphone, loudspeaker, amplifier',
    ],
    answer: 1,
  },
]
