import type { HotspotActivityData } from '../../lib/activity'

export const flatIronParts: HotspotActivityData = {
  kind: 'hotspot',
  id: 'flat-iron-parts',
  instruction: 'A flat iron, seen from the side with the cover removed. Answer each question by clicking the part on the diagram.',
  box: { w: 400, h: 200 },
  shapes: [
    { kind: 'rect', x: 110, y: 22, w: 180, h: 20, r: 10, fill: 'var(--m4)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 122, y: 42, w: 18, h: 44, fill: 'var(--m4)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 262, y: 42, w: 18, h: 44, fill: 'var(--m4)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 78, y: 86, w: 252, h: 56, r: 6, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'rect', x: 58, y: 144, w: 292, h: 24, r: 4, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'line', x1: 78, y1: 156, x2: 330, y2: 156, width: 4 },
    { kind: 'rect', x: 232, y: 98, w: 40, h: 28, r: 4, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'circle', cx: 150, cy: 112, r: 13, fill: 'var(--surface)', stroke: 'var(--ink-3)' },
    { kind: 'line', x1: 78, y1: 100, x2: 26, y2: 86, width: 5 },
    { kind: 'text', x: 200, y: 190, text: 'Side view, cover removed', anchor: 'middle' },
  ],
  // Deliberately not in the order the questions ask for them. See the note in
  // control-board.ts. The regions are placed by coordinate rather than listed,
  // so this is a weaker tell than the match version, but it is still the tab
  // order and the DOM order, and it costs nothing to remove.
  regions: [
    { id: 'fuse', label: 'Thermal fuse', xPct: 37, yPct: 56 },
    { id: 'cord', label: 'Cord entry', xPct: 13, yPct: 47 },
    { id: 'element', label: 'Heating element', xPct: 50, yPct: 78 },
    { id: 'thermostat', label: 'Thermostat', xPct: 63, yPct: 56 },
  ],
  items: [
    { id: 'q1', prompt: 'Which part turns electricity into the heat that reaches the plate?', answer: 'element' },
    { id: 'q2', prompt: 'Which part switches the heat on and off to hold the setting you chose?', answer: 'thermostat' },
    { id: 'q3', prompt: 'Which part cuts the power permanently if the iron overheats, and never closes again?', answer: 'fuse' },
    { id: 'q4', prompt: 'Where does flexing wear break the supply most often on an iron?', answer: 'cord' },
  ],
}
