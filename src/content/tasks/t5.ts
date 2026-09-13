import type { PerformanceTask } from '../../lib/types'

export const t5: PerformanceTask = {
  id: 't5',
  kind: 'individual',
  title: 'Troubleshooting and servicing of a CCTV camera unit',
  brief:
    'The learner individually diagnoses and services a malfunctioning CCTV unit (camera, power supply, or DVR/NVR connection) by inspecting cables, checking voltage output, testing video signal transmission, correcting faulty terminations, and restoring system operation while strictly observing electrical and low-voltage safety precautions.',
  modules: ['m4', 'm5'],
  safety: [
    'The camera side is low voltage, but the power supply that feeds it is not. Treat the supply as mains until you have proved otherwise.',
    'Two of the checks below need the system powered. Clip your probes on before you switch on, keep one hand away from the chassis, and switch off again before you move them.',
    'Isolate the supply before you cut, strip or re-terminate any cable. A connector made up live is a short waiting to happen.',
    'A camera on a bracket at height is a falling object. Support it before you loosen anything.',
  ],
  steps: [
    'Confirm which cameras are affected and which are not, because a fault on one camera and a fault on all of them are different faults.',
    'Check what the working cameras have already proved: if others show a picture, the recorder and its supply are alive.',
    'With the system powered, measure the supply voltage arriving at the faulty camera, not at the power supply end.',
    'Still powered, check whether the video signal reaches the recorder input by substituting a known good lead at the recorder.',
    'Inspect the run for damage, and look closely at every termination, because a connector made up badly is the commonest fault on these systems.',
    'Isolate the supply, then re-terminate or replace whatever the measurements condemned.',
    'Restore the supply and confirm the picture at the recorder, in daylight and again with the room darkened if the camera claims night operation.',
    'Tidy and support the cable run so the repair does not become next term fault.',
  ],
  rubric: [
    { criterion: 'Narrowing the fault', descriptor: 'What the working cameras prove is used to narrow the search before anything is opened.', points: 6 },
    { criterion: 'Measurement', descriptor: 'Voltage is measured at the camera end and the signal path is checked by substitution, with readings written down.', points: 5 },
    { criterion: 'Repair quality', descriptor: 'Terminations are sound, the run is supported, and the repair will survive the weather it sits in.', points: 5 },
    { criterion: 'Safe working', descriptor: 'Live measurements are made with probes fitted first, and the supply is isolated before any cable work.', points: 6 },
  ],
}
