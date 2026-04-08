import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RecoveryPanel } from './RecoveryPanel'

describe('RecoveryPanel', () => {
  it('renders warning and triggers retry', () => {
    const onRetry = vi.fn()
    const writeText = vi.fn().mockResolvedValue(undefined)
    ;(navigator as unknown as { clipboard: { writeText: typeof writeText } }).clipboard = {
      writeText,
    }
    render(
      <RecoveryPanel
        rawText="RAW"
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText(/JSON parsing failed/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /copy raw/i }))
    expect(writeText).toHaveBeenCalledWith('RAW')
    fireEvent.click(screen.getByRole('button', { name: /retry last run/i }))
    expect(onRetry).toHaveBeenCalled()
  })
})

