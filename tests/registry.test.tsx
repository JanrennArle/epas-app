import { render, screen } from '@testing-library/react'
import { getSim, SIMS } from '../src/interactives/registry'
import { BlockRenderer } from '../src/ui/blocks/BlockRenderer'
import type { Block } from '../src/lib/types'

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
