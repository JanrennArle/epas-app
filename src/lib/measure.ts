export type ComponentKind = 'resistor' | 'capacitor' | 'diode' | 'led' | 'fuse'
export type FaultMode = 'ok' | 'open' | 'short' | 'drift'
export type MeterMode = 'ohms' | 'continuity' | 'diode' | 'dcv'

export interface TestComponent {
  id: string
  kind: ComponentKind
  label: string
  /** Ohms for resistive parts, forward volts for junctions. */
  nominal: number
  /** Fraction, so 0.05 is five percent. */
  tolerance: number
  fault: FaultMode
}

export interface Reading {
  display: string
  overload: boolean
  beep: boolean
}

const OL: Reading = { display: 'OL', overload: true, beep: false }
const SHORT: Reading = { display: '0.00', overload: false, beep: true }

/**
 * A real meter reads a little off nominal even on a good part. A fixed
 * offset keeps the engine deterministic so tests stay stable, while still
 * teaching students that a reading rarely lands exactly on the marked value.
 */
const GOOD_OFFSET = -0.019
const DRIFT_OFFSET = 0.23

function formatOhms(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} k`
  return value.toFixed(2)
}

function resistanceOf(c: TestComponent): number | null {
  switch (c.fault) {
    case 'open': return null
    case 'short': return 0
    case 'drift': return c.nominal * (1 + DRIFT_OFFSET)
    case 'ok': return c.nominal * (1 + GOOD_OFFSET)
  }
}

export function withinTolerance(c: TestComponent, measured: number): boolean {
  const band = c.nominal * c.tolerance
  return measured >= c.nominal - band && measured <= c.nominal + band
}

export function measure(c: TestComponent, mode: MeterMode): Reading {
  const resistive = c.kind === 'resistor' || c.kind === 'fuse'
  const junction = c.kind === 'diode' || c.kind === 'led'

  switch (mode) {
    case 'ohms': {
      if (junction || c.kind === 'capacitor') return OL
      const value = resistanceOf(c)
      if (value === null) return OL
      if (value === 0) return SHORT
      return { display: formatOhms(value), overload: false, beep: false }
    }

    case 'continuity': {
      if (!resistive) return OL
      const value = resistanceOf(c)
      if (value === null) return OL
      // Meters beep below roughly 50 ohms.
      const beep = value < 50
      return { display: formatOhms(value), overload: false, beep }
    }

    case 'diode': {
      if (!junction) return OL
      if (c.fault === 'open') return OL
      if (c.fault === 'short') return SHORT
      const drop = c.fault === 'drift' ? c.nominal * (1 + DRIFT_OFFSET) : c.nominal
      return { display: drop.toFixed(2), overload: false, beep: false }
    }

    case 'dcv':
      // Out of circuit there is no potential across an isolated component.
      return { display: '0.00', overload: false, beep: false }
  }
}
