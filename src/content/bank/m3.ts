import type { BankItem } from '../../lib/types'

export const m3Bank: BankItem[] = [
  {
    id: 'b-m3-c1-a', moduleId: 'm3', pair: 'm3-c1', form: 'A',
    competency: 'Discuss the procedures in servicing appliances with electric motors.',
    stem: 'Which motor type has no capacitor at all?',
    options: [
      'A permanent split capacitor motor',
      'A shaded pole motor',
      'A capacitor start motor',
      'A capacitor start capacitor run motor',
    ],
    answer: 1,
  },
  {
    id: 'b-m3-c1-b', moduleId: 'm3', pair: 'm3-c1', form: 'B',
    competency: 'Discuss the procedures in servicing appliances with electric motors.',
    stem: 'A motor hums but does not turn, and then runs if the shaft is nudged by hand. What does that point to?',
    options: [
      'A loss of starting torque, most often from a failed capacitor',
      'A seized bearing',
      'A break in the supply lead',
      'An open main winding',
    ],
    answer: 0,
  },
  {
    id: 'b-m3-c2-a', moduleId: 'm3', pair: 'm3-c2', form: 'A',
    competency: 'Apply procedures in servicing appliances with electric motors.',
    stem: 'Before putting an ohmmeter across a motor capacitor, what must you do?',
    options: [
      'Run the motor briefly so the capacitor is warm',
      'Set the meter to AC volts first',
      'Isolate the appliance, discharge the capacitor, and confirm with the meter that it reads close to zero volts',
      'Nothing, because a capacitor holds no charge once the motor has stopped',
    ],
    answer: 2,
  },
  {
    id: 'b-m3-c2-b', moduleId: 'm3', pair: 'm3-c2', form: 'B',
    competency: 'Apply procedures in servicing appliances with electric motors.',
    stem: 'A fan motor turns freely by hand and its windings read a sensible resistance, but it still will not start. What remains most likely?',
    options: [
      'The bearings, despite turning freely',
      'The capacitor, which neither test so far has examined',
      'The windings, despite the sensible reading',
      'The blade, which must be fouling the housing',
    ],
    answer: 1,
  },
]
