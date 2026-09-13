import { allModules } from '../content'
import { BANK } from '../content/bank'
import { SURVEY } from '../content/survey'
import { TASKS } from '../content/tasks'
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
  if (!Array.isArray(b.state?.attempts)) {
    return { ok: false, reason: 'This export is missing its answers.' }
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
  const head = ['participant_code', 'name', 'consented_at', 'in_study', 'exported_at', 'files_from_student']
  for (const c of competencyColumns()) head.push(`pre__${c.pair}`, `post__${c.pair}`, `gain__${c.pair}`)
  for (const item of SURVEY) head.push(`sq_${item.id}`)
  for (const t of TASKS) head.push(`task_${t.id}_steps_done`, `task_${t.id}_steps_total`, `task_${t.id}_notes`)
  head.push('lessons_completed', 'formative_attempted', 'formative_correct', 'sims_run', 'sims_distinct')
  head.push('respondent', 'comments')
  return head
}

/** `yes`, `no`, or `unknown` for a record written before the choice existed. */
function studyFlag(state: StoreV1): string {
  if (state.participant.research === true) return 'yes'
  if (state.participant.research === false) return 'no'
  return 'unknown'
}

/**
 * Where the row came from. The teacher sees a repeat hand-in on screen, but
 * the saved file is what is archived beside the paper, so it has to carry its
 * own provenance rather than relying on someone remembering.
 */
export interface RowProvenance {
  /** When the export this row was built from was saved. */
  exportedAt?: string
  /** How many files the teacher held for this student. */
  filesFromStudent?: number
}

export function csvRow(state: StoreV1, from: RowProvenance = {}): Cell[] {
  const row: Cell[] = [
    state.participant.code,
    state.participant.name ?? '',
    state.participant.consentedAt ?? '',
    studyFlag(state),
    from.exportedAt ?? '',
    from.filesFromStudent ?? '',
  ]

  // An attempt stores the competency text, which is what competencyGains keys
  // by, and the bank item id, which identifies the pair exactly. Build the
  // bridge from the attempts themselves so a competency reworded between
  // terms still lands in its own column instead of emptying it, which would
  // be indistinguishable from the student never having sat it.
  // Called twice: on the student's own state from the progress screen, where
  // the store wrote every value, and on files a teacher collected from thirty
  // phones, where nothing did. parseBundle proves the participant code and
  // that `attempts` is an array, and nothing about what is inside it, so the
  // reads below are written for the second caller: a truncated or hand-edited
  // file costs that student's figures rather than throwing and taking the
  // whole class table with it.
  const attempts = state.attempts.filter(a => a !== null && typeof a === 'object')
  const pairOfCompetency = new Map<string, string>()
  for (const a of attempts) {
    const item = BANK.find(i => i.id === a.itemId)
    if (item) pairOfCompetency.set(a.competency, item.pair)
  }

  // Gains are computed per module by the assessment engine, then indexed by
  // competency text, which is what an Attempt carries. The bank maps that
  // text back to the pair id the columns are keyed by.
  const byPair = new Map<string, { pre: boolean | null; post: boolean | null; gained: boolean; ordered: boolean }>()
  for (const m of allModules()) {
    const pre = newestRun(attempts, m.id, 'pretest')
    const post = newestRun(attempts, m.id, 'posttest')
    for (const g of competencyGains(pre, post)) {
      const pair = pairOfCompetency.get(g.competency)
        ?? BANK.find(i => i.moduleId === m.id && i.competency === g.competency)?.pair
      if (pair) byPair.set(pair, g)
    }
  }

  // Numbers, not the strings '1' and '0'. csvCell guards any TEXT beginning
  // with a dash, so numeric data kept as text would be silently prefixed the
  // day a column carries a negative value. Numbers bypass that path. The
  // rendered CSV is identical either way.
  const bit = (v: boolean | null | undefined) => (v === true ? 1 : v === false ? 0 : '')

  for (const c of competencyColumns()) {
    const g = byPair.get(c.pair)
    row.push(bit(g?.pre), bit(g?.post))
    // A gain needs both sides, sat in that order. Anything else is missing
    // data rather than an absence of learning, so the cell stays empty.
    const measurable = g !== undefined && g.ordered && g.pre !== null && g.post !== null
    row.push(measurable ? (g.gained ? 1 : 0) : '')
  }

  const survey = state.survey ?? {}
  for (const item of SURVEY) row.push(survey[item.id] ?? '')

  for (const t of TASKS) {
    const p = state.tasks?.[t.id]
    // Counted as a set of indices into the sheet, which is what it is. The
    // clamp is for a sheet edited between terms, which can leave a stored
    // index that no longer exists; the dedupe is for the same index arriving
    // twice. Reporting six steps done out of five would not be noticed until
    // the analysis.
    const ticks = Array.isArray(p?.checked) ? p.checked : []
    const done = new Set(ticks.filter(i => Number.isInteger(i) && i >= 0 && i < t.steps.length)).size
    row.push(done, t.steps.length, p?.notes ?? '')
  }

  const modules = state.modules && typeof state.modules === 'object' ? Object.values(state.modules) : []
  // `.length` rather than Array.isArray would count a string: an outcome list
  // that arrived as 'lo1' would export three lessons completed.
  const lessons = modules.reduce((n, m) => n + (Array.isArray(m?.completedOutcomes) ? m.completedOutcomes.length : 0), 0)
  const sims = Array.isArray(state.sims) ? state.sims.filter(s => s !== null && typeof s === 'object') : []
  const formative = attempts.filter(a => a.context === 'formative')
  row.push(
    lessons,
    formative.length,
    formative.filter(a => a.correct).length,
    sims.length,
    new Set(sims.map(s => s.simId)).size,
  )

  row.push(survey.respondent ?? '', survey.comments ?? '')

  return row
}

