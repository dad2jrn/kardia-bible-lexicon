import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  it('queues flag fixes and manual notes into the submission payload', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    render(
      <ValidatorPanel
        validator={validator}
        isBusy={false}
        onRequestCorrections={handler}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select all flags/i }))
    fireEvent.change(screen.getByPlaceholderText(/Describe the corrections/i), {
      target: { value: 'Tighten the gloss framing.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /regenerate with corrections/i }))

    await waitFor(() => expect(handler).toHaveBeenCalled())
    const payload = handler.mock.calls[0][0]
    expect(payload.queuedFlagCount).toBe(2)
    expect(payload.autoCorrections).toContain('Flag 1')
    expect(payload.manualNotes).toBe('Tighten the gloss framing.')
    expect(payload.combinedCorrections).toContain('---')
  })

  it('disables submission while busy', () => {
    render(
      <ValidatorPanel
        validator={validator}
        isBusy
        onRequestCorrections={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /regenerate with corrections/i })).toBeDisabled()
  })
})
