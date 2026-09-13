/**
 * Whether a service worker update may be offered on this route.
 *
 * The spec's promise is that the service worker "prompts to update rather
 * than reloading, so it never interrupts a quiz in progress". The worker
 * cannot know what a student is doing, so the app decides, and the decision
 * is a pure function because that is the only form of it a test can hold.
 *
 * Suppressing is not dropping. `UpdatePrompt` keeps the pending update and
 * offers it once the student is somewhere it costs nothing, so a student who
 * sits three tests in a row still gets the new version afterwards.
 *
 * The list is short on purpose. `Quiz.tsx`, rendered inside
 * `/m/:moduleId/lo/:outcomeId`, also holds an unsubmitted answer in React
 * state and is left unsuppressed anyway: a lost formative attempt costs the
 * student nothing they cannot immediately redo, and formative items are
 * excluded from the learning gain, so it is not research data.
 * `/m/:moduleId/test/:phase` is the one route where losing the state is both
 * a redo the student cannot honestly repeat and a hole in the research
 * record: `Assessment.tsx` keeps the whole sitting in React state until
 * submit, and a student who has seen the pre-test items cannot sit it again
 * honestly.
 */
const SILENT = [
  /^\/m\/[^/]+\/test\/[^/]+\/?$/,
  /^\/consent\/?$/,
]

export function mayPrompt(pathname: string): boolean {
  return !SILENT.some(re => re.test(pathname))
}