/**
 * A row for a student whose file could not be turned into one.
 *
 * `csvRow` is written to survive every shape the app writes and every one a
 * truncated or hand-edited file has produced, and the suite holds it to that
 * over malformed tasks, modules, sims and attempts. It is not proof against
 * an input nobody has thought of: a timestamp that throws when compared
 * still reaches the assessment engine, for one. `classTable` is where that
 * stops being the teacher's problem, because the failure this all guards
 * against is pressing the button the night before the deadline and getting
 * no file at all.
 *
 * It carries every column the merge already knew without reading the file:
 * the code, whether the student is in the study, when they exported and how
 * many files they handed in. Everything the file would have supplied is
 * blank rather than zero, because a zero is a score a student can earn and a
 * blank is not, and because a row that answered 'no' to `in_study` would be
 * dropped by the first filter any analyst writes. `codebookRows` describes
 * the shape so it is recognisable six months later.
 */
export function failedRow(code: string, from: FailedRowInfo = {}): Cell[] {
  const row: Cell[] = new Array<Cell>(csvHeader().length).fill('')
  row[0] = code
  row[3] = from.inStudy ?? 'unknown'
  row[4] = from.exportedAt ?? ''
  row[5] = from.filesFromStudent ?? ''
  return row
}

export interface FailedRowInfo extends RowProvenance {
  /** What the merge decided before the file was read. */
  inStudy?: string
}

export interface ClassStudent {
  code: string
  state: StoreV1
  from: FailedRowInfo
}

export interface ClassTable {
  /** The header, then one row per student, in the order given. */
  rows: Cell[][]
  /** Codes that fell back to a blank row, for the teacher to be told about. */
  unreadable: string[]
}

/**
 * The whole class table, header included.
 *
 * This lives here rather than in the screen that downloads it because it
 * decides, per student, what reaches the teacher's table, and that is the
 * shape of decision this project keeps getting wrong in glue code. The
 * consent rule broke three times that way before it moved into `merge.ts`.
 */
