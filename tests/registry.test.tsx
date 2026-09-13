import { fireEvent, render, screen } from '@testing-library/react'
import { SystemTroubleshooter } from '../src/interactives/SystemTroubleshooter'
import { getSim, SIMS } from '../src/interactives/registry'
import { BlockRenderer } from '../src/ui/blocks/BlockRenderer'
import type { Block } from '../src/lib/types'
import { LABS, LAB_SIM_IDS, SHELLS, STANDALONE } from '../src/content/labs'
import { ACTIVITIES } from '../src/content/activities'
import { SCENARIOS } from '../src/content/scenarios'

describe('sim registry', () => {
  it('resolves a registered sim', () => {
    expect(getSim('multimeter')).toBe(SIMS.multimeter)
  })

  it('returns undefined for an unknown sim', () => {
    expect(getSim('nope')).toBeUndefined()
  })

  it('renders a registered sim through the block renderer', () => {
    const blocks: Block[] = [{ kind: 'interactive', simId: 'multimeter' }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getByLabelText('Multimeter Trainer')).toBeInTheDocument()
  })

  it('tells the student plainly when a sim is not registered', () => {
    const blocks: Block[] = [{ kind: 'interactive', simId: 'not-built' }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getByText('This activity is not available yet.')).toBeInTheDocument()
  })
})

describe('naming a fault requires evidence', () => {
  beforeEach(() => localStorage.clear())

  // The safety lines render as checkboxes and all of them must be ticked
  // before any control in the exercise becomes live.
  function ackAllSafety() {
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box)
  }

  it('leaves the fault buttons disabled until a test has been run', () => {
    render(<SystemTroubleshooter moduleId="m3" config={{ scenario: 'fan' }} />)
    ackAllSafety()
    expect(screen.getByRole('button', { name: 'Failed run capacitor' })).toBeDisabled()
  })

  it('enables them once one test point has been used', () => {
    render(<SystemTroubleshooter moduleId="m3" config={{ scenario: 'fan' }} />)
    ackAllSafety()
    fireEvent.click(screen.getByRole('button', { name: /^Supply cord\./ }))
    expect(screen.getByRole('button', { name: 'Failed run capacitor' })).toBeEnabled()
  })

  it('says why the fault buttons are inert', () => {
    render(<SystemTroubleshooter moduleId="m3" config={{ scenario: 'fan' }} />)
    ackAllSafety()
    expect(screen.getByText(/Run at least one test first/)).toBeInTheDocument()
  })
})

describe('the labs gallery', () => {
  // A simulation added to the registry and left out of the gallery is
  // unreachable on its own, which is how it would ship.
  it('reaches every registered simulation', () => {
    for (const simId of Object.keys(SIMS)) {
      expect(LAB_SIM_IDS, simId).toContain(simId)
    }
  })

  // Tautological while LABS is derived from the two exercise registries, and
  // kept because that is not a property of the app, it is a property of one
  // file. The gallery was a hand-written list of simIds a commit ago, and a
  // future card added by hand lands on these.
  it('points every card at a registered simulation', () => {
    for (const lab of LABS) {
      expect(Object.keys(SIMS), lab.id).toContain(lab.simId)
    }
  })

  // Four of the six simulations are shells that render "not available yet"
  // when no exercise is named, so a card without the right config is a dead
  // end nothing else in the app would notice. The table of shells is the part
  // that rots: a fifth shell added later and left out of it would bring the
  // dead card straight back, so every registered sim must be classified here
  // before this suite will pass.
  it('classifies every registered simulation as a shell or not', () => {
    // Read from the catalogue rather than restated here. A list of
    // standalone sims written out in the test could be quietly widened to
    // make this pass, which is the failure mode it exists to prevent.
    const standalone = STANDALONE.map(l => l.simId)
    for (const simId of Object.keys(SIMS)) {
      expect(simId in SHELLS || standalone.includes(simId), simId).toBe(true)
    }
    for (const simId of Object.keys(SHELLS)) {
      expect(Object.keys(SIMS), simId).toContain(simId)
    }
  })

  it('names an exercise on every card that opens a shell', () => {
    for (const lab of LABS) {
      const needs = SHELLS[lab.simId]
      if (!needs) continue
      const key = lab.config?.[needs]
      expect(typeof key, `${lab.id} names a ${needs}`).toBe('string')
      const exists = needs === 'activity'
        ? ACTIVITIES[key as string] !== undefined
        : SCENARIOS[key as string] !== undefined
      expect(exists, `${lab.id} names ${needs} ${String(key)}`).toBe(true)
    }
  })

  it('opens an activity through the shell that can run its kind', () => {
    for (const lab of LABS) {
      if (SHELLS[lab.simId] !== 'activity') continue
      const activity = ACTIVITIES[lab.config?.activity as string]
      expect(activity?.kind, lab.id).toBe(lab.simId)
    }
  })

  // The unit of meaning here is the exercise, not the simulation, so the
  // completeness guard has to count exercises. An activity or a scenario
  // authored and left out of the gallery is reachable only from the one
  // lesson that embeds it.
  it('carries a card for every activity and every scenario', () => {
    const ids = new Set(LABS.map(l => l.id))
    for (const id of Object.keys(ACTIVITIES)) expect(ids, id).toContain(id)
    for (const id of Object.keys(SCENARIOS)) expect(ids, id).toContain(`fault-${id}`)
  })

  // A card falling back to its id for a title is how a bare simId shipped on
  // a card the first time.
  it('gives every card a title that is not its own id', () => {
    for (const lab of LABS) {
      expect(lab.title, lab.id).not.toBe(lab.id)
      expect(lab.blurb.length, lab.id).toBeGreaterThan(0)
    }
  })

  it('gives every card a unique id', () => {
    expect(new Set(LABS.map(l => l.id)).size).toBe(LABS.length)
  })

  // Two scenarios on the same appliance would produce two cards reading the
  // same thing, which is the defect the module overview tiles had.
  it('gives every card a distinct title', () => {
    expect(new Set(LABS.map(l => l.title)).size).toBe(LABS.length)
  })

  /**
   * A card must not answer its own exercise.
   *
   * The first version of the sequence blurbs read "Put microphone, mixer,
   * amplifier and speaker into the order the sound travels", which is the
   * answer in order, and by omission identifies the part that is not in the
   * path. A student reading the gallery scores the exercise without opening
   * it. Answer ids are single words, which is what makes this checkable: one
   * of them in the copy is a subject, two is a sequence.
   */
  it('never names an ordered answer on the card that opens it', () => {
    for (const lab of LABS) {
      if (SHELLS[lab.simId] !== 'activity') continue
      const activity = ACTIVITIES[lab.config?.activity as string]
      if (activity?.kind !== 'sequence') continue
      // Split into words rather than matched with a regex. The first version
      // of this built the pattern in a template literal, where the escape for
      // a word boundary is one backslash too few and silently becomes the
      // backspace character, so it matched nothing and passed against the
      // leaking copy it was written to catch.
      const words = new Set(`${lab.title} ${lab.blurb}`.toLowerCase().split(/[^a-z0-9]+/))
      const named = activity.items
        .map(i => i.answer.toLowerCase())
        .filter(answer => words.has(answer))
      expect(named.length, `${lab.id} names ${named.join(', ')} on its card`).toBeLessThan(2)
    }
  })
})
