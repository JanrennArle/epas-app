import {
  loadState, recordAttempt, recordSim,
  markOutcomeComplete, STORAGE_KEY,
} from '../src/lib/store'

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
