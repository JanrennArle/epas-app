import { fireEvent, render, screen } from '@testing-library/react'
import { SystemTroubleshooter } from '../src/interactives/SystemTroubleshooter'
import { getSim, SIMS } from '../src/interactives/registry'
import { BlockRenderer } from '../src/ui/blocks/BlockRenderer'
import type { Block } from '../src/lib/types'
import { LABS, LAB_SIM_IDS } from '../src/routes/Labs'
import { ACTIVITIES } from '../src/content/activities'
import type { Activity } from '../src/lib/activity'

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

  it('points every card at a registered simulation', () => {
    for (const lab of LABS) {
      expect(Object.keys(SIMS), lab.id).toContain(lab.simId)
    }
  })

  // Three of the six simulations are shells that render "not available yet"
  // with no activity named, so a card that omits the config is a dead end
  // that nothing else in the app would notice. Both halves matter: the
  // activity has to exist, and it has to be the kind this shell can run.
  it('gives every activity shell an activity of its own kind', () => {
    const shells: Record<string, Activity['kind']> = {
      hotspot: 'hotspot', match: 'match', sequence: 'sequence',
    }
    for (const lab of LABS) {
      const wants = shells[lab.simId]
      if (!wants) continue
      const key = lab.config?.activity
      expect(typeof key, lab.id).toBe('string')
      const activity = ACTIVITIES[key as string]
      expect(activity, `${lab.id} names activity ${String(key)}`).toBeDefined()
      expect(activity?.kind, lab.id).toBe(wants)
    }
  })

  it('gives every card a unique id', () => {
    expect(new Set(LABS.map(l => l.id)).size).toBe(LABS.length)
  })
})
