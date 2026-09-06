export interface ActivityItem {
  id: string
  /** What the student is asked. */
  prompt: string
  /** The id of the correct choice or region. */
  answer: string
}

export interface Choice {
  id: string
  label: string
}

/**
 * A diagram is authored as typed shapes rather than raw SVG markup, so no
 * component ever needs dangerouslySetInnerHTML and a teacher can read and
 * edit the drawing.
 */
export type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string }
  | { kind: 'text'; x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }

export interface Region {
  id: string
  label: string
  /** Position as a percentage of the diagram box, so overlay buttons align at any width. */
  xPct: number
  yPct: number
}

export interface MatchActivityData {
  kind: 'match'
  id: string
  instruction: string
  choices: Choice[]
  items: ActivityItem[]
}

export interface HotspotActivityData {
  kind: 'hotspot'
  id: string
  instruction: string
  /** Width and height of the drawing space, used as the SVG viewBox. */
  box: { w: number; h: number }
  shapes: Shape[]
  regions: Region[]
  items: ActivityItem[]
}

export type Activity = MatchActivityData | HotspotActivityData

export interface ActivityResult {
  correct: number
  total: number
  /** Ids of the items answered wrongly or left blank, in item order. */
  wrong: string[]
}

export function scoreActivity(
  items: ActivityItem[],
  responses: Record<string, string>,
): ActivityResult {
  const wrong: string[] = []
  let correct = 0
  for (const item of items) {
    if (responses[item.id] === item.answer) correct++
    else wrong.push(item.id)
  }
  return { correct, total: items.length, wrong }
}
