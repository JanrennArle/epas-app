import type { BankItem } from '../../lib/types'

export const m5Bank: BankItem[] = [
  {
    id: 'b-m5-c1-a', moduleId: 'm5', pair: 'm5-c1', form: 'A',
    competency: 'Demonstrate the procedure in CCTV system installation.',
    stem: 'Why is a camera normally mounted so that it does not face a window or a bright light?',
    options: [
      'Because the lens will be damaged by direct light',
      'Because the cable will overheat',
      'Because the camera will expose for the bright area and leave the subject in silhouette',
      'Because the recorder cannot store bright images',
    ],
    answer: 2,
  },
  {
    id: 'b-m5-c1-b', moduleId: 'm5', pair: 'm5-c1', form: 'B',
    competency: 'Demonstrate the procedure in CCTV system installation.',
    stem: 'A camera at the far end of a long cable run has a dim, rolling picture, while the same camera works normally on a short lead at the recorder. What does that point to?',
    options: [
      'A faulty camera after all',
      'Voltage lost along the cable run, so the camera is underpowered at its end',
      'A faulty recorder input',
      'The camera being mounted too high',
    ],
    answer: 1,
  },
  {
    id: 'b-m5-c2-a', moduleId: 'm5', pair: 'm5-c2', form: 'A',
    competency: 'Perform CCTV system servicing.',
    stem: 'Every camera on a system is dead at once. Where do you look first?',
    options: [
      'At what they share, which is the supply and the recorder',
      'At each camera in turn, starting with the furthest',
      'At the lens of the first camera',
      'At the monitor cable',
    ],
    answer: 0,
  },
  {
    id: 'b-m5-c2-b', moduleId: 'm5', pair: 'm5-c2', form: 'B',
    competency: 'Perform CCTV system servicing.',
    stem: 'You need to measure the supply voltage reaching a camera. What is true of that measurement?',
    options: [
      'It must be made with the system powered, because a voltage cannot be measured on a dead circuit',
      'It must be made with the system isolated, like every other test',
      'It can be made either way and gives the same reading',
      'It should be made with the camera disconnected',
    ],
    answer: 0,
  },
]
