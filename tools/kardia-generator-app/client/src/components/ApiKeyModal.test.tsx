// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ApiKeyModal } from './ApiKeyModal'

const defaultProps = {
  open: true,
  anthropicKey: '',
  openaiKey: '',
  activeProvider: 'anthropic' as const,
  onClose: vi.fn(),
  onSaveAnthropic: vi.fn(),
  onSaveOpenai: vi.fn(),
  onSelectProvider: vi.fn(),
}

describe('ApiKeyModal', () => {
  it('shows errors for invalid keys and disables submit', () => {
    render(<ApiKeyModal {...defaultProps} />)

    const anthropicInput = screen.getByPlaceholderText('sk-ant-...')
    fireEvent.change(anthropicInput, { target: { value: 'invalid-key' } })
    fireEvent.blur(anthropicInput)

    const openaiInput = screen.getByPlaceholderText('sk-...')
    fireEvent.change(openaiInput, { target: { value: 'bad' } })
    fireEvent.blur(openaiInput)

    expect(
      screen.getByText(/please enter a valid anthropic key starting with/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/please enter a valid openai key starting with/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save keys/i })).toBeDisabled()
  })

  it('saves trimmed keys and closes on submit', () => {
    const onSaveAnthropic = vi.fn()
    const onSaveOpenai = vi.fn()
    const onClose = vi.fn()
    render(
      <ApiKeyModal
        {...defaultProps}
        onSaveAnthropic={onSaveAnthropic}
        onSaveOpenai={onSaveOpenai}
        onClose={onClose}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('sk-ant-...'), {
      target: { value: '  sk-ant-valid-123456789  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('sk-...'), {
      target: { value: '  sk-openai-valid-0001  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save keys/i }))

    expect(onSaveAnthropic).toHaveBeenCalledWith('sk-ant-valid-123456789')
    expect(onSaveOpenai).toHaveBeenCalledWith('sk-openai-valid-0001')
    expect(onClose).toHaveBeenCalled()
  })

  it('invokes onClose when the Later button is pressed', () => {
    const onClose = vi.fn()
    render(<ApiKeyModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /later/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('notifies when provider selection changes', () => {
    const onSelectProvider = vi.fn()
    render(<ApiKeyModal {...defaultProps} onSelectProvider={onSelectProvider} />)

    fireEvent.click(screen.getByRole('button', { name: /openai/i }))
    expect(onSelectProvider).toHaveBeenCalledWith('openai')
  })
})
