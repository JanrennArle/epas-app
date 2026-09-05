import { waveform, REGULATOR_DROPOUT } from '../src/lib/signal'
import type { PsuConfig } from '../src/lib/signal'

const base: PsuConfig = {
  secondaryVrms: 15,
  rectifier: 'full',
  filterUf: 2200,
  loadMa: 500,
  regulatorV: 12,
  mains: 60,
}

const cfg = (over: Partial<PsuConfig> = {}): PsuConfig => ({ ...base, ...over })

describe('secondary', () => {
  it('peaks at the RMS value times root two', () => {
    const w = waveform('secondary', cfg())
    expect(w.vMax).toBeCloseTo(21.21, 1)
  })

  it('swings symmetrically about zero', () => {
    const w = waveform('secondary', cfg())
    expect(w.vMin).toBeCloseTo(-w.vMax, 1)
    expect(w.vDc).toBeCloseTo(0, 1)
  })
})

describe('rectified', () => {
  it('never goes negative', () => {
    const w = waveform('rectified', cfg())
    expect(w.vMin).toBeGreaterThanOrEqual(0)
  })

  it('loses two diode drops through a bridge', () => {
    const w = waveform('rectified', cfg({ rectifier: 'full' }))
    expect(w.vMax).toBeCloseTo(21.21 - 1.4, 1)
  })

  it('loses one diode drop through a half wave rectifier', () => {
    const w = waveform('rectified', cfg({ rectifier: 'half' }))
    expect(w.vMax).toBeCloseTo(21.21 - 0.7, 1)
  })
})

describe('filtered', () => {
  it('a large capacitor leaves little ripple', () => {
    const w = waveform('filtered', cfg({ filterUf: 4700 }))
    expect(w.ripple).toBeLessThan(1)
  })

  it('a small capacitor leaves large ripple', () => {
    const big = waveform('filtered', cfg({ filterUf: 4700 })).ripple
    const small = waveform('filtered', cfg({ filterUf: 100 })).ripple
    expect(small).toBeGreaterThan(big * 5)
  })

  it('a heavier load increases ripple', () => {
    const light = waveform('filtered', cfg({ loadMa: 100 })).ripple
    const heavy = waveform('filtered', cfg({ loadMa: 500 })).ripple
    expect(heavy).toBeGreaterThan(light)
  })

  it('half wave ripples twice as much as full wave, all else equal', () => {
    const full = waveform('filtered', cfg({ rectifier: 'full' })).ripple
    const half = waveform('filtered', cfg({ rectifier: 'half' })).ripple
    expect(half).toBeCloseTo(full * 2, 1)
  })

  it('with no capacitor fitted it is the rectified waveform', () => {
    const rect = waveform('rectified', cfg({ filterUf: 0 }))
    const filt = waveform('filtered', cfg({ filterUf: 0 }))
    expect(filt.vMax).toBeCloseTo(rect.vMax, 3)
    expect(filt.vMin).toBeCloseTo(rect.vMin, 3)
  })
})

describe('regulated', () => {
  it('holds flat at the regulator voltage when there is headroom', () => {
    const w = waveform('regulated', cfg({ filterUf: 4700 }))
    expect(w.vMax).toBeCloseTo(12, 2)
    expect(w.vMin).toBeCloseTo(12, 2)
    expect(w.ripple).toBeLessThan(0.01)
  })

  it('sags when the ripple trough falls below dropout', () => {
    const w = waveform('regulated', cfg({ filterUf: 100 }))
    expect(w.vMin).toBeLessThan(12)
    expect(w.ripple).toBeGreaterThan(0.5)
  })

  it('never exceeds the regulator voltage', () => {
    const w = waveform('regulated', cfg({ secondaryVrms: 30 }))
    expect(w.vMax).toBeLessThanOrEqual(12.001)
  })

  it('cannot output more than its input less the dropout', () => {
    const w = waveform('regulated', cfg({ secondaryVrms: 9, filterUf: 4700 }))
    const filt = waveform('filtered', cfg({ secondaryVrms: 9, filterUf: 4700 }))
    expect(w.vMax).toBeLessThanOrEqual(filt.vMax - REGULATOR_DROPOUT + 0.001)
  })
})

describe('shape and totality', () => {
  it('returns the requested number of samples', () => {
    expect(waveform('secondary', cfg(), 120).points).toHaveLength(120)
  })

  it('does not throw on absurd input', () => {
    const wild = cfg({ secondaryVrms: 0, filterUf: 0, loadMa: 0, mains: 0, regulatorV: 0 })
    expect(() => waveform('regulated', wild)).not.toThrow()
    expect(Number.isFinite(waveform('regulated', wild).vDc)).toBe(true)
  })
})
