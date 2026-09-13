import { describe, expect, it } from 'vitest'
import type { Attempt, StoreV1 } from '../src/lib/store'
import {
  codebookRows, competencyColumns, csvCell, csvHeader, csvLine, csvRow,
  parseBundle, rubricRows, toBundle, toCsv,
} from '../src/lib/export'

function state(over: Partial<StoreV1> = {}): StoreV1 {
  return {
    schemaVersion: 1,
    participant: { code: 'EPAS-AAAA11' },
    modules: {},
    attempts: [],
    sims: [],
    ...over,
  }
}

describe('csvCell', () => {
  it('leaves a plain value alone', () => {
    expect(csvCell('m1')).toBe('m1')
  })

  it('renders a number without quoting it', () => {
    expect(csvCell(1)).toBe('1')
  })

  it('renders null and undefined as an empty cell', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })

  // Each of these splits a row in two, or shifts every later column by one,
  // if it is not quoted. None of them looks wrong in the file.
  it('quotes a value containing a comma', () => {
    expect(csvCell('Discuss soldering, and desoldering')).toBe('"Discuss soldering, and desoldering"')
  })

  it('quotes a value containing a newline', () => {
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"')
  })

  it('doubles an inner quote and wraps the cell', () => {
    expect(csvCell('he said "isolate it first"')).toBe('"he said ""isolate it first"""')
  })

  it('quotes a value with a leading or trailing space, which some readers trim', () => {
    expect(csvCell(' padded ')).toBe('" padded "')
  })

  it('prefixes text a spreadsheet would run as a formula', () => {
    expect(csvCell('=1+1')).toBe("'=1+1")
    expect(csvCell('@someone')).toBe("'@someone")
    expect(csvCell('+SUM(A1)')).toBe("'+SUM(A1)")
  })

  it('guards a comment that opens with a dash, as a student writing a list would', () => {
    expect(csvCell('-the torch test was clearest')).toBe("'-the torch test was clearest")
  })

  // Only text is guarded. A negative number must keep its sign.
  it('leaves a negative number alone', () => {
    expect(csvCell(-5)).toBe('-5')
  })
})

