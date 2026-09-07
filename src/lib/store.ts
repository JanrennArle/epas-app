export const STORAGE_KEY = 'epas.v1'
export const SCHEMA_VERSION = 1

export type AttemptContext = 'formative' | 'pretest' | 'posttest'

export interface Attempt {
  itemId: string
  moduleId: string
  competency: string
  correct: boolean
  at: string
  context: AttemptContext
  /** Identifies one sitting. Absent on records written before runs existed. */
  runId?: string
}

export interface SimRecord {
  simId: string
  moduleId: string
  /** Fraction 0..1. */
  score: number
  at: string
  evidence: Record<string, unknown>
  /** Identifies one sitting. Absent on records written before runs existed. */
  runId?: string
}

export interface ModuleProgress {
  started?: string
  completedOutcomes: string[]
}

export interface StoreV1 {
  schemaVersion: 1
  participant: { code: string; name?: string; consentedAt?: string }
  modules: Record<string, ModuleProgress>
  attempts: Attempt[]
  sims: SimRecord[]
  survey?: Record<string, number | string>
}

function newCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  for (const b of bytes) out += alphabet.charAt(b % alphabet.length)
  return `EPAS-${out}`
}

function freshState(code = newCode()): StoreV1 {
  return {
    schemaVersion: SCHEMA_VERSION,
    participant: { code },
    modules: {},
    attempts: [],
    sims: [],
  }
}

function migrate(raw: unknown): StoreV1 {
  if (typeof raw !== 'object' || raw === null) return freshState()
  const r = raw as Record<string, unknown>

  if (r.schemaVersion === 1) return r as unknown as StoreV1

  // Version 0 stored a flat participantCode and no modules map.
  if (r.schemaVersion === 0) {
    const code = typeof r.participantCode === 'string' ? r.participantCode : newCode()
    const base = freshState(code)
    if (Array.isArray(r.attempts)) base.attempts = r.attempts as Attempt[]
    if (Array.isArray(r.sims)) base.sims = r.sims as SimRecord[]
    return base
  }

  return freshState()
}

export function loadState(): StoreV1 {
  let raw: string | null = null
  let parsed: unknown
  try {
    raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      const s = freshState()
      saveState(s)
      return s
    }
    parsed = JSON.parse(raw)
  } catch {
    const s = freshState()
    saveState(s)
    return s
  }
  const migrated = migrate(parsed)
  if (migrated !== parsed) {
    if (raw) localStorage.setItem(`${STORAGE_KEY}.unreadable.${Date.now()}`, raw)
    saveState(migrated)
  }
  return migrated
}

export function saveState(s: StoreV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Storage full or blocked. The session continues in memory rather than
    // crashing a student mid-quiz.
  }
}

function update(fn: (s: StoreV1) => void): void {
  const s = loadState()
  fn(s)
  saveState(s)
}

export function recordAttempt(a: Attempt): void {
  update(s => { s.attempts.push(a) })
}

export function recordSim(r: SimRecord): void {
  update(s => { s.sims.push(r) })
}

export function markOutcomeComplete(moduleId: string, outcomeId: string): void {
  update(s => {
    const m = s.modules[moduleId] ?? { completedOutcomes: [], started: new Date().toISOString() }
    if (!m.completedOutcomes.includes(outcomeId)) m.completedOutcomes.push(outcomeId)
    s.modules[moduleId] = m
  })
}

export function resetAll(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function newRunId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * The attempts from the most recent sitting of one module and context.
 * A repeat sitting supersedes an earlier one rather than being averaged
 * with it, so a student who retakes a pre-test is measured on the retake.
 * Records written before runs existed share the run `undefined` and are
 * returned together.
 */
export function attemptsFor(moduleId: string, context: AttemptContext): Attempt[] {
  const all = loadState().attempts.filter(a => a.moduleId === moduleId && a.context === context)
  if (all.length === 0) return []
  let newest = all[0]!
  // `>=` rather than `>` so that when two sittings share a timestamp the
  // later written one wins. Records are appended, so the last match is the
  // most recent. With distinct timestamps the two behave identically.
  for (const a of all) if (a.at >= newest.at) newest = a
  return all.filter(a => a.runId === newest.runId)
}

export function hasTaken(moduleId: string, context: AttemptContext): boolean {
  return attemptsFor(moduleId, context).length > 0
}

/**
 * Records consent. The participant code was issued when the store was first
 * created, so consenting never changes it: a student who consents keeps the
 * identity their earlier work is already filed under.
 */
export function setConsent(name?: string): void {
  update(s => {
    const trimmed = name?.trim()
    s.participant.consentedAt = new Date().toISOString()
    if (trimmed) s.participant.name = trimmed
  })
}

export function hasConsented(): boolean {
  return loadState().participant.consentedAt !== undefined
}
