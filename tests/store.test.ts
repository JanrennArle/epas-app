import {
  loadState, saveState, recordAttempt, recordSim,
  markOutcomeComplete, newRunId, attemptsFor, hasTaken, STORAGE_KEY,
  setConsent, hasConsented, setSurvey, surveyAnswers, resetAll,
} from '../src/lib/store'
import type { Attempt } from '../src/lib/store'

describe('store', () => {
  it('returns a fresh state with a participant code when empty', () => {
    const s = loadState()
    expect(s.schemaVersion).toBe(1)
    expect(s.participant.code).toMatch(/^EPAS-[A-Z0-9]{6}$/)
    expect(s.attempts).toEqual([])
  })

  it('keeps the same participant code across loads', () => {
    const a = loadState().participant.code
    const b = loadState().participant.code
    expect(b).toBe(a)
  })

  it('appends attempts without dropping earlier ones', () => {
    recordAttempt({ itemId: 'q1', moduleId: 'm1', competency: 'c1', correct: true, at: '2026-09-06T00:00:00Z', context: 'formative' })
    recordAttempt({ itemId: 'q2', moduleId: 'm1', competency: 'c1', correct: false, at: '2026-09-06T00:01:00Z', context: 'formative' })
    expect(loadState().attempts).toHaveLength(2)
  })

  it('records a sim result', () => {
    recordSim({ simId: 'multimeter', moduleId: 'm1', score: 0.8, at: '2026-09-06T00:00:00Z', evidence: { probed: 5 } })
    expect(loadState().sims[0]!.simId).toBe('multimeter')
  })

  it('does not duplicate a completed outcome', () => {
    markOutcomeComplete('m1', 'lo1')
    markOutcomeComplete('m1', 'lo1')
    expect(loadState().modules.m1!.completedOutcomes).toEqual(['lo1'])
  })

  it('recovers from corrupt stored JSON instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const s = loadState()
    expect(s.schemaVersion).toBe(1)
  })

  it('preserves a forward schema version under an unreadable key instead of losing it', () => {
    const payload = JSON.stringify({
      schemaVersion: 99,
      participant: { code: 'EPAS-FUTURE' },
      attempts: [{ itemId: 'q9', moduleId: 'm1', competency: 'c1', correct: true, at: 'x', context: 'formative' }],
    })
    localStorage.setItem(STORAGE_KEY, payload)
    loadState()
    const salvaged: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(`${STORAGE_KEY}.unreadable.`)) salvaged.push(k)
    }
    expect(salvaged).toHaveLength(1)
    expect(localStorage.getItem(salvaged[0]!)).toBe(payload)
  })

  it('migrates a version 0 payload by preserving its attempts', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: 0,
      participantCode: 'EPAS-OLD123',
      attempts: [{ itemId: 'q1', moduleId: 'm1', competency: 'c1', correct: true, at: 'x', context: 'formative' }],
    }))
    const s = loadState()
    expect(s.schemaVersion).toBe(1)
    expect(s.participant.code).toBe('EPAS-OLD123')
    expect(s.attempts).toHaveLength(1)
  })
})

