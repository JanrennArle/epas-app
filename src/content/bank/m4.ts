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
      'To hold the current the element draws down to a fixed safe limit at all times',
      'To convert the incoming mains supply down to the lower voltage that the heating element runs on',
      'To open the circuit once the set temperature is reached and close it again as it falls',
      'To warn the user with a light or a tone whenever the appliance has become hot',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c2-a', moduleId: 'm4', pair: 'm4-c2', form: 'A',
    competency: 'Apply procedure in servicing appliances with heating components.',
    stem: 'An iron does not heat. The element measures open. What should you establish before fitting a new element?',
    options: [
      'Nothing else is needed, because an open element is the whole of the fault here',
      'Whether the thermal cutout has operated, and if so what made it operate',
      'Whether the soleplate is scratched or pitted enough to need refacing',
      'Whether the mains flex is long enough to reach a wall socket across the room',
    ],
    answer: 1,
  },
  {
    id: 'b-m4-c2-b', moduleId: 'm4', pair: 'm4-c2', form: 'B',
    competency: 'Apply procedure in servicing appliances with heating components.',
    stem: 'An iron heats but never switches off, and the soleplate keeps getting hotter. What has failed?',
    options: [
      'The heating element has gone open circuit',
      'The thermal cutout has operated',
      'The thermostat contacts have welded closed',
      'The mains flex has a broken core',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c3-a', moduleId: 'm4', pair: 'm4-c3', form: 'A',
    competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
    stem: 'A rechargeable lamp runs for only a few minutes on a full charge. What does that indicate?',
    options: [
      'The cell has lost capacity and no longer holds the charge it once did',
      'The lamp is simply being switched on and off far too often between charges',
      'The light emitting diodes have dimmed with age and now give up sooner',
      'The charger is pushing too much current into the cell and cutting the run short',
    ],
    answer: 0,
  },
  {
    id: 'b-m4-c3-b', moduleId: 'm4', pair: 'm4-c3', form: 'B',
    competency: 'Discuss the procedures in servicing rechargeable and electronic-controlled lighting units.',
    stem: 'A lithium cell in a lamp is swollen and warm to the touch. What do you do?',
    options: [
      'Charge it fully once more to see whether it recovers',
      'Run the lamp until the cell is flat, then replace it',
      'Isolate it, do not charge it, and do not refit it',
      'Pierce it to release the pressure before disposal',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c4-a', moduleId: 'm4', pair: 'm4-c4', form: 'A',
    competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
    stem: 'A string of light emitting diodes wired in series has one open device. What do you see?',
    options: [
      'Only the one failed diode goes dark and the rest of the string stays lit',
      'The whole string is dark, because the current path is broken',
      'The other diodes light more brightly, sharing the voltage the dead one dropped',
      'The string flickers but stays lit as current finds a way round the break',
    ],
    answer: 1,
  },
  {
    id: 'b-m4-c4-b', moduleId: 'm4', pair: 'm4-c4', form: 'B',
    competency: 'Demonstrate the procedure in servicing electronic controlled lighting units.',
    stem: 'Why is a current limiting resistor or driver fitted in series with a light emitting diode?',
    options: [
      'To turn the alternating mains supply into the direct current that the diode needs to light up',
      'To protect the diode from reverse voltage that would otherwise puncture the junction',
      'To drop the supply to the diode forward voltage and hold the current at a safe value',
      'To make the diode switch on and off more quickly and crisply when it is pulsed',
    ],
    answer: 2,
  },
  {
    id: 'b-m4-c5-a', moduleId: 'm4', pair: 'm4-c5', form: 'A',
    competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
    stem: 'What does the recorder in a closed circuit television system do?',
    options: [
      'It only supplies power to the cameras and does nothing with the pictures they send',
      'It focuses and aims each camera lens by remote control',
      'It converts the camera signal into a radio broadcast that any receiver nearby can pick up',
      'It receives the video from the cameras, stores it, and presents it for viewing',
    ],
    answer: 3,
  },
  {
    id: 'b-m4-c5-b', moduleId: 'm4', pair: 'm4-c5', form: 'B',
    competency: 'Discuss the principles of Closed-Circuit Television (CCTV) system.',
    stem: 'One camera in a working system shows no picture, while the others are normal. What does that prove about the recorder?',
    options: [
      'That the recorder has failed on that one input and the whole unit needs replacing',
      'That the recorder is working, because it is displaying the other cameras',
      'Nothing at all about the recorder can be told from a single dead camera',
      'That the recorder has filled its storage and cannot take the extra camera in',
    ],
    answer: 1,
  },
]
