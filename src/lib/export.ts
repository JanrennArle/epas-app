import { allModules } from '../content'
import { BANK } from '../content/bank'
import { SURVEY } from '../content/survey'
import { competencyGains } from './assess'
import type { StoreV1 } from './store'
import { newestRun } from './store'

export type Cell = string | number | boolean | null | undefined

/** A leading one of these makes a spreadsheet treat the cell as a formula. */
const FORMULA_START = /^[=+\-@\t\r]/

/**
 * One CSV cell, quoted per RFC 4180. A comma, a quote, a newline or an edge
 * space all change how a reader parses the row, and a competency string or a
 * student's free text comment can carry any of them. Getting this wrong
 * shifts columns silently rather than producing a file that looks broken.
 *
 * Text that a spreadsheet would evaluate as a formula is prefixed with a
 * single quote so it is shown literally. Only text is guarded: a number
 * keeps its own sign. The untouched original is always in the JSON export,
 * so making the spreadsheet copy literal loses nothing.
 */
export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const s = FORMULA_START.test(value) ? `'${value}` : value
  const needsQuotes = /[",\r\n]/.test(s) || s !== s.trim()
  return needsQuotes ? `"${s.replace(/"/g, '""')}"` : s
}

export function csvLine(cells: Cell[]): string {
  return cells.map(csvCell).join(',')
}

/** Rows joined with CRLF, which is what RFC 4180 and Excel both expect. */
export function toCsv(rows: Cell[][]): string {
  return rows.map(csvLine).join('\r\n')
}

export interface ExportBundle {
  format: 'epas-export'
  formatVersion: 1
  exportedAt: string
  state: StoreV1
}

/**
 * The lossless form. The teacher merge reads this rather than the CSV,
 * because the CSV is a summary and cannot be turned back into attempts.
 */
export function toBundle(state: StoreV1, now = new Date().toISOString()): ExportBundle {
  return {
    format: 'epas-export',
    formatVersion: 1,
    exportedAt: now,
    state: JSON.parse(JSON.stringify(state)) as StoreV1,
  }
}

export type ParseResult =
  | { ok: true; bundle: ExportBundle }
  | { ok: false; reason: string }

/**
 * Defensive on purpose. A teacher selects a folder of files and some of them
 * will not be exports, so every rejection has to name what is wrong with
 * that one file rather than aborting the whole merge.
 */
export function parseBundle(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'This file is not valid JSON.' }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, reason: 'This file is not an EPAS export.' }
  }
  const b = parsed as Partial<ExportBundle>
  if (b.format !== 'epas-export') {
    return { ok: false, reason: 'This file is not an EPAS export.' }
  }
  if (typeof b.formatVersion !== 'number') {
    return { ok: false, reason: 'This file is not an EPAS export.' }
  }
  if (b.formatVersion > 1) {
    return { ok: false, reason: 'This export was written by a newer version of the app.' }
  }
  if (b.formatVersion !== 1) {
    return { ok: false, reason: 'This export has an unrecognised version.' }
  }
  const code = b.state?.participant?.code
  if (typeof code !== 'string' || code.length === 0) {
    return { ok: false, reason: 'This export has no participant code.' }
  }
  return { ok: true, bundle: b as ExportBundle }
}

export interface CompetencyColumn {
  /** Stable short key, for example `m1-c1`. */
  pair: string
  moduleId: string
  competency: string
}

/**
 * One group of columns per competency, keyed by the bank's pair id. The
 * competency sentences are long and contain commas, which makes them poor
 * column names, so the pair id is the key and `codebookRows` carries the
 * meaning.
 */
export function competencyColumns(): CompetencyColumn[] {
  const seen = new Map<string, CompetencyColumn>()
  for (const item of BANK) {
    if (!seen.has(item.pair)) {
      seen.set(item.pair, { pair: item.pair, moduleId: item.moduleId, competency: item.competency })
    }
  }
  return [...seen.values()]
}

