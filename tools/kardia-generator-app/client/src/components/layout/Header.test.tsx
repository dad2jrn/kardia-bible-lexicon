import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from './Header'

describe('Header component', () => {
  it('shows connected state styling', () => {
    render(
      <Header
        isConnected
        statusLabel="API Connected"
        statusTone="success"
        onToggleDrawer={vi.fn()}
        onRequestApiKeyModal={vi.fn()}
      />,
    )

    const pill = screen.getByRole('button', { name: /api connected/i })
    expect(pill).toHaveAttribute('aria-pressed', 'true')
    expect(pill.className).toContain('bg-emerald-50')
  })

  it('routes clicks to the correct handlers when disconnected', () => {
    const onToggleDrawer = vi.fn()
    const onRequestModal = vi.fn()
    render(
      <Header
        isConnected={false}
        statusLabel="Connect API key"
        statusTone="warning"
        onToggleDrawer={onToggleDrawer}
        onRequestApiKeyModal={onRequestModal}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /connect api key/i }))
    expect(onRequestModal).toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText(/open api settings drawer/i))
    expect(onToggleDrawer).toHaveBeenCalled()
  })
})
