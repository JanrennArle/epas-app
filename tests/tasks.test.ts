import { describe, expect, it } from 'vitest'
import { TASKS, getTask } from '../src/content/tasks'
import { allModules } from '../src/content'

const moduleIds = new Set(allModules().map(m => m.id))

describe('the performance tasks', () => {
  it('has a registry', () => {
    expect(TASKS.length).toBeGreaterThanOrEqual(0)
  })

  it('gives every task a unique id', () => {
    const ids = TASKS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every id through getTask', () => {
    for (const t of TASKS) expect(getTask(t.id)?.id).toBe(t.id)
  })

  it('names only modules that exist', () => {
    for (const t of TASKS) {
      expect(t.modules.length, t.id).toBeGreaterThan(0)
      for (const m of t.modules) expect(moduleIds.has(m), `${t.id} names ${m}`).toBe(true)
    }
  })

  it('gives every task safety lines, steps and a rubric', () => {
    for (const t of TASKS) {
      expect(t.safety.length, t.id).toBeGreaterThanOrEqual(2)
      expect(t.steps.length, t.id).toBeGreaterThanOrEqual(5)
      expect(t.rubric.length, t.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('makes every safety line distinct within a task', () => {
    for (const t of TASKS) expect(new Set(t.safety).size, t.id).toBe(t.safety.length)
  })

  it('makes every step distinct within a task', () => {
    for (const t of TASKS) expect(new Set(t.steps).size, t.id).toBe(t.steps.length)
  })

  // A rubric a student cannot total is a rubric they cannot aim at.
  it('gives every rubric a whole number total', () => {
    for (const t of TASKS) {
      const total = t.rubric.reduce((n, r) => n + r.points, 0)
      expect(Number.isInteger(total), `${t.id} totals ${total}`).toBe(true)
      expect(total, t.id).toBeGreaterThan(0)
      for (const r of t.rubric) expect(r.points, `${t.id}: ${r.criterion}`).toBeGreaterThan(0)
    }
  })

  it('never repeats a rubric criterion within a task', () => {
    for (const t of TASKS) {
      const names = t.rubric.map(r => r.criterion)
      expect(new Set(names).size, t.id).toBe(names.length)
    }
  })

  it('uses no long dashes in anything a student reads', () => {
    for (const t of TASKS) {
      const copy = [t.title, t.brief, ...t.safety, ...t.steps,
        ...t.rubric.flatMap(r => [r.criterion, r.descriptor])].join(' ')
      expect(/[–—―]/.test(copy), t.id).toBe(false)
    }
  })

  it('uses only the two kinds the Budget of Work uses', () => {
    for (const t of TASKS) expect(['individual', 'group'], t.id).toContain(t.kind)
  })
})
