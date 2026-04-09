import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from './Header'

describe('Header component', () => {
  it('shows connected state styling and routes clicks to drawer', () => {
    const onToggleDrawer = vi.fn()
    render(
      <Header
        isConnected
        activeProvider="anthropic"
        statusLabel="Anthropic — Connected"
        statusTone="success"
        onToggleDrawer={onToggleDrawer}
        onRequestApiKeyModal={vi.fn()}
      />,
    )

    const pill = screen.getByRole('button', { name: /anthropic — connected/i })
    expect(pill).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(pill)
    expect(onToggleDrawer).toHaveBeenCalled()
  })

  it('routes clicks to the correct handlers when disconnected', () => {
    const onToggleDrawer = vi.fn()
    const onRequestModal = vi.fn()
    render(
      <Header
        isConnected={false}
        activeProvider="openai"
        statusLabel="Not Connected"
        statusTone="warning"
        onToggleDrawer={onToggleDrawer}
        onRequestApiKeyModal={onRequestModal}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /not connected/i }))
    expect(onRequestModal).toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText(/open api settings drawer/i))
    expect(onToggleDrawer).toHaveBeenCalled()
  })
})
