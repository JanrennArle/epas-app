import type { StoreV1 } from './store'

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
