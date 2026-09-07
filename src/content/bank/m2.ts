import type { BankItem } from '../../lib/types'

export const m2Bank: BankItem[] = [
  {
    id: 'b-m2-c1-a', moduleId: 'm2', pair: 'm2-c1', form: 'A',
    competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
    stem: 'Why is a printed circuit board layout normally transferred as a mirror image of the drawn artwork?',
    options: [
      'Because the etchant works from the reverse side of the board',
      'Because the toner is pressed face down onto the copper, which flips the pattern',
      'Because mirrored tracks resist heat better during soldering',
      'Because design software cannot print in the correct orientation',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c1-b', moduleId: 'm2', pair: 'm2-c1', form: 'B',
    competency: 'Discuss the procedures for PCB designing, including design software and layout transfer techniques.',
    stem: 'A board comes out of the etchant with several tracks broken. What is the most likely cause?',
    options: [
      'The etchant was too fresh',
      'The board was left in the etchant too briefly',
      'The tracks were drawn too wide in the design software',
      'The transferred toner did not adhere completely, so the etchant reached the copper beneath it',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c2-a', moduleId: 'm2', pair: 'm2-c2', form: 'A',
    competency: 'Discuss soldering and desoldering.',
    stem: 'A joint looks dull and rounded, and the solder sits on the pad like a bead rather than flowing onto it. What is wrong?',
    options: [
      'Too much flux was used',
      'The joint is cold, because the pad and lead were not brought up to temperature together',
      'The iron was too hot and burned the solder',
      'Nothing, this is what a correct joint looks like',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c2-b', moduleId: 'm2', pair: 'm2-c2', form: 'B',
    competency: 'Discuss soldering and desoldering.',
    stem: 'Where should the tip of the iron be placed to make a good through-hole joint?',
    options: [
      'On the solder, so it melts and runs down into the hole',
      'On the component lead only, so the pad is not overheated',
      'Against both the pad and the lead, so heat reaches the two surfaces the solder must wet',
      'On the pad only, so the component is not overheated',
    ],
    answer: 2,
  },
  {
    id: 'b-m2-c3-a', moduleId: 'm2', pair: 'm2-c3', form: 'A',
    competency: 'Discuss the different types of power supplies.',
    stem: 'In a linear supply, which stage turns the pulsing output of the rectifier into a steadier voltage with ripple on it?',
    options: [
      'The transformer',
      'The rectifier itself',
      'The regulator',
      'The filter capacitor',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c3-b', moduleId: 'm2', pair: 'm2-c3', form: 'B',
    competency: 'Discuss the different types of power supplies.',
    stem: 'A full wave rectifier is used in place of a half wave one. What changes at the filter capacitor?',
    options: [
      'Nothing, because the two produce the same waveform',
      'It is no longer needed at all',
      'It is recharged half as often, so the ripple is larger',
      'It is recharged twice as often, so the ripple is smaller for the same capacitance',
    ],
    answer: 3,
  },
  {
    id: 'b-m2-c4-a', moduleId: 'm2', pair: 'm2-c4', form: 'A',
    competency: 'Perform variable regulated power supply assembly.',
    stem: 'A regulator is set for 12 V, but the voltage across the filter capacitor sags to 13 V under load. What happens at the output?',
    options: [
      'It holds 12 V, because that is what regulation means',
      'It follows the input down, because a regulator needs a few volts more than its output to regulate',
      'It rises above 12 V to compensate',
      'It shuts off completely and reads zero',
    ],
    answer: 1,
  },
  {
    id: 'b-m2-c4-b', moduleId: 'm2', pair: 'm2-c4', form: 'B',
    competency: 'Perform variable regulated power supply assembly.',
    stem: 'You have assembled a variable supply and the output will not rise above about 9 V, although the control is at maximum. Where do you look first?',
    options: [
      'At the transformer and rectifier, because the unregulated voltage feeding the regulator may be too low',
      'At the output terminals, which are probably shorted',
      'At the meter, which is probably misreading',
      'At the load, which is probably too small',
    ],
    answer: 0,
  },
]
