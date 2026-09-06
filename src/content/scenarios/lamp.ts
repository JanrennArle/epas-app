import type { Scenario } from '../../lib/diagnose'

export const lampScenario: Scenario = {
  id: 'lamp',
  appliance: 'Rechargeable LED lamp',
  symptom: 'The lamp runs for only a few minutes off the battery.',
  safety: [
    'Unplug the charger and switch the lamp off before opening the case.',
    'Treat the cell as live at all times, because a lithium cell cannot be switched off and a shorted one can vent or catch fire.',
    'Never puncture, bend or solder directly onto a lithium cell body.',
  ],
  faults: [
    { id: 'adaptor', label: 'Faulty charger adaptor', remedy: 'Replace the adaptor with one of the same output voltage and at least the same current rating.' },
    { id: 'jack', label: 'Broken charging jack', remedy: 'Resolder or replace the jack. The joints crack from repeated plugging.' },
    { id: 'charger', label: 'Failed charging circuit', remedy: 'Replace the charging board. Do not bypass it and charge the cell directly.' },
    { id: 'cell', label: 'Worn rechargeable cell', remedy: 'Fit a cell of the same chemistry, voltage and capacity, with its protection circuit intact.' },
    { id: 'led', label: 'Failed LED array', remedy: 'Replace the LED board.' },
  ],
  actualFault: 'cell',
  testPoints: [
    {
      id: 'tp-adaptor', label: 'Charger adaptor', action: 'DC volts across the adaptor output, unloaded.',
      readings: { adaptor: '0.0 V', '*': '5.1 V' },
      implicates: ['adaptor'],
    },
    {
      id: 'tp-jack', label: 'Charging jack', action: 'DC volts at the jack solder pads with the adaptor plugged in.',
      readings: { jack: '0.0 V, and the reading flickers when you wiggle the plug', '*': '5.0 V, steady' },
      implicates: ['jack'],
    },
    {
      id: 'tp-charge', label: 'Charging circuit output', action: 'DC volts at the charging board output, on charge.',
      readings: { charger: '0.0 V', '*': '4.1 V' },
      implicates: ['charger'],
    },
    {
      id: 'tp-cell', label: 'Cell', action: 'DC volts across the cell with the charger unplugged, after ten minutes on charge.',
      readings: { cell: '3.1 V, and it falls to 2.8 V as soon as the lamp is switched on', '*': '4.0 V, steady under load' },
      implicates: ['cell'],
    },
    {
      id: 'tp-led', label: 'LED array', action: 'Diode test across the LED board input.',
      readings: { led: 'OL', '*': '2.71 V forward, the array glows faintly' },
      implicates: ['led'],
    },
  ],
}
