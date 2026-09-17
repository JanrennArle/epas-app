import { readFileSync } from 'node:fs'
import { SCENARIOS } from '../src/content/scenarios'
import { SPRITES, TOOLBOX, spriteFor } from '../src/interactives/service/sprites'

describe('service mode sprites', () => {
  it('draws every scenario appliance', () => {
    for (const id of Object.keys(SCENARIOS)) expect(SPRITES[id], id).toBeDefined()
  })

  it('keeps every sprite rectangular, at most 20 by 22, with every colour defined', () => {
    for (const [id, s] of Object.entries(SPRITES)) {
      const width = s.rows[0]?.length ?? 0
      expect(width, id).toBeGreaterThan(0)
      expect(width, id).toBeLessThanOrEqual(20)
      expect(s.rows.length, id).toBeLessThanOrEqual(22)
      for (const row of s.rows) {
        expect(row.length, `${id}: ${row}`).toBe(width)
        for (const ch of row) if (ch !== '.') expect(s.palette[ch], `${id}: ${ch}`).toMatch(/^#[0-9A-F]{6}$/)
      }
    }
  })

  // A pixel scene is a surface the student reads before answering. The
  // appliance is drawn healthy: no sprite may use the danger red, which is
  // the one colour that would point at a part.
  it('never paints an appliance in the safety red', () => {
    for (const [id, s] of Object.entries(SPRITES)) {
      expect(Object.values(s.palette).map(c => c.toUpperCase()), id).not.toContain('#D8352A')
    }
  })

  // The picture is chosen by scenario id alone. If either file ever reads the
  // fault list or the actual fault, the scene can start carrying the answer.
  it('draws the scene without reading any fault', () => {
    for (const file of ['src/interactives/service/sprites.ts', 'src/interactives/service/PixelScene.tsx']) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toMatch(/actualFault|\.faults\b|testPoints|readingAt/)
    }
  })

  it('falls back to the toolbox for an unknown scenario', () => {
    expect(spriteFor('nope')).toBe(TOOLBOX)
  })
})
