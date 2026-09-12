import { describe, expect, it } from 'vitest'
import type { StoreV1 } from '../src/lib/store'
import { csvCell, csvLine, parseBundle, toBundle, toCsv } from '../src/lib/export'

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
