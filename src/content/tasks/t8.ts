import type { PerformanceTask } from '../../lib/types'

export const t8: PerformanceTask = {
  id: 't8',
  kind: 'group',
  title: 'Integrated system servicing of a motor controller with sensors and actuators',
  brief:
    'In groups, learners service and restore the operation of a simulated motor control system integrated with sensors (e.g., limit switch, proximity sensor) and actuators (e.g., relay-controlled motor, solenoid), by analyzing the wiring diagram, diagnosing faults, correcting wiring or component issues, and performing full system testing while ensuring strict compliance with safety precautions.',
  modules: ['m9'],
  safety: [
    'Isolate the supply and lock it off before opening the enclosure, because a motor can start on its own when a control signal changes. Prove the load side is dead with the meter before you touch it.',
    'Keep hands, sleeves and tools clear of the driven mechanism at all times, even with the supply removed.',
    'Tell whoever operates this machine that it is out of service, and do not rely on a note left on the panel.',
    'When the sequence needs the controller watched while it runs, restore the control supply only and leave the motor branch isolated.',
  ],
  steps: [
    'Agree from the wiring diagram what the system should do at each position, before anyone decides what is broken.',
    'Isolate the supply, lock it off, and prove the load side dead at the point you are about to touch.',
    'Still isolated, test each sensor by changing what it senses and watching the reading move, remembering that a proximity sensor needs its own supply and a limit switch does not.',
    'Still isolated, test the wiring from each sensor back to the controller input.',
    'Take each actuator off the machine and give it its rated signal from a bench supply, watching it act. The machine stays isolated throughout; the only thing energised is the actuator on the bench.',
    'Correct the wiring or fit the parts the readings condemned, and nothing else. If a relay contact was welded, find what made it weld before you fit the new relay, or the new one will weld too.',
    'Restore the control supply only, leaving the motor branch isolated, and watch the controller inputs change state as the mechanism is moved by hand.',
    'Restore the full supply with the guard in place, then run the machine through every position and confirm it stops where it should.',
  ],
  rubric: [
    { criterion: 'Reading the system', descriptor: 'The wiring diagram is used to agree the intended behaviour before any fault is named.', points: 5 },
    { criterion: 'Systematic diagnosis', descriptor: 'Sensor, wiring, controller input and actuator are followed in order rather than swapped at random.', points: 6 },
    { criterion: 'Corrective work', descriptor: 'Only what the readings condemned is changed, it is fitted to the same rating, and a welded contact is traced to its cause rather than simply replaced.', points: 4 },
    { criterion: 'Safe working', descriptor: 'The supply was locked off and proved dead, the mechanism was kept clear, and the control supply was restored alone before the motor branch.', points: 6 },
    { criterion: 'Working as a group', descriptor: 'The isolation is announced, findings are shared, and every member can explain the control sequence.', points: 4 },
  ],
}
