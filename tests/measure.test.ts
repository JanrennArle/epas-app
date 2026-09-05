import { measure, withinTolerance } from '../src/lib/measure'
import type { TestComponent } from '../src/lib/measure'

const r = (fault: TestComponent['fault'] = 'ok'): TestComponent =>
  ({ id: 'R1', kind: 'resistor', label: '4.7 kOhm 5%', nominal: 4700, tolerance: 0.05, fault })

const fuse = (fault: TestComponent['fault'] = 'ok'): TestComponent =>
  ({ id: 'F1', kind: 'fuse', label: '2 A', nominal: 0.2, tolerance: 0.5, fault })

const diode = (fault: TestComponent['fault'] = 'ok'): TestComponent =>
  ({ id: 'D1', kind: 'diode', label: '1N4007', nominal: 0.62, tolerance: 0.1, fault })

describe('measure in ohms mode', () => {
  it('reads a healthy resistor near its nominal value', () => {
    const out = measure(r(), 'ohms')
    expect(out.overload).toBe(false)
    expect(out.display).toMatch(/^4\.\d{2} k$/)
  })

  it('reads overload for an open resistor', () => {
    expect(measure(r('open'), 'ohms').overload).toBe(true)
  })

  it('reads near zero for a shorted resistor', () => {
    expect(measure(r('short'), 'ohms').display).toBe('0.00')
  })

  it('reads outside tolerance for a drifted resistor', () => {
    const out = measure(r('drift'), 'ohms')
    const value = parseFloat(out.display) * 1000
    expect(withinTolerance(r(), value)).toBe(false)
  })
})

describe('measure in continuity mode', () => {
  it('beeps on a healthy fuse', () => {
    expect(measure(fuse(), 'continuity').beep).toBe(true)
  })

  it('does not beep on a blown fuse', () => {
    const out = measure(fuse('open'), 'continuity')
    expect(out.beep).toBe(false)
    expect(out.overload).toBe(true)
  })
})

describe('measure in diode mode', () => {
  it('shows a forward drop on a healthy diode', () => {
    expect(measure(diode(), 'diode').display).toBe('0.62')
  })

  it('shows overload on an open diode', () => {
    expect(measure(diode('open'), 'diode').overload).toBe(true)
  })

  it('shows near zero on a shorted diode', () => {
    expect(measure(diode('short'), 'diode').display).toBe('0.00')
  })
})

describe('wrong mode for the component', () => {
  it('reads overload when testing a resistor in diode mode', () => {
    expect(measure(r(), 'diode').overload).toBe(true)
  })
})

describe('withinTolerance', () => {
  it('accepts a value inside the band', () => {
    expect(withinTolerance(r(), 4610)).toBe(true)
  })
  it('rejects a value outside the band', () => {
    expect(withinTolerance(r(), 4000)).toBe(false)
  })
  it('accepts a value exactly on the boundary', () => {
    expect(withinTolerance(r(), 4465)).toBe(true)
  })
})
