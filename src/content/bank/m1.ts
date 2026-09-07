import type { BankItem } from '../../lib/types'

export const m1Bank: BankItem[] = [
  {
    id: 'b-m1-c1-a', moduleId: 'm1', pair: 'm1-c1', form: 'A',
    competency: 'Explain the overview of Electronic Systems Servicing.',
    stem: 'A customer reports a fault. What does a technician do before opening the appliance?',
    options: [
      'Order the part that fails most often on that model so it is on hand when the visit begins',
      'Confirm the symptom for themselves, and note the conditions under which it appears',
      'Strip the appliance down to its bare boards so every part can be inspected at once',
      'Quote the customer a firm price for the repair before the fault has been seen',
    ],
    answer: 1,
  },
  {
    id: 'b-m1-c1-b', moduleId: 'm1', pair: 'm1-c1', form: 'B',
    competency: 'Explain the overview of Electronic Systems Servicing.',
    stem: 'Why does a technician work from the symptom towards the fault rather than replacing likely parts?',
    options: [
      'Because swapping in new parts one at a time always takes longer than making a measurement',
      'Because spare parts are hard to obtain and usually have to be ordered in from another supplier',
      'Because consumer protection law requires every repair to be backed by a written meter reading',
      'Because a replaced part that was healthy leaves the fault in place and costs the owner money',
    ],
    answer: 3,
  },
  {
    id: 'b-m1-c2-a', moduleId: 'm1', pair: 'm1-c2', form: 'A',
    competency: 'Discuss electronic components identification.',
    stem: 'A resistor is banded red, violet, brown, gold. What is its value?',
    options: [
      '27 ohms',
      '270 ohms',
      '2.7 kilohms',
      '270 kilohms',
    ],
    answer: 1,
  },
  {
    id: 'b-m1-c2-b', moduleId: 'm1', pair: 'm1-c2', form: 'B',
    competency: 'Discuss electronic components identification.',
    stem: 'A resistor is banded brown, black, orange, gold. What is its value?',
    options: [
      '10 ohms',
      '100 ohms',
      '1 kilohm',
      '10 kilohms',
    ],
    answer: 3,
  },
  {
    id: 'b-m1-c3-a', moduleId: 'm1', pair: 'm1-c3', form: 'A',
    competency: 'Demonstrate procedures in testing electronic components.',
    stem: 'A meter set to ohms reads OL across a component that should conduct. What does that mean?',
    options: [
      'The component is short circuit',
      'The meter is on the wrong range and the reading means nothing',
      'The path through the component is broken',
      'The component is within tolerance',
    ],
    answer: 2,
  },
  {
    id: 'b-m1-c3-b', moduleId: 'm1', pair: 'm1-c3', form: 'B',
    competency: 'Demonstrate procedures in testing electronic components.',
    stem: 'Why must a component be tested with the circuit unpowered and at least one leg lifted?',
    options: [
      'Because the rest of the circuit offers other paths, so the reading is of the board and not the component',
      'Because the meter would show the result in the wrong units while the component is still in place',
      'Because the small test current from the meter would overheat and damage the component while it is still wired in',
      'Because a meter cannot take a resistance reading at all while the circuit around it is still powered',
    ],
    answer: 0,
  },
]
