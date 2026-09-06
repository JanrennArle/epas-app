import type { HotspotActivityData } from '../../lib/activity'

export const tvBoards: HotspotActivityData = {
  kind: 'hotspot',
  id: 'tv-boards',
  instruction: 'A flat screen television seen from behind with the back cover removed. Answer each question by clicking the part on the diagram.',
  box: { w: 400, h: 240 },
  shapes: [
    { kind: 'rect', x: 25, y: 12, w: 350, h: 150, r: 6, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 35, y: 22, w: 330, h: 88, r: 3, fill: 'var(--m9)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 40, y: 120, w: 320, h: 14, r: 3, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 40, y: 180, w: 95, h: 30, r: 3, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 200, y: 180, w: 110, h: 30, r: 3, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'line', x1: 8, y1: 195, x2: 40, y2: 195, width: 4 },
    { kind: 'circle', cx: 255, cy: 222, r: 7, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'line', x1: 100, y1: 134, x2: 100, y2: 180, width: 2 },
    { kind: 'text', x: 200, y: 236, text: 'Rear view, back cover removed', anchor: 'middle' },
  ],
  regions: [
    { id: 'panel', label: 'Panel', xPct: 50, yPct: 27.5 },
    { id: 'backlight', label: 'Backlight', xPct: 50, yPct: 53 },
    { id: 'psu', label: 'Power supply board', xPct: 20, yPct: 81 },
    { id: 'main', label: 'Main board', xPct: 62, yPct: 81 },
  ],
  items: [
    { id: 'q1', prompt: 'Which board has the mains cord entering it, and turns that into the low voltage rails everything else runs on?', answer: 'psu' },
    { id: 'q2', prompt: 'Which board has the aerial socket on it, and decodes the incoming signal into a picture?', answer: 'main' },
    { id: 'q3', prompt: 'Which part lights the picture from behind, so that when it fails you get sound and a black screen?', answer: 'backlight' },
    { id: 'q4', prompt: 'Which part actually forms the image, and is a sheet of glass you must never lever or twist?', answer: 'panel' },
  ],
}
