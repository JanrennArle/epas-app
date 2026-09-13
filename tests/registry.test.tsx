import { fireEvent, render, screen } from '@testing-library/react'
import { SystemTroubleshooter } from '../src/interactives/SystemTroubleshooter'
import { getSim, SIMS } from '../src/interactives/registry'
import { BlockRenderer } from '../src/ui/blocks/BlockRenderer'
import type { Block } from '../src/lib/types'
import { ABOUT_KEYS } from '../src/routes/Labs'

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
  // A simulation added to the registry and not to the gallery would appear as
  // a bare simId on a card, which is how it would ship.
  it('describes every registered simulation', () => {
    for (const simId of Object.keys(SIMS)) {
      expect(ABOUT_KEYS, simId).toContain(simId)
    }
  })
})
