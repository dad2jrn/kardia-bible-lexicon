import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ValidatorResult } from '@/types'
import { ValidatorPanel } from './ValidatorPanel'

const validator: ValidatorResult = {
  overall: 'minor-flags',
  summary: 'Needs work',
  flags: [
    {
      flag_number: 1,
      point: '1',
      severity: 'major',
      location: 'Definition',
      issue: 'Issue 1',
      correction: 'Fix 1',
    },
    {
      flag_number: 2,
      point: '2',
      severity: 'minor',
      location: 'Notes',
      issue: 'Issue 2',
      correction: 'Fix 2',
    },
  ],
}

describe('ValidatorPanel', () => {
  it('selects all flags and triggers corrections handler', () => {
    const handler = vi.fn()
    render(
      <ValidatorPanel
        validator={validator}
        onRequestCorrections={handler}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /select all flags/i }))
    expect(screen.getByText(/Queued corrections: 2/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /regenerate with corrections/i }))
    expect(handler).toHaveBeenCalledWith([1, 2])
  })
})

