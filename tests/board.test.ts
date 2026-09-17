import { allModules } from '../src/content'
import { MODULE_TOOLS, toolFor } from '../src/ui/board/tools'
import { Wrench } from '@phosphor-icons/react'

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
