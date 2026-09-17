import { allModules } from '../src/content'
import { MODULE_TOOLS, toolFor } from '../src/ui/board/tools'
import { Wrench } from '@phosphor-icons/react'
import { nextAction, toolStates } from '../src/lib/board'

describe('module tools', () => {
  // A module added without a tool would hang an anonymous wrench on the board
  // and nobody would notice until a student asked which one it was.
  it('gives every module its own tool', () => {
    const ids = allModules().map(m => m.id)
    for (const id of ids) expect(MODULE_TOOLS[id], id).toBeDefined()
    const icons = ids.map(id => MODULE_TOOLS[id])
    expect(new Set(icons).size).toBe(ids.length)
  })

  it('falls back to a wrench for an unknown id', () => {
    expect(toolFor('nope')).toBe(Wrench)
  })
})

const mods = [
  { id: 'm1', outcomes: [{ id: 'a' }, { id: 'b' }] },
  { id: 'm2', outcomes: [{ id: 'c' }] },
  { id: 'm3', outcomes: [] },
]

describe('toolStates', () => {
  it('counts only outcomes that belong to the module, once each', () => {
    const [m1] = toolStates(mods, { m1: { completedOutcomes: ['a', 'a', 'zzz'] } })
    expect(m1).toEqual({ moduleId: 'm1', done: 1, total: 2, fraction: 0.5, hung: false })
  })

  it('hangs a tool only when every outcome is done', () => {
    const t = toolStates(mods, { m1: { completedOutcomes: ['a', 'b'] }, m2: { completedOutcomes: [] } })
    expect(t[0]?.hung).toBe(true)
    expect(t[1]?.hung).toBe(false)
  })

  // A module with no outcomes has nothing to finish, and must not count as
  // finished, or an unwritten module would hang on every student's board.
  it('never hangs a module with no outcomes', () => {
    expect(toolStates(mods, {})[2]).toEqual({ moduleId: 'm3', done: 0, total: 0, fraction: 0, hung: false })
  })
})

describe('nextAction', () => {
  it('starts the first module for a new student', () => {
    expect(nextAction(toolStates(mods, {}))).toEqual({ moduleId: 'm1', verb: 'Start' })
  })

  it('continues a module that has been started', () => {
    expect(nextAction(toolStates(mods, { m1: { completedOutcomes: ['a'] } }))).toEqual({ moduleId: 'm1', verb: 'Continue' })
  })

  it('moves to the first module not yet hung', () => {
    expect(nextAction(toolStates(mods, { m1: { completedOutcomes: ['a', 'b'] } }))).toEqual({ moduleId: 'm2', verb: 'Start' })
  })

  it('skips modules with no outcomes and returns null when everything is hung', () => {
    const t = toolStates(mods, { m1: { completedOutcomes: ['a', 'b'] }, m2: { completedOutcomes: ['c'] } })
    expect(nextAction(t)).toBeNull()
  })
})
