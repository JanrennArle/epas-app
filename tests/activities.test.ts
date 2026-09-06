import { ACTIVITIES } from '../src/content/activities'

describe('every authored activity is internally consistent', () => {
  const entries = Object.entries(ACTIVITIES)

  it('has at least one activity', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it('keys the registry by each activity id', () => {
    for (const [key, activity] of entries) {
      expect(activity.id).toBe(key)
    }
  })

  it('gives every item an answer that resolves to a declared id', () => {
    for (const [key, activity] of entries) {
      const valid = activity.kind === 'match'
        ? activity.choices.map(c => c.id)
        : activity.regions.map(r => r.id)
      for (const item of activity.items) {
        expect(valid, `${key} item ${item.id}`).toContain(item.answer)
      }
    }
  })

  it('keeps every hotspot region inside the diagram box', () => {
    for (const [key, activity] of entries) {
      if (activity.kind !== 'hotspot') continue
      for (const region of activity.regions) {
        expect(region.xPct, `${key} region ${region.id} x`).toBeGreaterThanOrEqual(0)
        expect(region.xPct, `${key} region ${region.id} x`).toBeLessThanOrEqual(100)
        expect(region.yPct, `${key} region ${region.id} y`).toBeGreaterThanOrEqual(0)
        expect(region.yPct, `${key} region ${region.id} y`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('gives every item and every target a unique id', () => {
    for (const [key, activity] of entries) {
      const itemIds = activity.items.map(i => i.id)
      expect(new Set(itemIds), `${key} items`).toHaveProperty('size', itemIds.length)
      const targetIds = activity.kind === 'match'
        ? activity.choices.map(c => c.id)
        : activity.regions.map(r => r.id)
      expect(new Set(targetIds), `${key} targets`).toHaveProperty('size', targetIds.length)
    }
  })
})
