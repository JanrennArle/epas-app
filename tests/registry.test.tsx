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

  // Tautological too, for the same reason: the derivation takes the shell
  // from the activity's own kind, so it cannot currently disagree. It was not
  // tautological two commits ago, when the pairing was written out by hand
  // and one of them was wrong.
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
  // lesson that embeds it, which is how seven of the eight fault scenarios
  // sat unreachable for a commit. Also tautological while LABS is derived,
  // and the one of these three worth keeping for it: it is the property that
  // made deriving the catalogue the right fix rather than a longer list.
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
   * answer in order and by omission identifies the part that is not in the
   * path. The match and hotspot blurbs had it too, in the same commit, each
   * listing its answers in item order; for a matching exercise that is the
   * complete key. A student reading the gallery scores without opening
   * anything.
   *
   * Checked for every format rather than the one it was found in, which is
   * the mistake the first version of this guard made. Answer ids are single
   * words, which is what makes this checkable, so the suite pins that too.
   */
  it('never names its own answers on the card that opens it', () => {
    for (const lab of LABS) {
      if (SHELLS[lab.simId] !== 'activity') continue
      const activity = ACTIVITIES[lab.config?.activity as string]
      if (!activity) continue
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

  /**
   * The same rule for the ten scenario cards, whose answer is a fault rather
   * than an ordering.
   *
   * The card carries the symptom, which is what a customer says and what a
   * technician is given, so it is the right copy for the card. What it must
   * not carry is the name of the fault: "the thermal fuse has opened" on the
   * card turns a diagnostic exercise into a reading exercise, and the scoring
   * engine's whole point is that the taught sweep outscores a lucky first
   * guess. Checked against the label of the fault that is actually present,
   * word by word, ignoring words the other faults on the same scenario also
   * use, since those cannot single one out.
   */
  it('never names the fault on the card that opens a scenario', () => {
    for (const lab of LABS) {
      if (SHELLS[lab.simId] !== 'scenario') continue
      const scenario = SCENARIOS[lab.config?.scenario as string]
      expect(scenario, lab.id).toBeDefined()
      if (!scenario) continue
      const actual = scenario.faults.find(f => f.id === scenario.actualFault)
      expect(actual, `${lab.id} names a fault that exists`).toBeDefined()
      if (!actual) continue

      const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      // Words the other faults use cannot single this one out, and neither
      // can the appliance's own name, which is on the card by design: every
      // fault on the list is a fault in that same appliance.
      const shared = new Set([
        ...scenario.faults.filter(f => f.id !== actual.id).flatMap(f => words(f.label)),
        ...words(scenario.appliance),
      ])
      const telling = words(actual.label).filter(w => !shared.has(w) && w.length > 3)
      const copy = new Set(words(`${lab.title} ${lab.blurb}`))
      const leaked = telling.filter(w => copy.has(w))
      expect(leaked, `${lab.id} names ${leaked.join(', ')} on its card`).toHaveLength(0)
    }
  })

  // The guard above finds an answer id in the card copy by splitting that
  // copy into single words. An id of two words, or one carrying a hyphen,
  // would be invisible to it and the guard would pass while the leak sat on
  // the screen.
  it('keeps every answer id to the single word the card guard can see', () => {
    for (const activity of Object.values(ACTIVITIES)) {
      for (const item of activity.items) {
        expect(item.answer, `${activity.id} ${item.id}`).toMatch(/^[a-z0-9]+$/)
      }
    }
  })
})
