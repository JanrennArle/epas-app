import type { PerformanceTask } from '../../lib/types'

export const t2: PerformanceTask = {
  id: 't2',
  kind: 'group',
  title: 'Electronic circuit assembly and functional testing project',
  brief:
    'In groups, learners assemble and test an electronic project (e.g., amplifier circuit, LED flasher, or regulated bench power supply) by interpreting the schematic diagram, properly mounting and soldering components, inspecting connections, and performing functional testing to ensure the circuit operates according to specifications and established standards.',
  modules: ['m1', 'm2'],
  safety: [
    'One person works on the board at a time. A second pair of hands on a live board is how a short becomes an injury.',
    'Connect the instruments before power goes on, and take power off before anyone touches the board again.',
    'Filter capacitors hold their charge after power is removed. Discharge them and prove them dead with a meter before working on the board.',
  ],
  steps: [
    'Read the schematic together and agree who mounts, who solders and who tests, so nobody is soldering a board another person has a probe on.',
    'Check every component against the parts list and set aside any that are the wrong value before anything is soldered.',
    'Mount and solder the components with the board unpowered, working from the shortest parts to the tallest.',
    'Inspect every joint under good light, and check continuity across the supply rails so that a bridge is found by you rather than by the power supply.',
    'Connect the test instruments first, then apply power for the first time with one person watching the current draw.',
    'Work through the functional tests the schematic calls for, and write each reading down as you take it rather than at the end.',
    'Take the power off and discharge the filter capacitors before anyone touches the board to correct something.',
    'Restore the power and repeat the functional tests after every correction, not only after the last one.',
  ],
  rubric: [
    { criterion: 'Reading the schematic', descriptor: 'The built circuit matches the schematic, including component values and orientation.', points: 5 },
    { criterion: 'Assembly and soldering', descriptor: 'Components are mounted neatly and every joint is sound.', points: 5 },
    { criterion: 'Functional testing', descriptor: 'The tests the schematic calls for are carried out and the readings are recorded as they are taken.', points: 5 },
    { criterion: 'Working as a group', descriptor: 'The work is shared, one person is on the board at a time, and every member can explain what the circuit does.', points: 5 },
  ],
}
