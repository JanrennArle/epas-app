import { describe, expect, it } from 'vitest'
import { mayPrompt } from '../src/lib/updates'

describe('when an update may be offered', () => {
  // The one screen that loses work on reload. Answers live in React state
  // until submit, and a student who has seen the pre-test items cannot sit
  // it again honestly.
  it('never on a test in progress', () => {
    expect(mayPrompt('/m/m1/test/pre')).toBe(false)
    expect(mayPrompt('/m/m9/test/post')).toBe(false)
  })

  it('on the ordinary screens', () => {
    expect(mayPrompt('/')).toBe(true)
    expect(mayPrompt('/m/m4')).toBe(true)
    expect(mayPrompt('/m/m4/lo/lo2')).toBe(true)
    expect(mayPrompt('/labs')).toBe(true)
    expect(mayPrompt('/labs/fault-fan')).toBe(true)
    expect(mayPrompt('/tasks/t3')).toBe(true)
    expect(mayPrompt('/progress')).toBe(true)
    expect(mayPrompt('/evaluate')).toBe(true)
    expect(mayPrompt('/teacher')).toBe(true)
  })

  // Reloading here would drop a student into the app without a decision
  // recorded, and the gate would send them straight back. Harmless, but the
  // consent screen is the first thing they see and it should not flicker.
  it('never on the consent screen', () => {
    expect(mayPrompt('/consent')).toBe(false)
  })

  // A trailing slash is a different string and the same screen.
  it('is not fooled by a trailing slash', () => {
    expect(mayPrompt('/m/m1/test/pre/')).toBe(false)
    expect(mayPrompt('/consent/')).toBe(false)
  })

  // Matching on "contains /test/" would suppress the prompt on a lesson
  // about testing, and matching on the prefix alone would suppress it on
  // every module screen.
  it('matches the route rather than the words in it', () => {
    expect(mayPrompt('/m/m1/lo/lo3-testing')).toBe(true)
    expect(mayPrompt('/tasks/t1-test')).toBe(true)
  })

  it('allows an unknown route rather than blocking forever', () => {
    expect(mayPrompt('/nothing-here')).toBe(true)
  })
})
