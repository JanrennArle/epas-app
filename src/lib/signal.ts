export type PsuStage = 'secondary' | 'rectified' | 'filtered' | 'regulated'
export type RectifierKind = 'half' | 'full'

export interface PsuConfig {
  /** RMS volts on the transformer secondary. */
  secondaryVrms: number
  rectifier: RectifierKind
  /** Filter capacitance in microfarads. Zero means no capacitor fitted. */
  filterUf: number
  /** Load current in milliamps. */
  loadMa: number
  /** Regulator output volts, for example 12 for a 7812. */
  regulatorV: number
  /** Mains frequency in hertz. 60 in the Philippines. */
  mains: number
}

export interface Waveform {
  /** Volts, evenly spaced across `cycles` mains cycles. */
  points: number[]
  vMax: number
  vMin: number
  /** Mean value, which is what a DC meter reads. */
  vDc: number
  /** Peak to peak ripple. */
  ripple: number
}

/** A 78xx series regulator needs roughly two volts of headroom. */
export const REGULATOR_DROPOUT = 2

const DIODE_DROP = { half: 0.7, full: 1.4 } as const

function safe(n: number, fallback = 0): number {
  return Number.isFinite(n) ? n : fallback
}

function summarise(points: number[]): Waveform {
  if (points.length === 0) {
    return { points, vMax: 0, vMin: 0, vDc: 0, ripple: 0 }
  }
  let vMax = points[0]!
  let vMin = points[0]!
  let sum = 0
  for (const p of points) {
    if (p > vMax) vMax = p
    if (p < vMin) vMin = p
    sum += p
  }
  return { points, vMax, vMin, vDc: sum / points.length, ripple: vMax - vMin }
}

/** Peak volts on the secondary, before any rectifier loss. */
function secondaryPeak(cfg: PsuConfig): number {
  return safe(cfg.secondaryVrms) * Math.SQRT2
}

/** Peak volts after the rectifier. */
function rectifiedPeak(cfg: PsuConfig): number {
  return Math.max(0, secondaryPeak(cfg) - DIODE_DROP[cfg.rectifier])
}

/** Ripple frequency. A bridge charges the capacitor twice per mains cycle. */
function rippleHz(cfg: PsuConfig): number {
  return safe(cfg.mains) * (cfg.rectifier === 'full' ? 2 : 1)
}

/**
 * Peak to peak ripple across the filter capacitor, from the standard
 * approximation Vpp = I / (f * C). With no capacitor fitted the output
 * swings the full rectified waveform.
 */
function rippleVolts(cfg: PsuConfig): number {
  const peak = rectifiedPeak(cfg)
  if (cfg.filterUf <= 0) return peak
  const f = rippleHz(cfg)
  if (f <= 0) return peak
  const i = safe(cfg.loadMa) / 1000
  const c = cfg.filterUf / 1e6
  return Math.min(peak, safe(i / (f * c), peak))
}

function sampleSecondary(cfg: PsuConfig, t: number): number {
  return secondaryPeak(cfg) * Math.sin(2 * Math.PI * safe(cfg.mains) * t)
}

function sampleRectified(cfg: PsuConfig, t: number): number {
  const raw = sampleSecondary(cfg, t)
  const drop = DIODE_DROP[cfg.rectifier]
  const conducting = cfg.rectifier === 'full' ? Math.abs(raw) : Math.max(0, raw)
  return Math.max(0, conducting - drop)
}

function sampleFiltered(cfg: PsuConfig, t: number): number {
  if (cfg.filterUf <= 0) return sampleRectified(cfg, t)
  const f = rippleHz(cfg)
  if (f <= 0) return rectifiedPeak(cfg)
  // The capacitor charges to the peak, then droops roughly linearly until
  // the next peak arrives. A sawtooth is the honest simple picture.
  const phase = (t * f) % 1
  return rectifiedPeak(cfg) - rippleVolts(cfg) * phase
}

function sampleRegulated(cfg: PsuConfig, t: number): number {
  const headroom = sampleFiltered(cfg, t) - REGULATOR_DROPOUT
  return Math.max(0, Math.min(safe(cfg.regulatorV), headroom))
}

const SAMPLERS: Record<PsuStage, (cfg: PsuConfig, t: number) => number> = {
  secondary: sampleSecondary,
  rectified: sampleRectified,
  filtered: sampleFiltered,
  regulated: sampleRegulated,
}

export function waveform(
  stage: PsuStage,
  cfg: PsuConfig,
  samples = 240,
  cycles = 2,
): Waveform {
  const n = Math.max(1, Math.floor(samples))
  const hz = safe(cfg.mains)
  const span = hz > 0 ? cycles / hz : 1
  const sampler = SAMPLERS[stage]
  const points: number[] = []
  for (let i = 0; i < n; i++) {
    points.push(safe(sampler(cfg, (i / n) * span)))
  }
  return summarise(points)
}
