import type { Scenario } from '../../lib/diagnose'

export const cctvScenario: Scenario = {
  id: 'cctv',
  appliance: 'CCTV camera channel',
  symptom: 'Camera 3 shows a black screen on the monitor. The other three cameras are fine, and the recorder is running normally.',
  safety: [
    'Switch off the camera power supply before you disconnect or re-terminate any camera wiring.',
    'Work from a stable platform when reaching a mounted camera, and never lean off a ladder to reach sideways.',
    'Treat every outdoor connector as wet until you have opened and looked at it.',
  ],
  faults: [
    { id: 'psu', label: 'No power reaching the camera', remedy: 'Restore the supply at the fault you found, then confirm the camera draws its rated current.' },
    { id: 'connector', label: 'Corroded connector at the camera', remedy: 'Cut back to clean conductor, fit a new connector, and weatherproof the joint properly.' },
    { id: 'cable', label: 'Damaged cable along the run', remedy: 'Replace the damaged section, or re-route the run away from whatever damaged it.' },
    { id: 'camera', label: 'Failed camera', remedy: 'Replace the camera with one of the same supply voltage and signal type.' },
    { id: 'channel', label: 'Faulty recorder input', remedy: 'Move the camera to a spare input if there is one, otherwise the recorder needs service.' },
  ],
  actualFault: 'connector',
  testPoints: [
    {
      id: 'tp-psu', label: 'Camera supply', action: 'DC volts at the camera end of the power pair.',
      readings: { psu: '0.0 V', '*': '12.1 V' },
      implicates: ['psu'],
    },
    {
      id: 'tp-conn', label: 'Connector at the camera', action: 'Open the connector and inspect it, then measure continuity through it.',
      readings: { connector: 'Green corrosion on the centre pin, and continuity is intermittent when moved', '*': 'Clean and dry, continuity solid' },
      implicates: ['connector'],
    },
    {
      id: 'tp-cable', label: 'Cable run', action: 'Continuity along the run with the far end shorted.',
      readings: { cable: 'OL on the centre conductor', '*': '2.4 ohm, meter beeps' },
      implicates: ['cable'],
    },
    {
      id: 'tp-cam', label: 'Camera', action: 'Substitute a camera known to be working, at the camera end.',
      readings: { camera: 'The substitute gives a picture', '*': 'The substitute gives the same black screen' },
      implicates: ['camera'],
    },
    {
      id: 'tp-chan', label: 'Recorder input', action: 'Move the cable to a recorder input known to be working.',
      readings: { channel: 'The picture appears on the other input', '*': 'The other input is black too' },
      implicates: ['channel'],
    },
  ],
}
