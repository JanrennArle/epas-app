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
}

export interface SimRecord {
  simId: string
  moduleId: string
  score: number
  at: string
  evidence: Record<string, unknown>
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
  let parsed: unknown
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
  saveState(migrated)
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
