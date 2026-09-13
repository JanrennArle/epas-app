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
    'Keep hands, sleeves and tools clear of the driven mechanism whenever anything is energised. Where a step asks you to move it by hand, the motor branch is isolated and locked off first, and the step says so.',
    'Tell whoever operates this machine that it is out of service, and do not rely on a note left on the panel.',
    'When the sequence needs the controller watched while it runs, restore the control supply only and leave the motor branch isolated.',
  ],
  steps: [
    'Agree from the wiring diagram what the system should do at each position, before anyone decides what is broken.',
    'Isolate the supply, lock it off, prove the load side dead at the point you are about to touch, and open the enclosure.',
    'Still isolated and open, test the passive sensors by changing what they sense and watching the reading move: a limit switch operated by hand while you watch continuity, a thermistor warmed while you watch resistance.',
    'A proximity sensor is the exception, because it produces no output at all without power. Close the enclosure, restore the control supply only with the motor branch still isolated and locked off, then present the target to the sensor and watch the indicator on the sensor body change. Isolate and lock off again, and open the enclosure, before you touch anything inside it.',
    'Still isolated and open, test the wiring from each sensor back to the controller input.',
    'Take each actuator off the machine and give it its rated signal from a bench supply, watching it act. The machine stays isolated throughout; the only thing energised is the actuator on the bench.',
    'Correct the wiring or fit the parts the readings condemned, and nothing else. If a relay contact was welded, find what made it weld before you fit the new relay, or the new one will weld too.',
    'Still isolated and locked off, refit every actuator you took off the machine, to its own position and its own terminals, and check each one is mechanically secure before anything is energised.',
    'Isolate, lock off and close the enclosure, then restore the control supply only, leaving the motor branch isolated and locked off, and watch the controller inputs change state as the mechanism is moved by hand. Moving it by hand is safe only because that branch is locked off, which is the whole reason this step comes before the next one.',
    'Restore the full supply with the guard in place and everyone clear of the mechanism, then run the machine through every position and confirm it stops where it should.',
  ],
  rubric: [
    { criterion: 'Reading the system', descriptor: 'The wiring diagram is used to agree the intended behaviour before any fault is named.', points: 5 },
    { criterion: 'Systematic diagnosis', descriptor: 'Sensor, wiring, controller input and actuator are followed in order rather than swapped at random.', points: 6 },
    { criterion: 'Corrective work', descriptor: 'Only what the readings condemned is changed, it is fitted to the same rating, and a welded contact is traced to its cause rather than simply replaced.', points: 4 },
    { criterion: 'Safe working', descriptor: 'The supply was locked off and proved dead, the mechanism was touched only at the step that asks for it and only with the motor branch locked off, and the control supply was restored alone before the motor branch.', points: 6 },
    { criterion: 'Working as a group', descriptor: 'The isolation is announced, findings are shared, and every member can explain the control sequence.', points: 4 },
  ],
}
