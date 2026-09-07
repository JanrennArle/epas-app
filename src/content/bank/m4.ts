import type { BankItem } from '../../lib/types'

export const m4Bank: BankItem[] = [
  {
    id: 'b-m4-c1-a', moduleId: 'm4', pair: 'm4-c1', form: 'A',
    competency: 'Discuss the procedures in servicing appliances with heating components.',
    stem: 'What does a heating element do when it fails open?',
    options: [
      'It draws more current than normal and blows the fuse',
      'It heats continuously and cannot be switched off',
      'It passes no current at all, so the appliance stays cold',
      'It heats more slowly but still reaches temperature',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c1-b', moduleId: 'm4', pair: 'm4-c1', form: 'B',
    competency: 'Discuss the procedures in servicing appliances with heating components.',
    stem: 'What is a thermostat in a heating appliance for?',
    options: [
      'To limit the current the element can draw',
      'To convert the mains to a lower voltage for the element',
      'To open the circuit once the set temperature is reached and close it again as it falls',
      'To warn the user that the appliance is hot',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c2-a', moduleId: 'm4', pair: 'm4-c2', form: 'A',
    competency: 'Apply procedure in servicing appliances with heating components.',
    stem: 'An iron does not heat. The element measures open. What should you establish before fitting a new element?',
    options: [
      'Whether the thermal cutout has operated, and if so what made it operate',
      'Nothing, an open element is the whole fault',
      'Whether the soleplate is scratched',
      'Whether the flex is long enough',
    ],
    answer: 0,
  },
  {
    id: 'b-m4-c2-b', moduleId: 'm4', pair: 'm4-c2', form: 'B',
    competency: 'Apply procedure in servicing appliances with heating components.',
    stem: 'An iron heats but never switches off, and the soleplate keeps getting hotter. What has failed?',
    options: [
      'The heating element has gone open circuit',
      'The thermal cutout has operated',
      'The mains flex has a broken core',
      'The thermostat contacts have welded closed',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c3-a', moduleId: 'm4', pair: 'm4-c3', form: 'A',
    competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
    stem: 'A rechargeable lamp runs for only a few minutes on a full charge. What does that indicate?',
    options: [
      'The charger is delivering too much current',
      'The lamp is being switched on too often',
      'The light emitting diodes have dimmed with age',
      'The cell has lost capacity and no longer holds the charge it once did',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c3-b', moduleId: 'm4', pair: 'm4-c3', form: 'B',
    competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
    stem: 'A lithium cell in a lamp is swollen and warm to the touch. What do you do?',
    options: [
      'Charge it fully once more to see whether it recovers',
      'Run the lamp until the cell is flat, then replace it',
      'Pierce it to release the pressure before disposal',
      'Isolate it, do not charge it, and do not refit it',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c4-a', moduleId: 'm4', pair: 'm4-c4', form: 'A',
    competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
    stem: 'A string of light emitting diodes wired in series has one open device. What do you see?',
    options: [
      'Only that one diode is dark and the rest still light',
      'The whole string is dark, because the current path is broken',
      'The remaining diodes light more brightly',
      'The string flickers but stays lit',
    ],
    answer: 1,
  },
  {
    id: 'b-m4-c4-b', moduleId: 'm4', pair: 'm4-c4', form: 'B',
    competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
    stem: 'Why is a current limiting resistor or driver fitted in series with a light emitting diode?',
    options: [
      'To convert alternating current to direct current for the diode',
      'To protect the diode from reverse voltage',
      'To make the diode switch on more quickly',
      'To drop the supply to the diode forward voltage and hold the current at a safe value',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c5-a', moduleId: 'm4', pair: 'm4-c5', form: 'A',
    competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
    stem: 'What does the recorder in a closed circuit television system do?',
    options: [
      'It supplies power to the cameras and nothing else',
      'It focuses each camera lens remotely',
      'It receives the video from the cameras, stores it, and presents it for viewing',
      'It converts the analogue signal to a radio broadcast',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c5-b', moduleId: 'm4', pair: 'm4-c5', form: 'B',
    competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
    stem: 'One camera in a working system shows no picture, while the others are normal. What does that prove about the recorder?',
    options: [
      'That the recorder is working, because it is displaying the other cameras',
      'That the recorder has failed and needs replacing',
      'Nothing at all about the recorder',
      'That the recorder needs its storage cleared',
    ],
    answer: 0,
  },
]
