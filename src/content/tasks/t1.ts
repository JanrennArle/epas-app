import type { PerformanceTask } from '../../lib/types'

export const t1: PerformanceTask = {
  id: 't1',
  kind: 'individual',
  title: 'Assembly and testing of a regulated DC power supply',
  brief:
    'The learner individually assembles a basic regulated DC power supply (transformer, rectifier, filter capacitor, voltage regulator IC, and output terminals) on a project board or PCB, then tests the output voltage and checks for proper component functionality using a multimeter, following standard electronic assembly and safety procedures.',
  modules: ['m1', 'm2'],
  safety: [
    'The transformer primary is at mains potential. Keep the primary side covered, and never work on it while the supply is plugged in.',
    'The filter capacitor holds its charge after the supply is unplugged. Discharge it through a bleeder resistor and confirm with a meter that it reads close to zero volts before you touch the board.',
    'Connect your meter before you apply power, never after. Reaching into a live board to clip a probe on is how people get hurt.',
    'The regulator gets hot once the output is loaded. The heatsink goes on at the soldering step, and the loaded test does not happen without it. Let it cool before you touch it afterwards.',
    'Keep the plug where you can see it whenever the board is uncovered, so nobody else can plug the supply in while your hands are on it.',
  ],
  steps: [
    'Check the schematic against the parts you were given, and confirm the regulator is rated for the output voltage the task asks for.',
    'Lay the components out on the board unpowered, and check which way round the rectifier diodes and the filter capacitor go before you solder anything.',
    'Solder the components, heating the pad and the lead together so the solder wets both surfaces. Fit the regulator heatsink now, because the loaded test later will not be done without it.',
    'With the supply still unplugged, look for solder bridges and measure continuity from the regulator output to the output terminals.',
    'Clip your meter to the output terminals on DC volts, and only then plug the transformer in.',
    'Read the output voltage and confirm its polarity matches the markings on the terminals.',
    'Unplug the supply, discharge the filter capacitor and confirm it reads close to zero volts, then connect the load the task specifies and plug in again to read the output, because a regulator that holds its voltage with nothing drawing from it can still sag once it is loaded.',
    'Unplug the supply again and discharge the filter capacitor through a bleeder resistor, confirming with the meter across the capacitor terminals, not at the output, that it reads close to zero volts. Leave the regulator to cool before you handle the board: it has just been carrying the load current and the heatsink will be hot.',
    'Correct anything the readings showed, then repeat the powered test from step five.',
  ],
  rubric: [
    { criterion: 'Correct assembly', descriptor: 'Every component is in its right place and the right way round, with no solder bridges.', points: 6 },
    { criterion: 'Soldering quality', descriptor: 'Joints are shiny and fill the pad, with no cold or dry joints and no lifted pads.', points: 5 },
    { criterion: 'Correct output', descriptor: 'The output voltage and its polarity match the schematic within tolerance, and hold when the load is connected.', points: 5 },
    { criterion: 'Safe working', descriptor: 'The supply was isolated and the capacitor proved discharged before any contact with the board.', points: 4 },
  ],
}