export function csvHeader(): string[] {
  const head = ['participant_code', 'name', 'consented_at', 'in_study']
  for (const c of competencyColumns()) head.push(`pre__${c.pair}`, `post__${c.pair}`, `gain__${c.pair}`)
  for (const item of SURVEY) head.push(`sq_${item.id}`)
  head.push('respondent', 'comments')
  return head
}

/** `yes`, `no`, or `unknown` for a record written before the choice existed. */
function studyFlag(state: StoreV1): string {
  if (state.participant.research === true) return 'yes'
  if (state.participant.research === false) return 'no'
  return 'unknown'
}

export function csvRow(state: StoreV1): Cell[] {
  const row: Cell[] = [
    state.participant.code,
    state.participant.name ?? '',
    state.participant.consentedAt ?? '',
    studyFlag(state),
  ]

  // Gains are computed per module by the assessment engine, then indexed by
  // competency text, which is what an Attempt carries. The bank maps that
  // text back to the pair id the columns are keyed by.
  const byPair = new Map<string, { pre: boolean | null; post: boolean | null; gained: boolean; ordered: boolean }>()
  for (const m of allModules()) {
    const pre = newestRun(state.attempts, m.id, 'pretest')
    const post = newestRun(state.attempts, m.id, 'posttest')
    for (const g of competencyGains(pre, post)) {
      const item = BANK.find(i => i.moduleId === m.id && i.competency === g.competency)
      if (item) byPair.set(item.pair, g)
    }
  }

  for (const c of competencyColumns()) {
    const g = byPair.get(c.pair)
    // Numbers, not the strings '1' and '0'. Numeric data must not go through
    // csvCell's text path: that path guards anything starting with a dash, so
    // a negative value emitted as a string would be silently prefixed. The
    // rendered CSV is identical either way.
    const bit = (v: boolean | null | undefined) => (v === true ? 1 : v === false ? 0 : '')
    row.push(bit(g?.pre), bit(g?.post))
    // A gain needs both sides, sat in that order. Anything else is missing
    // data rather than an absence of learning, so the cell stays empty.
    const measurable = g !== undefined && g.ordered && g.pre !== null && g.post !== null
    row.push(measurable ? (g.gained ? 1 : 0) : '')
  }

  const survey = state.survey ?? {}
  for (const item of SURVEY) row.push(survey[item.id] ?? '')
  row.push(survey.respondent ?? '', survey.comments ?? '')

  return row
}

/**
 * Without this the data file is a wall of `pre__m4-c3` columns that nobody,
 * including the person who collected it, can interpret six months later.
 */
export function codebookRows(): Cell[][] {
  const rows: Cell[][] = [['column', 'kind', 'module', 'meaning']]
  rows.push(['participant_code', 'identity', '', 'The code issued to this device on first launch'])
  rows.push(['name', 'identity', '', 'Optional, blank where the student stayed anonymous'])
  rows.push(['consented_at', 'identity', '', 'When the consent screen was answered'])
  rows.push(['in_study', 'identity', '', 'yes, no, or unknown for a record written before the choice existed'])

  for (const c of competencyColumns()) {
    rows.push([`pre__${c.pair}`, 'pre-test', c.moduleId, `1 correct, 0 wrong, blank not sat. ${c.competency}`])
    rows.push([`post__${c.pair}`, 'post-test', c.moduleId, `1 correct, 0 wrong, blank not sat. ${c.competency}`])
    rows.push([`gain__${c.pair}`, 'gain', c.moduleId, `1 wrong before and right after, 0 otherwise, blank not measurable. ${c.competency}`])
  }

  for (const item of SURVEY) {
    rows.push([`sq_${item.id}`, 'survey', '', `1 to 5, strongly disagree to strongly agree. ${item.category}: ${item.text}`])
  }
  rows.push(['respondent', 'survey', '', 'student, teacher, or expert'])
  rows.push(['comments', 'survey', '', 'Free text, optional'])

  return rows
}
