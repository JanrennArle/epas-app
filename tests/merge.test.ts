import { describe, expect, it } from 'vitest'
import type { StoreV1 } from '../src/lib/store'
import type { LoadedFile } from '../src/lib/merge'
import {
  excludedStudents, groupByStudent, includedStudents, whyLeftOut,
} from '../src/lib/merge'

function state(code: string, research?: boolean): StoreV1 {
  return {
    schemaVersion: 1,
    participant: research === undefined ? { code } : { code, research },
    modules: {},
    attempts: [],
    sims: [],
  }
}

function file(over: Partial<LoadedFile> & { code: string }): LoadedFile {
  const research = 'research' in over ? over.research : true
  return {
    file: `${over.code}.json`,
    state: state(over.code, research),
    exportedAt: '2026-01-01T00:00:00.000Z',
    ...over,
    research,
  }
}

describe('groupByStudent', () => {
  it('returns nothing for no files', () => {
    expect(groupByStudent([])).toEqual([])
  })

  it('makes one group per participant code', () => {
    const g = groupByStudent([file({ code: 'A' }), file({ code: 'B' })])
    expect(g.map(x => x.code).sort()).toEqual(['A', 'B'])
  })

  it('gathers two files under one code into one group', () => {
    const g = groupByStudent([
      file({ code: 'A', file: 'first.json' }),
      file({ code: 'A', file: 'second.json' }),
    ])
    expect(g).toHaveLength(1)
    expect(g[0]?.files).toHaveLength(2)
  })

  it('reports the most recently exported file of a group', () => {
    const g = groupByStudent([
      file({ code: 'A', file: 'old.json', exportedAt: '2026-01-01T00:00:00.000Z' }),
      file({ code: 'A', file: 'new.json', exportedAt: '2026-03-01T00:00:00.000Z' }),
    ])
    expect(g[0]?.newest.file).toBe('new.json')
  })

  it('reports the newest even when the files arrive out of order', () => {
    const g = groupByStudent([
      file({ code: 'A', file: 'new.json', exportedAt: '2026-03-01T00:00:00.000Z' }),
      file({ code: 'A', file: 'old.json', exportedAt: '2026-01-01T00:00:00.000Z' }),
    ])
    expect(g[0]?.newest.file).toBe('new.json')
  })
})

describe('who is in the merged table', () => {
  it('includes a student who agreed', () => {
    const g = groupByStudent([file({ code: 'A', research: true })])
    expect(includedStudents(g).map(x => x.code)).toEqual(['A'])
    expect(excludedStudents(g)).toEqual([])
  })

  it('excludes a student who declined', () => {
    const g = groupByStudent([file({ code: 'A', research: false })])
    expect(includedStudents(g)).toEqual([])
    expect(excludedStudents(g).map(x => x.code)).toEqual(['A'])
  })

  // An absent field means unknown, and unknown is not agreement. The consent
  // screen promises a declining student that nothing of theirs is reported,
  // and a file written before that choice existed cannot say either way.
  it('excludes a file written before the consent choice existed', () => {
    const g = groupByStudent([file({ code: 'A', research: undefined })])
    expect(includedStudents(g)).toEqual([])
  })

  // This is the defect the whole grouping exists for. A student can return to
  // the consent screen and change their answer under the same code.
  it('excludes a student whose files disagree, whichever order they arrive in', () => {
    const forwards = groupByStudent([
      file({ code: 'A', file: 'agreed.json', research: true, exportedAt: '2026-01-01T00:00:00.000Z' }),
      file({ code: 'A', file: 'declined.json', research: false, exportedAt: '2026-03-01T00:00:00.000Z' }),
    ])
    const backwards = groupByStudent([
      file({ code: 'A', file: 'declined.json', research: false, exportedAt: '2026-01-01T00:00:00.000Z' }),
      file({ code: 'A', file: 'agreed.json', research: true, exportedAt: '2026-03-01T00:00:00.000Z' }),
    ])
    expect(includedStudents(forwards)).toEqual([])
    expect(includedStudents(backwards)).toEqual([])
    expect(forwards[0]?.conflicted).toBe(true)
    expect(backwards[0]?.conflicted).toBe(true)
  })

  // The later agreement must not rescue them either. Taking the newer file
  // would be inferring consent from a timestamp.
  it('does not let a newer agreement override an earlier refusal', () => {
    const g = groupByStudent([
      file({ code: 'A', research: false, exportedAt: '2026-01-01T00:00:00.000Z' }),
      file({ code: 'A', research: true, exportedAt: '2026-09-01T00:00:00.000Z' }),
    ])
    expect(includedStudents(g)).toEqual([])
  })

  it('keeps two agreeing files from one student as one included row', () => {
    const g = groupByStudent([
      file({ code: 'A', research: true, file: 'a.json' }),
      file({ code: 'A', research: true, file: 'b.json' }),
    ])
    expect(includedStudents(g)).toHaveLength(1)
    expect(g[0]?.conflicted).toBe(false)
  })

  it('sorts one student out without affecting another', () => {
    const g = groupByStudent([
      file({ code: 'A', research: true }),
      file({ code: 'B', research: false }),
      file({ code: 'C', research: undefined }),
    ])
    expect(includedStudents(g).map(x => x.code)).toEqual(['A'])
    expect(excludedStudents(g).map(x => x.code).sort()).toEqual(['B', 'C'])
  })
})

describe('whyLeftOut', () => {
  it('names a disagreement as a disagreement', () => {
    const g = groupByStudent([
      file({ code: 'A', research: true }),
      file({ code: 'A', research: false }),
    ])
    expect(whyLeftOut(g[0]!)).toMatch(/disagree/i)
  })

  it('names a refusal as a refusal', () => {
    const g = groupByStudent([file({ code: 'A', research: false })])
    expect(whyLeftOut(g[0]!)).toMatch(/chose not to take part/i)
  })

  it('names a missing choice as predating the question', () => {
    const g = groupByStudent([file({ code: 'A', research: undefined })])
    expect(whyLeftOut(g[0]!)).toMatch(/predates/i)
  })

  // A bullet with no reason reads as a bug rather than as a decision.
  it('always gives a reason, for every excluded group', () => {
    const g = groupByStudent([
      file({ code: 'A', research: false }),
      file({ code: 'B', research: undefined }),
      file({ code: 'C', research: true }),
      file({ code: 'C', research: false }),
    ])
    for (const x of excludedStudents(g)) {
      expect(whyLeftOut(x).length, x.code).toBeGreaterThan(10)
    }
  })
})
