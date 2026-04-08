import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { GeneratorStatus } from '@/hooks/useGenerator'
import { GeneratePanel } from './GeneratePanel'

const baseStatus: GeneratorStatus = {
  step: 'idle',
  label: 'Ready',
  helperText: 'helper',
  tone: 'muted',
}

describe('GeneratePanel', () => {
  it('disables the button when prerequisites are missing', () => {
    const onGenerate = vi.fn()
    render(
      <GeneratePanel
        selectedCategory={null}
        selectedModelLabel="Sonnet"
        isConnected={false}
        status={baseStatus}
        iteration={0}
        isBusy={false}
        onGenerate={onGenerate}
        onAbort={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled()
  })

  it('shows cancel button while busy', () => {
    render(
      <GeneratePanel
        selectedCategory={{ id: 'test', label: 'Test', group: 'G' }}
        selectedModelLabel="Sonnet"
        isConnected
        status={{ ...baseStatus, step: 'generating', tone: 'info' }}
        iteration={2}
        isBusy
        onGenerate={vi.fn()}
        onAbort={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /cancel/i })).toBeVisible()
    expect(screen.getByText(/pass #2/i)).toBeInTheDocument()
  })

  it('calls retry handler when error banner button clicked', () => {
    const onRetry = vi.fn()
    render(
      <GeneratePanel
        selectedCategory={{ id: 'test', label: 'Test', group: 'G' }}
        selectedModelLabel="Sonnet"
        isConnected
        status={{ ...baseStatus, step: 'error', tone: 'error', label: 'Error', helperText: 'boom' }}
        iteration={0}
        isBusy={false}
        error="boom"
        onGenerate={vi.fn()}
        onAbort={vi.fn()}
        onRetry={onRetry}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /retry last parameters/i }))
    expect(onRetry).toHaveBeenCalled()
  })
})

