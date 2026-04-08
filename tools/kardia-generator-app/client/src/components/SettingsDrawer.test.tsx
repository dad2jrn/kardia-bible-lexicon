// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { SettingsDrawer } from './SettingsDrawer'

const baseProps = {
  open: true,
  anthropicKey: 'sk-ant-existing-1234',
  openaiKey: 'sk-openai-existing-1234',
  maskedActiveKey: 'sk-ant-ex••••1234',
  isConnected: true,
  activeProvider: 'anthropic' as const,
  onSaveAnthropic: vi.fn(),
  onSaveOpenai: vi.fn(),
  onSetActiveProvider: vi.fn(),
  onClearAll: vi.fn(),
  onRequestModal: vi.fn(),
}

describe('SettingsDrawer', () => {
  it('displays connection status and saves Anthropic keys when valid', () => {
    const onSaveAnthropic = vi.fn()
    render(<SettingsDrawer {...baseProps} onSaveAnthropic={onSaveAnthropic} />)

    expect(screen.getByText(/anthropic connected as/i)).toBeInTheDocument()

    const input = screen.getByPlaceholderText('sk-ant-...')
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.blur(input)
    expect(
      screen.getByText(/please enter a valid anthropic key/i),
    ).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'sk-ant-new-key-9999' } })
    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[0])

    expect(onSaveAnthropic).toHaveBeenCalledWith('sk-ant-new-key-9999')
  })

  it('manages OpenAI key visibility, validation, and clearing', () => {
    const onSaveOpenai = vi.fn()
    render(
      <SettingsDrawer
        {...baseProps}
        openaiKey=""
        onSaveOpenai={onSaveOpenai}
      />,
    )

    const input = screen.getByPlaceholderText('sk-...')
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getAllByRole('button', { name: /show/i })[1])
    expect(input).toHaveAttribute('type', 'text')

    fireEvent.change(input, { target: { value: 'bad-key' } })
    fireEvent.blur(input)
    expect(screen.getByText(/please enter a valid openai key/i)).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'sk-valid-openai-key' } })
    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[1])
    expect(onSaveOpenai).toHaveBeenCalledWith('sk-valid-openai-key')

    fireEvent.click(screen.getAllByRole('button', { name: /^clear$/i })[1])
    expect(onSaveOpenai).toHaveBeenCalledWith('')
  })

  it('supports provider toggle, modal prompt, and clearing all keys', () => {
    const onRequestModal = vi.fn()
    const onSetActiveProvider = vi.fn()
    const onClearAll = vi.fn()
    render(
      <SettingsDrawer
        {...baseProps}
        isConnected={false}
        anthropicKey=""
        openaiKey=""
        maskedActiveKey=""
        onSetActiveProvider={onSetActiveProvider}
        onClearAll={onClearAll}
        onRequestModal={onRequestModal}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /add api key via secure modal/i }))
    expect(onRequestModal).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /openai/i }))
    expect(onSetActiveProvider).toHaveBeenCalledWith('openai')

    fireEvent.click(screen.getByRole('button', { name: /clear all keys/i }))
    expect(onClearAll).toHaveBeenCalled()
  })
})
