import type { BankItem } from '../../lib/types'

export const m8Bank: BankItem[] = [
  {
    id: 'b-m8-c1-a', moduleId: 'm8', pair: 'm8-c1', form: 'A',
    competency: 'Perform the installation and operation of audio products and systems.',
    stem: 'Why are the loudspeakers placed closer to the audience than the microphones are?',
    options: [
      'So the cable runs are shorter',
      'So the audience can see the loudspeakers',
      'So the microphones do not pick up the loudspeakers and set up feedback',
      'So the amplifier runs cooler',
    ],
    answer: 2,
  },
  {
    id: 'b-m8-c1-b', moduleId: 'm8', pair: 'm8-c1', form: 'B',
    competency: 'Perform the installation and operation of audio products and systems.',
    stem: 'A system begins to howl as the volume is raised. What is happening?',
    options: [
      'The amplifier is being overdriven and is distorting',
      'Sound from a loudspeaker is reaching a microphone and going round the loop again',
      'A loudspeaker has failed',
      'The mains supply is too low',
    ],
    answer: 1,
  },
  {
    id: 'b-m8-c2-a', moduleId: 'm8', pair: 'm8-c2', form: 'A',
    competency: 'Perform procedure in servicing audio products and systems.',
    stem: 'One channel of an amplifier is silent. You swap the input leads between channels and the silence stays where it was. What has that told you?',
    options: [
      'The fault is after the input, in the amplifier or its speaker path',
      'The fault is in the input lead',
      'The fault is in the source equipment',
      'Nothing useful',
    ],
    answer: 0,
  },
  {
    id: 'b-m8-c2-b', moduleId: 'm8', pair: 'm8-c2', form: 'B',
    competency: 'Perform procedure in servicing audio products and systems.',
    stem: 'You measure a loudspeaker marked 8 ohms and read 6.4 ohms across its terminals. What does that mean?',
    options: [
      'The voice coil is partly shorted and the speaker needs replacing',
      'The speaker is open circuit',
      'The meter is faulty',
      'This is normal, because the marked figure is an impedance at frequency and the meter reads the coil resistance',
    ],
    answer: 3,
  },
]
