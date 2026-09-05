import { render, screen } from '@testing-library/react'
import { BlockRenderer } from '../src/ui/blocks/BlockRenderer'
import type { Block } from '../src/lib/types'

describe('BlockRenderer', () => {
  it('announces a safety block to assistive technology', () => {
    const blocks: Block[] = [{ kind: 'safety', md: 'Unplug the appliance first.' }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Unplug the appliance first.')
  })

  it('renders table headers and rows', () => {
    const blocks: Block[] = [{ kind: 'table', headers: ['Mode', 'Use'], rows: [['Ohms', 'Resistors']] }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getByText('Mode')).toBeInTheDocument()
    expect(screen.getByText('Resistors')).toBeInTheDocument()
  })

  it('renders ordered steps as a list', () => {
    const blocks: Block[] = [{ kind: 'steps', items: ['First', 'Second'] }]
    render(<BlockRenderer blocks={blocks} moduleId="m1" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
