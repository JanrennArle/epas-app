import type { StoreV1 } from './store'

/** One export file a teacher has loaded, after it parsed successfully. */
export interface LoadedFile {
  file: string
  code: string
  state: StoreV1
  /** Absent on a file written before the consent choice existed. */
  research: boolean | undefined
  exportedAt: string
}

/** Every file handed in under one participant code, and what to do with it. */
export interface StudentGroup {
  code: string
  files: LoadedFile[]
  /** Every file for this student says they agreed to take part. */
  agreed: boolean
  /** Files for this student disagree about taking part. */
  conflicted: boolean
  /** The file to report from: the most recently exported of the group. */
  newest: LoadedFile
}

/**
 * Decides consent per student rather than per file.
 *
 * A student can return to the consent screen and change their answer while
 * keeping the same participant code, so two files under one code can disagree.
 * Any disagreement excludes them. Resolving it by taking the newer file would
 * be inferring consent from a timestamp, and the promise the consent screen
 * makes is that nothing of theirs is included; a teacher who wants that
 * student in the study can ask them for one clean file.
 *
 * Where the files agree, the most recently exported one is reported, because a
 * later export of the same consented work is simply more complete.
 */
export function groupByStudent(loaded: LoadedFile[]): StudentGroup[] {
  const byCode = new Map<string, LoadedFile[]>()
  for (const l of loaded) byCode.set(l.code, [...(byCode.get(l.code) ?? []), l])

  return [...byCode.entries()].map(([code, files]) => {
    const answers = new Set(files.map(f => f.research === true))
    let newest = files[0]!
    // `>=` so that among files sharing a timestamp the last loaded wins,
    // matching how the store resolves a tie between two sittings.
    for (const f of files) if (f.exportedAt >= newest.exportedAt) newest = f
    return {
      code,
      files,
      agreed: files.every(f => f.research === true),
      conflicted: answers.size > 1,
      newest,
    }
  })
}

/** The students whose work belongs in the merged table. */
export function includedStudents(groups: StudentGroup[]): StudentGroup[] {
  return groups.filter(g => g.agreed && !g.conflicted)
}

/** The students deliberately left out, which the teacher is shown. */
export function excludedStudents(groups: StudentGroup[]): StudentGroup[] {
  return groups.filter(g => !g.agreed || g.conflicted)
}

/**
 * Why one student was left out, phrased to follow their participant code in a
 * sentence. Never returns an empty string: a bullet with no reason reads as a
 * bug rather than as a decision.
 */
export function whyLeftOut(g: StudentGroup): string {
  if (g.conflicted) {
    return 'handed in files that disagree about taking part, so nothing of theirs is included until you have one file from them'
  }
  if (g.files.every(f => f.research === false)) {
    return 'chose not to take part in the study'
  }
  return 'handed in a file that predates the consent choice, which is not treated as agreement'
}
