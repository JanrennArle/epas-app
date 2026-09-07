import type { BankItem } from '../../lib/types'

export const m1Bank: BankItem[] = [
  {
    id: 'b-m1-c1-a', moduleId: 'm1', pair: 'm1-c1', form: 'A',
    competency: 'Explain the overview of Electronic Systems Servicing.',
    stem: 'A customer reports a fault. What does a technician do before opening the appliance?',
    options: [
      'Order the part most likely to be at fault',
      'Confirm the symptom for themselves, and note the conditions under which it appears',
      'Strip the appliance down to its boards',
      'Quote the price of the repair',
    ],
    answer: 1,
  },
  {
    id: 'b-m1-c1-b', moduleId: 'm1', pair: 'm1-c1', form: 'B',
    competency: 'Explain the overview of Electronic Systems Servicing.',
    stem: 'Why does a technician work from the symptom towards the fault rather than replacing likely parts?',
    options: [
      'Because replacing parts is slower than measuring',
      'Because parts are difficult to obtain',
      'Because measurement is required by law',
      'Because a replaced part that was healthy leaves the fault in place and costs the owner money',
    ],
    answer: 3,
  },
  {
    id: 'b-m1-c2-a', moduleId: 'm1', pair: 'm1-c2', form: 'A',
    competency: 'Discuss electronic components identification.',
    stem: 'Which component is polarised, so that fitting it the wrong way round will damage it?',
    options: [
      'A carbon film resistor',
      'An electrolytic capacitor',
      'A ceramic capacitor',
      'A wirewound inductor',
    ],
    answer: 1,
  },
  {
    id: 'b-m1-c2-b', moduleId: 'm1', pair: 'm1-c2', form: 'B',
    competency: 'Discuss electronic components identification.',
    stem: 'A resistor is banded brown, black, orange, gold. What is its value?',
    options: [
      '10 ohms',
      '1 kilohm',
      '100 ohms',
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
      'Because the reading would be in the wrong units',
      'Because the component would be damaged by the meter otherwise',
      'Because a meter cannot read while a circuit is powered',
    ],
    answer: 0,
  },
]