describe('run identity', () => {
  beforeEach(() => localStorage.clear())

  it('gives each run a distinct id', () => {
    expect(newRunId()).not.toBe(newRunId())
  })

  it('keeps every attempt rather than overwriting a repeat', () => {
    const base = { itemId: 'x', moduleId: 'm1', competency: 'C', at: '2026-01-01T00:00:00.000Z', context: 'pretest' as const }
    recordAttempt({ ...base, correct: false, runId: 'r1' })
    recordAttempt({ ...base, correct: true, runId: 'r2' })
    expect(loadState().attempts).toHaveLength(2)
  })

  it('returns only the newest run when asked for a module and context', () => {
    const base = { itemId: 'x', moduleId: 'm1', competency: 'C', context: 'pretest' as const }
    recordAttempt({ ...base, correct: false, runId: 'r1', at: '2026-01-01T00:00:00.000Z' })
    recordAttempt({ ...base, correct: true, runId: 'r2', at: '2026-01-02T00:00:00.000Z' })
    const got = attemptsFor('m1', 'pretest')
    expect(got).toHaveLength(1)
    expect(got[0]?.correct).toBe(true)
  })

  it('ignores other modules and other contexts', () => {
    const base = { itemId: 'x', competency: 'C', at: '2026-01-01T00:00:00.000Z', correct: true, runId: 'r1' }
    recordAttempt({ ...base, moduleId: 'm1', context: 'pretest' })
    recordAttempt({ ...base, moduleId: 'm2', context: 'pretest' })
    recordAttempt({ ...base, moduleId: 'm1', context: 'posttest' })
    expect(attemptsFor('m1', 'pretest')).toHaveLength(1)
  })

  it('treats a record written before runIds existed as one legacy run', () => {
    const s = loadState()
    s.attempts.push({ itemId: 'old', moduleId: 'm1', competency: 'C', correct: true,
      at: '2025-01-01T00:00:00.000Z', context: 'pretest' } as Attempt)
    saveState(s)
    const got = attemptsFor('m1', 'pretest')
    expect(got).toHaveLength(1)
    expect(got[0]?.runId).toBeUndefined()
  })

  it('returns every attempt from the newest run, not only the newest attempt', () => {
    const base = { moduleId: 'm1', context: 'pretest' as const }
    for (const [n, c] of [['q1', 'C1'], ['q2', 'C2'], ['q3', 'C3']] as const) {
      recordAttempt({ ...base, itemId: n, competency: c, correct: false, runId: 'r1', at: '2026-01-01T00:00:00.000Z' })
    }
    for (const [n, c] of [['q1', 'C1'], ['q2', 'C2'], ['q3', 'C3']] as const) {
      recordAttempt({ ...base, itemId: n, competency: c, correct: true, runId: 'r2', at: '2026-01-02T00:00:00.000Z' })
    }
    const got = attemptsFor('m1', 'pretest')
    expect(got).toHaveLength(3)
    expect(got.every(a => a.runId === 'r2')).toBe(true)
    expect(got.map(a => a.competency).sort()).toEqual(['C1', 'C2', 'C3'])
  })

  it('prefers the later written run when two runs share a timestamp', () => {
    const base = { moduleId: 'm1', competency: 'C1', itemId: 'q1', context: 'pretest' as const, at: '2026-01-01T00:00:00.000Z' }
    recordAttempt({ ...base, correct: false, runId: 'r1' })
    recordAttempt({ ...base, correct: true, runId: 'r2' })
    const got = attemptsFor('m1', 'pretest')
    expect(got).toHaveLength(1)
    expect(got[0]?.runId).toBe('r2')
  })

  it('returns legacy records without a runId together as one run', () => {
    const s = loadState()
    for (const c of ['C1', 'C2']) {
      s.attempts.push({ itemId: `old-${c}`, moduleId: 'm1', competency: c, correct: true,
        at: '2025-01-01T00:00:00.000Z', context: 'pretest' } as Attempt)
    }
    saveState(s)
    expect(attemptsFor('m1', 'pretest')).toHaveLength(2)
  })

  it('reports whether a module and context has been taken', () => {
    expect(hasTaken('m1', 'pretest')).toBe(false)
    recordAttempt({ itemId: 'x', moduleId: 'm1', competency: 'C', correct: true,
      at: '2026-01-01T00:00:00.000Z', context: 'pretest', runId: 'r1' })
    expect(hasTaken('m1', 'pretest')).toBe(true)
  })
})

describe('consent', () => {
  beforeEach(() => localStorage.clear())

  it('starts without consent', () => {
    expect(hasConsented()).toBe(false)
  })

  it('records consent with a timestamp', () => {
    setConsent()
    expect(hasConsented()).toBe(true)
    expect(loadState().participant.consentedAt).toBeDefined()
  })

  it('keeps an optional name', () => {
    setConsent('Maria')
    expect(loadState().participant.name).toBe('Maria')
  })

  it('stores no name when none is given', () => {
    setConsent()
    expect(loadState().participant.name).toBeUndefined()
  })

  it('trims a name and treats blank as none', () => {
    setConsent('   ')
    expect(loadState().participant.name).toBeUndefined()
  })

  it('leaves the participant code that was issued at first load', () => {
    const code = loadState().participant.code
    setConsent('Maria')
    expect(loadState().participant.code).toBe(code)
  })
})

describe('survey answers', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    expect(surveyAnswers()).toEqual({})
  })

  it('keeps what was answered', () => {
    setSurvey({ fs1: 4, respondent: 'student' })
    expect(surveyAnswers()).toEqual({ fs1: 4, respondent: 'student' })
  })

  // The survey measures an opinion, not a performance, so a second pass is
  // a correction rather than a new attempt. There is no run history here.
  it('replaces an earlier answer rather than appending to it', () => {
    setSurvey({ fs1: 2 })
    setSurvey({ fs1: 5 })
    expect(surveyAnswers()).toEqual({ fs1: 5 })
  })

  it('survives a reload through the store', () => {
    setSurvey({ us1: 3, comments: 'the torch test was the clearest part' })
    expect(loadState().survey).toEqual({ us1: 3, comments: 'the torch test was the clearest part' })
  })

  it('is cleared when the device is handed to a new participant', () => {
    setSurvey({ fs1: 4 })
    resetAll()
    expect(surveyAnswers()).toEqual({})
  })
})
