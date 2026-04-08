import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { CategoryGrid } from './CategoryGrid'

const GROUPS = {
  'Group One': ['Alpha', 'Beta'],
  'Group Two': ['Gamma'],
}

describe('CategoryGrid', () => {
  it('renders all groups and buttons', () => {
    render(<CategoryGrid groups={GROUPS} />)
    expect(screen.getByText('Group One')).toBeInTheDocument()
    expect(screen.getByText('Group Two')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /alpha/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gamma/i })).toBeInTheDocument()
  })

  it('marks the selected category', () => {
    render(<CategoryGrid groups={GROUPS} selectedId="alpha" />)
    expect(screen.getByRole('button', { name: /alpha/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /beta/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('displays completed indicator and fires onSelect', () => {
    const handleSelect = vi.fn()
    render(
      <CategoryGrid
        groups={GROUPS}
        completedIds={['beta']}
        onSelect={handleSelect}
      />,
    )
    const betaButton = screen.getByRole('button', { name: /beta/i })
    const icon = within(betaButton).getByLabelText(/completed/i)
    expect(icon).toBeInTheDocument()

    fireEvent.click(betaButton)
    expect(handleSelect).toHaveBeenCalledWith({ id: 'beta', label: 'Beta', group: 'Group One' })
  })
})
