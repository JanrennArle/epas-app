// tests/diagnose.test.ts
import { readingAt, isConclusive, requiredTests, scoreDiagnosis } from '../src/lib/diagnose'
import type { Scenario } from '../src/lib/diagnose'

const s: Scenario = {
  id: 'test',
  appliance: 'Test appliance',
  symptom: 'Nothing happens.',
  safety: ['Unplug it.'],
  faults: [
    { id: 'cord', label: 'Broken cord', remedy: 'Replace the cord.' },
    { id: 'fuse', label: 'Blown fuse', remedy: 'Fit a fuse of the same rating.' },
    { id: 'winding', label: 'Open winding', remedy: 'Rewind or replace the motor.' },
  ],
  actualFault: 'fuse',
  testPoints: [
    { id: 'tp-cord', label: 'Cord', action: 'Continuity across the plug pins.',
      readings: { cord: 'OL', '*': '0.4 ohm, beeps' }, implicates: ['cord'] },
    { id: 'tp-fuse', label: 'Fuse', action: 'Continuity across the fuse.',
      readings: { fuse: 'OL', '*': '0.2 ohm, beeps' }, implicates: ['fuse'] },
    { id: 'tp-wind', label: 'Winding', action: 'Resistance across the winding.',
      readings: { winding: 'OL', '*': '38 ohm' }, implicates: ['winding'] },
  ],
}

describe('readingAt', () => {
  it('gives the fault reading at the test point that exposes it', () => {
    expect(readingAt(s, 'tp-fuse')).toBe('OL')
  })

  it('gives the healthy reading everywhere else', () => {
    expect(readingAt(s, 'tp-cord')).toBe('0.4 ohm, beeps')
    expect(readingAt(s, 'tp-wind')).toBe('38 ohm')
  })

  it('returns an empty string for an unknown test point rather than throwing', () => {
    expect(readingAt(s, 'nope')).toBe('')
  })
})

describe('isConclusive', () => {
  it('is true at the test point that implicates the actual fault', () => {
    expect(isConclusive(s, 'tp-fuse')).toBe(true)
  })

  it('is false elsewhere', () => {
    expect(isConclusive(s, 'tp-cord')).toBe(false)
  })

  it('is false for an unknown test point', () => {
    expect(isConclusive(s, 'nope')).toBe(false)
  })
})

describe('requiredTests', () => {
  it('is the position of the last implicating test point in service order', () => {
    expect(requiredTests(s)).toBe(2)
  })
})

describe('scoreDiagnosis', () => {
  it('gives full marks for the right fault found with the minimum tests', () => {
    const r = scoreDiagnosis(s, ['tp-fuse'], 'fuse')
    expect(r.correct).toBe(true)
    expect(r.score).toBe(1)
    expect(r.remedy).toBe('Fit a fuse of the same rating.')
  })

  it('deducts only for tests beyond the service-order position', () => {
    expect(scoreDiagnosis(s, ['tp-cord', 'tp-fuse'], 'fuse').score).toBe(1)
    expect(scoreDiagnosis(s, ['tp-cord', 'tp-wind', 'tp-fuse'], 'fuse').score).toBeCloseTo(0.85, 5)
  })

  it('never drops a correct diagnosis below a floor', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    expect(scoreDiagnosis(s, many, 'fuse').score).toBe(0.4)
  })

  it('scores zero for the wrong fault, however few tests were used', () => {
    const r = scoreDiagnosis(s, ['tp-fuse'], 'cord')
    expect(r.correct).toBe(false)
    expect(r.score).toBe(0)
  })

  it('still names the correct remedy when the student got it wrong', () => {
    expect(scoreDiagnosis(s, [], 'cord').remedy).toBe('Fit a fuse of the same rating.')
  })

  it('does not throw for an unknown fault id', () => {
    expect(() => scoreDiagnosis(s, [], 'nonsense')).not.toThrow()
    expect(scoreDiagnosis(s, [], 'nonsense').correct).toBe(false)
  })
})
