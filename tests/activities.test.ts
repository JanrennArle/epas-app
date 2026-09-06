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
    for (const [_key, activity] of entries) {
      const valid = activity.kind === 'match'
        ? activity.choices.map(c => c.id)
        : activity.regions.map(r => r.id)
      for (const item of activity.items) {
        expect(valid).toContain(item.answer)
      }
    }
  })

  it('keeps every hotspot region inside the diagram box', () => {
    for (const [_key, activity] of entries) {
      if (activity.kind !== 'hotspot') continue
      for (const region of activity.regions) {
        expect(region.xPct).toBeGreaterThanOrEqual(0)
        expect(region.xPct).toBeLessThanOrEqual(100)
        expect(region.yPct).toBeGreaterThanOrEqual(0)
        expect(region.yPct).toBeLessThanOrEqual(100)
      }
    }
  })

  it('gives every item and every target a unique id', () => {
    for (const [_key, activity] of entries) {
      const itemIds = activity.items.map(i => i.id)
      expect(new Set(itemIds).size).toBe(itemIds.length)
      const targetIds = activity.kind === 'match'
        ? activity.choices.map(c => c.id)
        : activity.regions.map(r => r.id)
      expect(new Set(targetIds).size).toBe(targetIds.length)
    }
  })
})
