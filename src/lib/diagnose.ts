export interface Fault {
  id: string
  label: string
  /** What the student does about it once it is identified. */
  remedy: string
}

export interface TestPoint {
  id: string
  label: string
  /** What the student physically does, in the imperative. */
  action: string
  /**
   * Reading keyed by fault id. The key '*' is the reading when the fault
   * present in this scenario is not one this test point exposes.
   */
  readings: Record<string, string>
  /** Fault ids this test point conclusively implicates. */
  implicates: string[]
}

export interface Scenario {
  id: string
  appliance: string
  symptom: string
  /** Steps that must be acknowledged before any test is allowed. */
  safety: string[]
  faults: Fault[]
  /** The fault actually present. */
  actualFault: string
  testPoints: TestPoint[]
}

/** Each test beyond the minimum costs this much. */
const PENALTY = 0.15
/** A correct diagnosis never scores below this, however long it took. */
const FLOOR = 0.4

function point(s: Scenario, id: string): TestPoint | undefined {
  return s.testPoints.find(t => t.id === id)
}

export function readingAt(s: Scenario, testPointId: string): string {
  const tp = point(s, testPointId)
  if (!tp) return ''
  return tp.readings[s.actualFault] ?? tp.readings['*'] ?? ''
}

export function isConclusive(s: Scenario, testPointId: string): boolean {
  const tp = point(s, testPointId)
  if (!tp) return false
  return tp.implicates.includes(s.actualFault)
}

export function requiredTests(s: Scenario): number {
  const n = s.testPoints.filter(t => t.implicates.includes(s.actualFault)).length
  return Math.max(1, n)
}

export function scoreDiagnosis(
  s: Scenario,
  testsUsed: string[],
  faultId: string,
): { correct: boolean; score: number; remedy: string } {
  const actual = s.faults.find(f => f.id === s.actualFault)
  const remedy = actual?.remedy ?? ''
  const correct = faultId === s.actualFault
  if (!correct) return { correct: false, score: 0, remedy }
  const extra = Math.max(0, testsUsed.length - requiredTests(s))
  const score = Math.max(FLOOR, 1 - PENALTY * extra)
  return { correct: true, score, remedy }
}
