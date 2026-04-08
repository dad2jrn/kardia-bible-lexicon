// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { SettingsDrawer } from './SettingsDrawer'

const baseProps = {
  open: true,
  apiKey: 'sk-ant-existing-1234',
  maskedKey: 'sk-ant-ex••••1234',
  isConnected: true,
  onSave: vi.fn(),
  onClear: vi.fn(),
  onRequestModal: vi.fn(),
}

describe('SettingsDrawer', () => {
  it('displays connection status and calls onSave only when valid input provided', () => {
    const onSave = vi.fn()
    render(<SettingsDrawer {...baseProps} onSave={onSave} />)

    expect(screen.getByText(/connected as/i)).toHaveTextContent('sk-ant-ex')

    const input = screen.getByPlaceholderText('sk-ant-...')
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.blur(input)
    expect(
      screen.getByText(/please enter a valid anthropic key/i),
    ).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'sk-ant-new-key-9999' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onSave).toHaveBeenCalledWith('sk-ant-new-key-9999')
  })

  it('toggles password visibility and clears the key when requested', () => {
    const onClear = vi.fn()
    render(<SettingsDrawer {...baseProps} onClear={onClear} />)

    const input = screen.getByPlaceholderText('sk-ant-...')
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: /show/i }))
    expect(input).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: /clear key/i }))
    expect(onClear).toHaveBeenCalled()
  })

  it('prompts to open the modal when disconnected', () => {
    const onRequestModal = vi.fn()
    render(
      <SettingsDrawer
        {...baseProps}
        isConnected={false}
        apiKey=""
        maskedKey=""
        onRequestModal={onRequestModal}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /add api key via secure modal/i }))
    expect(onRequestModal).toHaveBeenCalled()
  })
})
