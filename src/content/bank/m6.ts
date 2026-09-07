import type { BankItem } from '../../lib/types'

export const m6Bank: BankItem[] = [
  {
    id: 'b-m6-c1-a', moduleId: 'm6', pair: 'm6-c1', form: 'A',
    competency: 'Discuss the principles of fire alarm systems.',
    stem: 'What is the purpose of the end of line resistor on a conventional detection zone?',
    options: [
      'To limit the current drawn by the detectors on that zone',
      'To drop the panel voltage to the level the detectors need',
      'To sound the alarm when the zone is triggered',
      'To let the panel tell an open circuit fault from a healthy quiet zone',
    ],
    answer: 3,
  },
  {
    id: 'b-m6-c1-b', moduleId: 'm6', pair: 'm6-c1', form: 'B',
    competency: 'Discuss the principles of fire alarm systems.',
    stem: 'A manual call point and a smoke detector are on the same zone. What does the panel show when either operates?',
    options: [
      'An alarm on that zone, without saying which device it was',
      'A fault on that zone rather than an alarm',
      'The exact device that operated',
      'Nothing until a second device also operates',
    ],
    answer: 0,
  },
  {
    id: 'b-m6-c2-a', moduleId: 'm6', pair: 'm6-c2', form: 'A',
    competency: 'Perform the procedure in fire alarm system installation.',
    stem: 'Why must detection cable be kept away from mains cable where the two run together?',
    options: [
      'Because the mains cable will physically damage it',
      'Because the two cables are the same colour and would be confused',
      'Because interference coupled from the mains can produce false alarms and faults',
      'Because the detection cable would overheat',
    ],
    answer: 2,
  },
  {
    id: 'b-m6-c2-b', moduleId: 'm6', pair: 'm6-c2', form: 'B',
    competency: 'Perform the procedure in fire alarm system installation.',
    stem: 'After wiring a new zone, the panel reports an open circuit fault on it. What is the most likely cause?',
    options: [
      'Too many detectors were fitted to the zone',
      'The panel needs its battery replaced',
      'The detectors were fitted the wrong way up',
      'The end of line resistor is missing or the loop is broken before it',
    ],
    answer: 3,
  },
]
