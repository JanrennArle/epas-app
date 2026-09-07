import type { BankItem } from '../../lib/types'

export const m6Bank: BankItem[] = [
  {
    id: 'b-m6-c1-a', moduleId: 'm6', pair: 'm6-c1', form: 'A',
    competency: 'Discuss the principles of fire alarm systems.',
    stem: 'What is the purpose of the end of line resistor on a conventional detection zone?',
    options: [
      'To hold down the current drawn by all the detectors sitting on that one zone',
      'To drop the panel voltage to the lower level that the detectors are built to run on',
      'To sound the alarm on the panel the moment any detector on the zone is triggered',
      'To let the panel tell an open circuit fault from a healthy quiet zone',
    ],
    answer: 3,
  },
  {
    id: 'b-m6-c1-b', moduleId: 'm6', pair: 'm6-c1', form: 'B',
    competency: 'Discuss the principles of fire alarm systems.',
    stem: 'A manual call point and a smoke detector are on the same zone. What does the panel show when either operates?',
    options: [
      'Nothing at all until a second device on the zone also operates',
      'A fault warning on that zone rather than a fire alarm signal',
      'The exact device that operated, named on the panel display',
      'An alarm on that zone, without saying which device it was',
    ],
    answer: 3,
  },
  {
    id: 'b-m6-c2-a', moduleId: 'm6', pair: 'm6-c2', form: 'A',
    competency: 'Perform the procedure in fire alarm system installation.',
    stem: 'Why must detection cable be kept away from mains cable where the two run together?',
    options: [
      'Because interference coupled from the mains can produce false alarms and faults',
      'Because the two cables share a colour and an installer would later confuse them',
      'Because the mains cable will chafe through the thinner detection cable over time',
      'Because running beside the mains makes the detection cable heat up and its insulation fail',
    ],
    answer: 0,
  },
  {
    id: 'b-m6-c2-b', moduleId: 'm6', pair: 'm6-c2', form: 'B',
    competency: 'Perform the procedure in fire alarm system installation.',
    stem: 'After wiring a new zone, the panel reports an open circuit fault on it. What is the most likely cause?',
    options: [
      'The end of line resistor is missing or the loop is broken before it',
      'The panel needs its standby battery replaced before the zone will read',
      'The detectors were fitted the wrong way round, so their indicator lamps stay off',
      'Too many detectors were fitted to the zone for the panel to drive',
    ],
    answer: 0,
  },
]
