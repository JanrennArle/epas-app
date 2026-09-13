import { ACTIVITIES } from '../src/content/activities'
import { allModules } from '../src/content'
import { SCENARIOS } from '../src/content/scenarios'
import { getSim } from '../src/interactives/registry'

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
      const valid = activity.kind === 'hotspot'
        ? activity.regions.map(r => r.id)
        : activity.choices.map(c => c.id)
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
      const targetIds = activity.kind === 'hotspot'
        ? activity.regions.map(r => r.id)
        : activity.choices.map(c => c.id)
      expect(new Set(targetIds), `${key} targets`).toHaveProperty('size', targetIds.length)
    }
  })

  it('never presents a sequence in its own answer order', () => {
    for (const [key, activity] of entries) {
      if (activity.kind !== 'sequence') continue
      const shown = activity.choices.map(c => c.id)
      const answer = activity.items.map(i => i.answer)
      const prefix = shown.slice(0, answer.length)
      expect(prefix, `${key} display order`).not.toEqual(answer)
    }
  })

  /**
   * The position tell, across all three formats.
   *
   * This guarded sequences only, and while it did, two match activities
   * listed their choices in exactly the order their questions asked for them
   * and one hotspot listed its regions the same way. Both render the pool in
   * array order, so a student picking the Nth option for the Nth question
   * scored five out of five and four out of four without reading anything.
   * That is the same defect as keys bunched on option B in the test bank,
   * wearing a different format.
   *
   * Backwards counts too: a pool that is the answer order reversed is one
   * glance away from being read forwards.
   */
  it('never lines its answer pool up with its own questions', () => {
    for (const [key, activity] of entries) {
      const shown = activity.kind === 'hotspot'
        ? activity.regions.map(r => r.id)
        : activity.choices.map(c => c.id)
      const answer = activity.items.map(i => i.answer)
      const forwards = answer.filter((a, i) => shown[i] === a).length
      const backwards = answer.filter((a, i) => shown[shown.length - 1 - i] === a).length
      expect(forwards, `${key} read down the pool`).toBeLessThanOrEqual(1)
      expect(backwards, `${key} read up the pool`).toBeLessThanOrEqual(1)
    }
  })

  it('never repeats a block within one sequence', () => {
    for (const [key, activity] of entries) {
      if (activity.kind !== 'sequence') continue
      const answers = activity.items.map(i => i.answer)
      expect(new Set(answers), `${key} chain`).toHaveProperty('size', answers.length)
    }
  })
})

describe('module content resolves against the registries', () => {
  const modules = allModules()

  const interactives = modules.flatMap(m =>
    m.outcomes.flatMap(o =>
      o.lessons.flatMap(l =>
        l.blocks
          .filter(b => b.kind === 'interactive')
          .map(b => ({ module: m.id, outcome: o.id, block: b as Extract<typeof b, { kind: 'interactive' }> })))))

  it('registers at least one module', () => {
    expect(modules.length).toBeGreaterThan(0)
  })

  it('resolves every embedded simulation id', () => {
    for (const { module, outcome, block } of interactives) {
      expect(getSim(block.simId), `${module} ${outcome} simId ${block.simId}`).toBeDefined()
    }
  })

  it('resolves every embedded activity and scenario id', () => {
    for (const { module, outcome, block } of interactives) {
      const activity = block.config?.activity
      if (typeof activity === 'string') {
        expect(Object.keys(ACTIVITIES), `${module} ${outcome} activity`).toContain(activity)
      }
      const scenario = block.config?.scenario
      if (typeof scenario === 'string') {
        expect(Object.keys(SCENARIOS), `${module} ${outcome} scenario`).toContain(scenario)
      }
    }
  })

  it('gives every quiz item a globally unique id', () => {
    const ids = modules.flatMap(m => m.outcomes.flatMap(o => o.quiz.map(q => q.id)))
    expect(new Set(ids), 'quiz ids').toHaveProperty('size', ids.length)
  })

  it('ties every quiz item to a competency its own module declares', () => {
    for (const m of modules) {
      for (const o of m.outcomes) {
        for (const q of o.quiz) {
          expect(m.competencies, `${m.id} ${q.id}`).toContain(q.competency)
        }
      }
    }
  })
})
