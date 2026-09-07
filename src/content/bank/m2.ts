import type { BankItem } from '../../lib/types'

export const m2Bank: BankItem[] = [
  {
    id: 'b-m2-c1-a', moduleId: 'm2', pair: 'm2-c1', form: 'A',
    competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
    stem: 'Why is a printed circuit board layout normally transferred as a mirror image of the drawn artwork?',
    options: [
      'Because the etchant only attacks the copper when the board is worked from its reverse side',
      'Because the toner is pressed face down onto the copper, which flips the pattern',
      'Because tracks that are mirrored end up resisting soldering heat better than tracks that are not',
      'Because the design software is not able to send the artwork to the printer the right way round',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c1-b', moduleId: 'm2', pair: 'm2-c1', form: 'B',
    competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
    stem: 'A board comes out of the etchant with several tracks broken. What is the most likely cause?',
    options: [
      'The board was rinsed in cold water part way through, which cracked the copper along the tracks',
      'The board was lifted out of the etchant too early, before the unwanted copper had cleared',
      'The tracks were drawn far too wide in the design software and shorted into one another',
      'The transferred toner did not adhere completely, so the etchant reached the copper beneath it',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c2-a', moduleId: 'm2', pair: 'm2-c2', form: 'A',
    competency: 'Discuss soldering and desoldering.',
    stem: 'A joint looks dull and rounded, and the solder sits on the pad like a bead rather than flowing onto it. What is wrong?',
    options: [
      'Too much flux was used, and the excess has pushed the molten solder up into a ball',
      'The joint is cold, because the pad and lead were not brought up to temperature together',
      'The pad was wiped with flux before soldering, which stops the solder bonding to the copper',
      'Nothing is wrong, a dull and rounded bead of solder sitting on the pad is a perfectly sound joint',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c2-b', moduleId: 'm2', pair: 'm2-c2', form: 'B',
    competency: 'Discuss soldering and desoldering.',
    stem: 'A through-hole joint has a good fillet on the solder side, but no solder has wicked up to the component side. What went wrong?',
    options: [
      'Too much solder was fed in at once, so the excess sealed over the mouth of the hole before it could flow',
      'The board was held at an angle, so gravity kept the solder on the lower side',
      'The iron touched the pad only, so the lead and the hole never reached the temperature the solder needed',
      'The solder used was too thin a gauge to be able to reach through the hole',
    ],
    answer: 2,
  },
  {
    id: 'b-m2-c3-a', moduleId: 'm2', pair: 'm2-c3', form: 'A',
    competency: 'Discuss the different types of power supplies.',
    stem: 'A linear supply has a filter capacitor that has lost most of its capacitance. What do you see at the output?',
    options: [
      'A steady voltage at the correct value',
      'No output voltage at all',
      'A voltage higher than it should be',
      'A large ripple riding on the output',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c3-b', moduleId: 'm2', pair: 'm2-c3', form: 'B',
    competency: 'Discuss the different types of power supplies.',
    stem: 'A full wave rectifier is used in place of a half wave one. What changes at the filter capacitor?',
    options: [
      'Nothing changes, both rectifier types feed the capacitor the very same waveform',
      'The capacitor is no longer needed once a full wave rectifier is fitted',
      'It is recharged only half as often, so the output ripple grows',
      'It is recharged twice as often, so the ripple shrinks',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c4-a', moduleId: 'm2', pair: 'm2-c4', form: 'A',
    competency: 'Perform variable regulated power supply assembly.',
    stem: 'A regulator is set for 12 V, but the voltage across the filter capacitor sags to 13 V under load. What happens at the output?',
    options: [
      'It holds a steady 12 V, because holding the set value no matter what the input does is what regulation means',
      'It follows the input down, because a regulator needs a few volts more than its output to regulate',
      'It rises a little above 12 V, as the regulator pushes harder to make up for the low input',
      'It shuts off completely and the output falls to zero until the input voltage recovers',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c4-b', moduleId: 'm2', pair: 'm2-c4', form: 'B',
    competency: 'Perform variable regulated power supply assembly.',
    stem: 'You have assembled a variable supply and the output will not rise above about 9 V, although the control is at maximum. Where do you look first?',
    options: [
      'At the transformer and rectifier, because the unregulated voltage feeding the regulator may be too low',
      'At the output terminals, which are most likely shorted together by a stray strand of stripped wire',
      'At the meter, which is most likely misreading the output by three or four volts',
      'At the load on the output, which is most likely drawing far too little current',
    ],
    answer: 0,
  },
]
