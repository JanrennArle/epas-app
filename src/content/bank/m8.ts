import type { BankItem } from '../../lib/types'

export const m8Bank: BankItem[] = [
  {
    id: 'b-m8-c1-a', moduleId: 'm8', pair: 'm8-c1', form: 'A',
    competency: 'Perform the installation and operation of audio products and systems.',
    stem: 'Why are the loudspeakers placed closer to the audience than the microphones are?',
    options: [
      'So the speaker cable runs stay short and lose less signal on the way',
      'So the audience can see the loudspeakers and know where the sound is coming from',
      'So the microphones do not pick up the loudspeakers and set up feedback',
      'So the amplifier sits further from the stage lights and runs a little cooler',
    ],
    answer: 2,
  },
  {
    id: 'b-m8-c1-b', moduleId: 'm8', pair: 'm8-c1', form: 'B',
    competency: 'Perform the installation and operation of audio products and systems.',
    stem: 'A system begins to howl as the volume is raised. What is happening?',
    options: [
      'The amplifier is being driven past its limit and the howl is the sound of it clipping',
      'Sound from a loudspeaker is reaching a microphone and going round the loop again',
      'A loudspeaker cone has split and is buzzing louder as the drive to it goes up',
      'The mains supply is sagging under load and the amplifier is complaining about it',
    ],
    answer: 1,
  },
  {
    id: 'b-m8-c2-a', moduleId: 'm8', pair: 'm8-c2', form: 'A',
    competency: 'Perform procedure in servicing audio products and systems.',
    stem: 'One channel of an amplifier is silent. You swap the input leads between channels and the silence stays where it was. What has that told you?',
    options: [
      'The fault is after the input, in the amplifier or its speaker path',
      'The fault is in the input lead that carries the signal into the silent channel',
      'The fault is in the source equipment driving that one channel',
      'Nothing useful can be drawn from a swap like that',
    ],
    answer: 0,
  },
  {
    id: 'b-m8-c2-b', moduleId: 'm8', pair: 'm8-c2', form: 'B',
    competency: 'Perform procedure in servicing audio products and systems.',
    stem: 'You measure a loudspeaker marked 8 ohms and read 6.4 ohms across its terminals. What does that mean?',
    options: [
      'The voice coil has some shorted turns in it, and those are what have pulled the reading down below the marked eight ohms',
      'The speaker is open circuit, and 6.4 ohms is the meter reading its own leads and the air gap',
      'The meter is faulty and is reading about a fifth low across the whole ohms range',
      'This is normal, because the marked figure is an impedance at frequency and the meter reads the coil resistance',
    ],
    answer: 3,
  },
]
