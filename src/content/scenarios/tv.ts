import type { Scenario } from '../../lib/diagnose'

export const tvScenario: Scenario = {
  id: 'tv',
  appliance: 'Flat screen television',
  symptom: 'Sound is normal and the set responds to the remote, but the screen stays black. The standby light works as usual.',
  safety: [
    'Unplug the set, discharge the large filter capacitors on the power supply board through a bleeder resistor, and then confirm with the meter that they read close to zero volts before touching anything.',
    'Never lever, twist or press the panel. It is a sheet of glass and it will crack, which ends the repair and can cut you.',
    'Lay the set face down on a clean flat surface with the stand removed, and get someone to help you turn it.',
  ],
  faults: [
    { id: 'psu', label: 'Failed power supply board', remedy: 'Replace the board, or the failed section of it if the fault is a swollen capacitor and you are equipped to rework it.' },
    { id: 'backlight', label: 'Failed backlight', remedy: 'Replace the failed strip or the whole set of strips. Replacing one alone often leaves a visibly uneven picture.' },
    { id: 'tcon', label: 'Failed timing board', remedy: 'Replace the board with the exact part for this panel. They are not interchangeable between panels.' },
    { id: 'main', label: 'Failed main board', remedy: 'Replace the board with the exact part for this model.' },
    { id: 'panel', label: 'Cracked panel', remedy: 'The set is not economic to repair. Tell the owner before doing anything else.' },
  ],
  actualFault: 'backlight',
  testPoints: [
    {
      id: 'tp-standby', label: 'Standby rail', action: 'DC volts on the standby rail at the power supply board with the set switched on.',
      readings: { psu: '0.0 V', '*': '5.1 V, steady' },
      implicates: ['psu'],
    },
    {
      id: 'tp-torch', label: 'Torch test', action: 'Shine a torch at the screen at a shallow angle with the set on, and look closely for a faint image.',
      readings: {
        backlight: 'A faint but complete picture is visible under the torch',
        panel: 'A cracked line runs across the panel under the torch',
        '*': 'Nothing visible under the torch',
      },
      implicates: ['backlight', 'panel'],
    },
    {
      id: 'tp-bldriver', label: 'Backlight driver', action: 'DC volts on the backlight driver output with the set switched on.',
      readings: { backlight: '0.0 V, and the enable line is present', '*': '128 V' },
      implicates: ['backlight'],
    },
    {
      id: 'tp-tcon', label: 'Timing board', action: 'Substitute a timing board known to be working for this panel.',
      readings: { tcon: 'The picture returns with the substitute fitted', '*': 'No change with the substitute fitted' },
      implicates: ['tcon'],
    },
    {
      id: 'tp-main', label: 'Main board', action: 'Check the main board is producing video on its output to the timing board.',
      readings: { main: 'No signal on the output', '*': 'Signal present on the output' },
      implicates: ['main'],
    },
  ],
}
