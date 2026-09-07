import type { Scenario } from '../../lib/diagnose'

export const motorControlScenario: Scenario = {
  id: 'motor-control',
  appliance: 'Motor control board',
  symptom: 'The motor starts correctly, but it keeps running when the limit switch is reached instead of stopping. Pressing stop does halt it.',
  safety: [
    'Isolate the supply and lock it off before opening the enclosure, because this motor can start on its own when a control signal changes. Prove the load side is dead with the meter before you touch it.',
    'Keep hands, sleeves and tools clear of the driven mechanism at all times, even with the supply removed.',
    'Tell whoever operates this machine that it is out of service, and do not rely on a note left on the panel.',
  ],
  faults: [
    { id: 'switch', label: 'Faulty limit switch', remedy: 'Replace the switch, and set the actuator so it operates fully rather than just touching.' },
    { id: 'wiring', label: 'Break in the switch wiring', remedy: 'Repair the break in a proper enclosure and support the cable so it does not flex at the terminal.' },
    { id: 'input', label: 'Failed controller input', remedy: 'The board needs service. Do not bypass the input to keep the machine running.' },
    { id: 'coil', label: 'Open relay coil', remedy: 'Replace the relay with the same coil voltage and contact rating.' },
    { id: 'contacts', label: 'Welded relay contacts', remedy: 'Replace the relay. Welded contacts mean it has been switching more current than it is rated for, so find out why before fitting a new one.' },
  ],
  actualFault: 'contacts',
  testPoints: [
    {
      id: 'tp-switch', label: 'Limit switch', action: 'Continuity across the limit switch while an assistant operates it by hand.',
      readings: { switch: 'No change when operated', '*': 'Opens cleanly when operated' },
      implicates: ['switch'],
    },
    {
      id: 'tp-wiring', label: 'Switch wiring', action: 'Continuity from the switch terminals back to the controller input terminals.',
      readings: { wiring: 'OL on one core', '*': '0.4 ohm, meter beeps' },
      implicates: ['wiring'],
    },
    {
      id: 'tp-input', label: 'Controller input', action: 'Watch the controller input indicator while the switch is operated.',
      readings: { input: 'The indicator does not change state', '*': 'The indicator changes state as the switch is operated' },
      implicates: ['input'],
    },
    {
      id: 'tp-coil', label: 'Relay coil', action: 'DC volts across the relay coil when the controller should have dropped it out.',
      readings: { coil: 'Coil is energised when it should not be', '*': '0.0 V, so the controller has dropped it out correctly' },
      implicates: ['coil'],
    },
    {
      id: 'tp-contacts', label: 'Relay contacts', action: 'Continuity across the relay contacts with the coil de-energised and the relay removed from circuit.',
      readings: { contacts: '0.1 ohm, still closed with no coil voltage', '*': 'OL, open as it should be' },
      implicates: ['contacts'],
    },
  ],
}