export function classTable(students: ClassStudent[]): ClassTable {
  const rows: Cell[][] = [csvHeader()]
  const unreadable: string[] = []
  for (const s of students) {
    try {
      rows.push(csvRow(s.state, s.from))
    } catch {
      unreadable.push(s.code)
      rows.push(failedRow(s.code, s.from))
    }
  }
  return { rows, unreadable }
}

/**
 * Without this the data file is a wall of `pre__m4-c3` columns that nobody,
 * including the person who collected it, can interpret six months later.
 */
export function codebookRows(): Cell[][] {
  const rows: Cell[][] = [['column', 'kind', 'module', 'meaning']]
  rows.push(['participant_code', 'identity', '', 'The code issued to this device on first launch'])
  rows.push(['name', 'identity', '', 'Optional, blank where the student stayed anonymous'])
  rows.push(['(a row with only participant_code, in_study, exported_at and files_from_student filled)', 'reading note', '', 'That student handed in a file the app could not turn into a row. Every other column is blank rather than zero, because a zero is a mark a student can earn and a blank is not. The teacher was told at the time'])
  rows.push(['consented_at', 'identity', '', 'When the consent screen was answered'])
  rows.push(['in_study', 'identity', '', 'yes, no, or unknown for a record written before the choice existed'])
  rows.push(['exported_at', 'identity', '', 'When the export this row was built from was saved'])
  rows.push(['files_from_student', 'identity', '', 'How many files were held for this student. More than one means they handed in twice'])

  for (const c of competencyColumns()) {
    rows.push([`pre__${c.pair}`, 'pre-test', c.moduleId, `1 correct, 0 wrong, blank not sat. ${c.competency}`])
    rows.push([`post__${c.pair}`, 'post-test', c.moduleId, `1 correct, 0 wrong, blank not sat. ${c.competency}`])
    rows.push([`gain__${c.pair}`, 'gain', c.moduleId, `1 wrong before and right after, 0 otherwise, blank not measurable. ${c.competency}`])
  }

  for (const item of SURVEY) {
    rows.push([`sq_${item.id}`, 'survey', '', `1 to 5, strongly disagree to strongly agree. ${item.category}: ${item.text}`])
  }

  for (const t of TASKS) {
    rows.push([`task_${t.id}_steps_done`, 'task', t.modules.join(' '), `Steps the student ticked on ${t.title}. Their own record of what they did, not evidence that they did it`])
    rows.push([`task_${t.id}_steps_total`, 'task', t.modules.join(' '), `How many steps that sheet has`])
    rows.push([`task_${t.id}_notes`, 'task', t.modules.join(' '), `What the student wrote on ${t.title}`])
  }
  rows.push(['lessons_completed', 'engagement', '', 'Learning outcomes marked complete across all nine modules'])
  rows.push(['formative_attempted', 'engagement', '', 'Formative quiz items answered inside lessons. Excluded from the gain'])
  rows.push(['formative_correct', 'engagement', '', 'How many of those were right'])
  rows.push(['sims_run', 'engagement', '', 'Simulation runs recorded, including repeats and runs started from Labs'])
  rows.push(['sims_distinct', 'engagement', '', 'How many different simulations were run at least once'])

  rows.push(['respondent', 'survey', '', 'student, teacher, or expert'])
  rows.push(['comments', 'survey', '', 'Free text, optional'])

  return rows
}

/**
 * The sheet a teacher scores by hand. A performance task is judged by watching
 * a student work at a bench, so the app supplies the criteria, the maximum for
 * each, and a blank column. Deriving a score from ticked checkboxes would
 * produce a number that looks like an assessment and is not one.
 *
 * Every task is listed for every student, whether or not they ticked anything,
 * so the teacher gets a complete sheet rather than one with gaps they have to
 * notice.
 */
export function rubricRows(students: { code: string }[]): Cell[][] {
  const rows: Cell[][] = [['participant_code', 'task_id', 'task_title', 'criterion', 'max_points', 'score']]
  for (const s of students) {
    for (const t of TASKS) {
      for (const r of t.rubric) {
        rows.push([s.code, t.id, t.title, r.criterion, r.points, ''])
      }
    }
  }
  return rows
}