describe('csvLine and toCsv', () => {
  it('joins cells with commas', () => {
    expect(csvLine(['a', 'b', 'c'])).toBe('a,b,c')
  })

  it('separates rows with a carriage return and newline', () => {
    expect(toCsv([['a'], ['b']])).toBe('a\r\nb')
  })

  it('keeps an empty trailing cell rather than dropping it', () => {
    expect(csvLine(['a', ''])).toBe('a,')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})

describe('toBundle', () => {
  it('wraps the state with a format marker and a timestamp', () => {
    const b = toBundle(state(), '2026-09-12T00:00:00.000Z')
    expect(b.format).toBe('epas-export')
    expect(b.formatVersion).toBe(1)
    expect(b.exportedAt).toBe('2026-09-12T00:00:00.000Z')
    expect(b.state.participant.code).toBe('EPAS-AAAA11')
  })

  it('copies the state rather than aliasing it', () => {
    const s = state()
    const b = toBundle(s, '2026-09-12T00:00:00.000Z')
    b.state.participant.code = 'CHANGED'
    expect(s.participant.code).toBe('EPAS-AAAA11')
  })
})

describe('parseBundle', () => {
  it('reads back what toBundle wrote', () => {
    const text = JSON.stringify(toBundle(state(), '2026-09-12T00:00:00.000Z'))
    const r = parseBundle(text)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.bundle.state.participant.code).toBe('EPAS-AAAA11')
  })

  // The teacher drops a folder of files onto this. Some of them will not be
  // exports, and the tool has to say which rather than throwing.
  it('rejects text that is not JSON', () => {
    const r = parseBundle('not json at all')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/not valid JSON/i)
  })

  it('rejects JSON that is not an export', () => {
    const r = parseBundle('{"hello":"world"}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/not an EPAS export/i)
  })

  it('rejects an export written by a newer version of the app', () => {
    const r = parseBundle('{"format":"epas-export","formatVersion":99,"exportedAt":"x","state":{}}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/newer version/i)
  })

  it('rejects an export whose state has no participant code', () => {
    const r = parseBundle('{"format":"epas-export","formatVersion":1,"exportedAt":"x","state":{"schemaVersion":1}}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/participant code/i)
  })

  it('rejects an empty file', () => {
    expect(parseBundle('').ok).toBe(false)
  })

  it('rejects a JSON array', () => {
    const r = parseBundle('[1,2,3]')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/not an EPAS export/i)
  })

  it('rejects a bare JSON null', () => {
    expect(parseBundle('null').ok).toBe(false)
  })

  it('rejects a bare JSON string', () => {
    expect(parseBundle('"hello"').ok).toBe(false)
  })

  it('calls a non-numeric version a malformed file rather than a newer one', () => {
    const r = parseBundle('{"format":"epas-export","formatVersion":"1","exportedAt":"x","state":{}}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/not an EPAS export/i)
  })

  it('rejects a version it does not recognise', () => {
    const r = parseBundle('{"format":"epas-export","formatVersion":0,"exportedAt":"x","state":{}}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/unrecognised version/i)
  })
})

function att(over: Partial<Attempt> = {}): Attempt {
  return {
    itemId: 'x', moduleId: 'm1', competency: 'Explain the overview of Electronic Systems Servicing.',
    correct: true, at: '2026-01-01T00:00:00.000Z', context: 'pretest', runId: 'r1', ...over,
  }
}

describe('competencyColumns', () => {
  const cols = competencyColumns()

  it('gives one column group per competency in the bank', () => {
    expect(cols.length).toBe(28)
  })

  it('keys each group by a pair id rather than by the competency sentence', () => {
    expect(cols[0]?.pair).toMatch(/^m\d+-c\d+$/)
  })

  it('carries the module and the full competency text for the codebook', () => {
    const c = cols[0]!
    expect(c.moduleId).toMatch(/^m\d+$/)
    expect(c.competency.length).toBeGreaterThan(10)
  })

  it('returns them in a stable order across calls', () => {
    expect(competencyColumns().map(c => c.pair)).toEqual(cols.map(c => c.pair))
  })
})

describe('csvHeader', () => {
  const head = csvHeader()

  it('starts with the participant identity and where the row came from', () => {
    expect(head.slice(0, 6)).toEqual([
      'participant_code', 'name', 'consented_at', 'in_study',
      'exported_at', 'files_from_student',
    ])
  })

  it('carries three columns for every competency', () => {
    expect(head.filter(h => h.startsWith('pre__')).length).toBe(28)
    expect(head.filter(h => h.startsWith('post__')).length).toBe(28)
    expect(head.filter(h => h.startsWith('gain__')).length).toBe(28)
  })

  it('carries one column per survey item plus the respondent and the comments', () => {
    expect(head.filter(h => h.startsWith('sq_')).length).toBe(20)
    expect(head).toContain('respondent')
    expect(head).toContain('comments')
  })

  it('uses no character that would need quoting in a header', () => {
    for (const h of head) expect(/[",\r\n]/.test(h), h).toBe(false)
  })

  it('repeats no column name', () => {
    expect(new Set(head).size).toBe(head.length)
  })
})

describe('csvRow', () => {
  it('is exactly as wide as the header', () => {
    expect(csvRow(state()).length).toBe(csvHeader().length)
  })

  it('reports a competency never sat as an empty cell rather than a zero', () => {
    const head = csvHeader()
    const row = csvRow(state())
    const i = head.indexOf('pre__m1-c1')
    expect(row[i]).toBe('')
  })

  it('writes 1 and 0 for a competency answered right and wrong', () => {
    const head = csvHeader()
    const row = csvRow(state({
      attempts: [
        att({ correct: false, context: 'pretest', at: '2026-01-01T00:00:00.000Z' }),
        att({ correct: true, context: 'posttest', at: '2026-02-01T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('pre__m1-c1')]).toBe(0)
    expect(row[head.indexOf('post__m1-c1')]).toBe(1)
    expect(row[head.indexOf('gain__m1-c1')]).toBe(1)
  })

  it('does not score a gain where the competency was already held', () => {
    const head = csvHeader()
    const row = csvRow(state({
      attempts: [
        att({ correct: true, context: 'pretest', at: '2026-01-01T00:00:00.000Z' }),
        att({ correct: true, context: 'posttest', at: '2026-02-01T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('gain__m1-c1')]).toBe(0)
  })

  it('leaves the gain empty when only one side was sat', () => {
    const head = csvHeader()
    const row = csvRow(state({ attempts: [att({ correct: false, context: 'pretest' })] }))
    expect(row[head.indexOf('gain__m1-c1')]).toBe('')
  })

  it('reports only the newest run of a retaken test', () => {
    const head = csvHeader()
    const row = csvRow(state({
      attempts: [
        att({ correct: false, runId: 'r1', at: '2026-01-01T00:00:00.000Z' }),
        att({ correct: true, runId: 'r2', at: '2026-01-02T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('pre__m1-c1')]).toBe(1)
  })

  // A pre-test retaken after the post-test is not a before-and-after
  // measurement. competencyGains refuses to count it; the row must agree.
  it('leaves the gain empty when the pre-test was sat after the post-test', () => {
    const head = csvHeader()
    const row = csvRow(state({
      attempts: [
        att({ correct: false, context: 'pretest', at: '2026-03-01T00:00:00.000Z' }),
        att({ correct: true, context: 'posttest', at: '2026-02-01T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('pre__m1-c1')]).toBe(0)
    expect(row[head.indexOf('post__m1-c1')]).toBe(1)
    expect(row[head.indexOf('gain__m1-c1')]).toBe('')
  })

  it('still maps an attempt whose competency text no longer matches the bank', () => {
    const head = csvHeader()
    const reworded = 'Explain the overview of Electronic Systems Servicing'
    const row = csvRow(state({
      attempts: [
        att({ itemId: 'b-m1-c1-a', competency: reworded, correct: false, context: 'pretest', at: '2026-01-01T00:00:00.000Z' }),
        att({ itemId: 'b-m1-c1-b', competency: reworded, correct: true, context: 'posttest', at: '2026-02-01T00:00:00.000Z' }),
      ],
    }))
    expect(row[head.indexOf('gain__m1-c1')]).toBe(1)
  })

  it('writes the survey answers and the free text', () => {
    const head = csvHeader()
    const row = csvRow(state({ survey: { fs1: 4, respondent: 'student', comments: 'clear' } }))
    expect(row[head.indexOf('sq_fs1')]).toBe(4)
    expect(row[head.indexOf('respondent')]).toBe('student')
    expect(row[head.indexOf('comments')]).toBe('clear')
  })

  // The teacher sees a repeat hand-in on screen, but the saved file is what is
  // archived beside the paper and has to say so itself.
  it('records where the row came from', () => {
    const head = csvHeader()
    const row = csvRow(state(), { exportedAt: '2026-09-13T00:00:00.000Z', filesFromStudent: 2 })
    expect(row[head.indexOf('exported_at')]).toBe('2026-09-13T00:00:00.000Z')
    expect(row[head.indexOf('files_from_student')]).toBe(2)
  })

  it('leaves the provenance blank when it is not given', () => {
    const head = csvHeader()
    const row = csvRow(state())
    expect(row[head.indexOf('exported_at')]).toBe('')
    expect(row[head.indexOf('files_from_student')]).toBe('')
  })

  it('records whether the student agreed to take part', () => {
    const head = csvHeader()
    expect(csvRow(state({ participant: { code: 'X', research: true } }))[head.indexOf('in_study')]).toBe('yes')
    expect(csvRow(state({ participant: { code: 'X', research: false } }))[head.indexOf('in_study')]).toBe('no')
  })

  // A record written before the choice existed is unknown, not consent.
  it('reports an absent research field as unknown rather than as yes', () => {
    const head = csvHeader()
    expect(csvRow(state({ participant: { code: 'X' } }))[head.indexOf('in_study')]).toBe('unknown')
  })
})

describe('codebookRows', () => {
  const rows = codebookRows()

  it('starts with a header', () => {
    expect(rows[0]).toEqual(['column', 'kind', 'module', 'meaning'])
  })

  it('explains every competency column and every survey column', () => {
    const named = rows.slice(1).map(r => r[0])
    expect(named).toContain('pre__m1-c1')
    expect(named).toContain('gain__m1-c1')
    expect(named).toContain('sq_fs1')
  })

  it('names every column the header emits', () => {
    const named = new Set(rows.slice(1).map(r => r[0]))
    for (const h of csvHeader()) expect(named.has(h), `${h} is not in the codebook`).toBe(true)
  })
})

describe('task and engagement columns', () => {
  it('carries three columns for every performance task', () => {
    const head = csvHeader()
    expect(head.filter(h => h.endsWith('_steps_done')).length).toBe(8)
    expect(head.filter(h => h.endsWith('_steps_total')).length).toBe(8)
    expect(head.filter(h => h.endsWith('_notes')).length).toBe(8)
  })

  it('carries the five engagement columns', () => {
    const head = csvHeader()
    for (const c of ['lessons_completed', 'formative_attempted', 'formative_correct', 'sims_run', 'sims_distinct']) {
      expect(head, c).toContain(c)
    }
  })

  it('is still exactly as wide as the header', () => {
    expect(csvRow(state()).length).toBe(csvHeader().length)
  })

  it('reports an untouched task as zero of its step count, not as blank', () => {
    const head = csvHeader()
    const row = csvRow(state())
    expect(row[head.indexOf('task_t1_steps_done')]).toBe(0)
    expect(row[head.indexOf('task_t1_steps_total')]).toBeGreaterThan(0)
  })

  it('counts the steps a student ticked', () => {
    const head = csvHeader()
    const row = csvRow(state({ tasks: { t1: { checked: [0, 2, 4] } } }))
    expect(row[head.indexOf('task_t1_steps_done')]).toBe(3)
  })

  // A teacher merges files collected from thirty phones. parseBundle proves
  // the code and the attempts array and nothing else, so a truncated or
  // hand-edited file must cost that student's figures rather than throwing
  // and taking the whole class table with it.
  it('builds a row from a file whose task, module and sim records are malformed', () => {
    const broken = {
      ...state(),
      tasks: { t1: { checked: 'nope' } },
      modules: null,
      sims: undefined,
    } as unknown as StoreV1
    const head = csvHeader()
    const row = csvRow(broken)
    expect(row.length).toBe(head.length)
    expect(row[head.indexOf('task_t1_steps_done')]).toBe(0)
    expect(row[head.indexOf('lessons_completed')]).toBe(0)
    expect(row[head.indexOf('sims_run')]).toBe(0)
    expect(row[head.indexOf('participant_code')]).toBe(state().participant.code)
  })

  // `checked` is a set of indices. A payload carrying the same index twice,
  // which the store no longer writes but a hand-edited or foreign file can
  // still hold, must not inflate the count.
  it('counts a repeated step index once', () => {
    const head = csvHeader()
    const row = csvRow(state({ tasks: { t1: { checked: [0, 0, 0, 1, 1] } } }))
    expect(row[head.indexOf('task_t1_steps_done')]).toBe(2)
  })

  // A tick is the student's own record, so the count must not exceed the
  // sheet: a stale index from an edited sheet would otherwise report six of
  // five and nobody would notice until the analysis.
  it('never reports more steps done than the sheet has', () => {
    const head = csvHeader()
    const row = csvRow(state({ tasks: { t1: { checked: [0, 1, 2, 3, 4, 5, 6, 7, 99] } } }))
    const done = row[head.indexOf('task_t1_steps_done')] as number
    const total = row[head.indexOf('task_t1_steps_total')] as number
    expect(done).toBeLessThanOrEqual(total)
  })

  it('counts engagement from the store', () => {
    const head = csvHeader()
    const row = csvRow(state({
      modules: { m1: { completedOutcomes: ['lo1', 'lo2'] }, m2: { completedOutcomes: ['lo1'] } },
      attempts: [
        { itemId: 'a', moduleId: 'm1', competency: 'C', correct: true, at: '2026-01-01T00:00:00.000Z', context: 'formative' },
        { itemId: 'b', moduleId: 'm1', competency: 'C', correct: false, at: '2026-01-01T00:00:00.000Z', context: 'formative' },
        { itemId: 'c', moduleId: 'm1', competency: 'C', correct: true, at: '2026-01-01T00:00:00.000Z', context: 'pretest' },
      ],
      sims: [
        { simId: 'multimeter', moduleId: 'm1', score: 1, at: '2026-01-01T00:00:00.000Z', evidence: {} },
        { simId: 'multimeter', moduleId: 'm1', score: 1, at: '2026-01-02T00:00:00.000Z', evidence: {} },
        { simId: 'psu', moduleId: 'm2', score: 1, at: '2026-01-03T00:00:00.000Z', evidence: {} },
      ],
    }))
    expect(row[head.indexOf('lessons_completed')]).toBe(3)
    expect(row[head.indexOf('formative_attempted')]).toBe(2)
    expect(row[head.indexOf('formative_correct')]).toBe(1)
    expect(row[head.indexOf('sims_run')]).toBe(3)
    expect(row[head.indexOf('sims_distinct')]).toBe(2)
  })

  it('explains every new column in the codebook', () => {
    const named = new Set(codebookRows().slice(1).map(r => r[0]))
    for (const h of csvHeader()) expect(named.has(h), `${h} is not in the codebook`).toBe(true)
  })
})

describe('rubricRows', () => {
  const rows = rubricRows([{ code: 'EPAS-AAAA11' }])

  it('starts with a header', () => {
    expect(rows[0]).toEqual(['participant_code', 'task_id', 'task_title', 'criterion', 'max_points', 'score'])
  })

  it('gives one row per student per task per criterion', () => {
    expect(rows.length - 1).toBe(33)
  })

  it('leaves the score blank for the teacher to fill in', () => {
    expect(rows[1]?.[5]).toBe('')
  })

  it('repeats the whole sheet for a second student', () => {
    expect(rubricRows([{ code: 'A' }, { code: 'B' }]).length - 1).toBe(66)
  })

  it('returns only a header for no students', () => {
    expect(rubricRows([])).toHaveLength(1)
  })
})
