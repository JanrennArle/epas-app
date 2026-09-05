import type { Scenario } from '../../lib/diagnose'

export const fanScenario: Scenario = {
  id: 'fan',
  appliance: 'Electric fan',
  symptom: 'The fan is plugged in and switched on, but nothing happens. No noise, no movement, no smell of burning.',
  safety: [
    'Unplug the fan from the outlet before opening any part of it.',
    'Set your multimeter to continuity or resistance, never to volts, for a dead unit you have isolated.',
    'Check the capacitor is discharged before touching the motor terminals.',
  ],
  faults: [
    { id: 'cord', label: 'Broken supply cord', remedy: 'Replace the cord, or re-terminate it if the break is at the plug.' },
    { id: 'fuse', label: 'Open thermal fuse', remedy: 'Fit a thermal fuse of the same rating and temperature. Never bridge it.' },
    { id: 'switch', label: 'Faulty speed switch', remedy: 'Clean or replace the switch assembly.' },
    { id: 'capacitor', label: 'Failed run capacitor', remedy: 'Replace with the same microfarad and voltage rating.' },
    { id: 'winding', label: 'Open motor winding', remedy: 'Rewind or replace the motor. Usually not economical on a small fan.' },
  ],
  actualFault: 'fuse',
  testPoints: [
    {
      id: 'tp-plug', label: 'Supply cord', action: 'Continuity across the plug pins with the switch on speed 1.',
      readings: { cord: 'OL', '*': '0.6 ohm, meter beeps' },
      implicates: ['cord'],
    },
    {
      id: 'tp-switch', label: 'Speed switch', action: 'Continuity across the switch contacts, worked through each speed.',
      readings: { switch: 'OL on every speed', '*': 'Beeps on each speed in turn' },
      implicates: ['switch'],
    },
    {
      id: 'tp-fuse', label: 'Thermal fuse', action: 'Continuity across the thermal fuse buried in the motor windings.',
      readings: { fuse: 'OL', '*': '0.2 ohm, meter beeps' },
      implicates: ['fuse'],
    },
    {
      id: 'tp-cap', label: 'Run capacitor', action: 'Capacitance across the run capacitor, discharged first.',
      readings: { capacitor: '0.1 uF against a marked 1.5 uF', '*': '1.48 uF against a marked 1.5 uF' },
      implicates: ['capacitor'],
    },
    {
      id: 'tp-wind', label: 'Motor winding', action: 'Resistance across the main winding.',
      readings: { winding: 'OL', '*': '312 ohm' },
      implicates: ['winding'],
    },
  ],
}
