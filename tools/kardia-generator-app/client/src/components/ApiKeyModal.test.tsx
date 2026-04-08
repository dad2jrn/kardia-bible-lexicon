// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ApiKeyModal } from './ApiKeyModal'

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
}

describe('ApiKeyModal', () => {
  it('shows an error for invalid keys and keeps submit disabled', () => {
    render(<ApiKeyModal {...defaultProps} />)

    const input = screen.getByPlaceholderText('sk-ant-...')
    fireEvent.change(input, { target: { value: 'invalid-key' } })
    fireEvent.blur(input)

    expect(
      screen.getByText(/please enter a valid api key starting with/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect & begin/i })).toBeDisabled()
  })

  it('calls onSave with the trimmed key when submit succeeds', () => {
    const onSave = vi.fn()
    render(<ApiKeyModal {...defaultProps} onSave={onSave} />)

    fireEvent.change(screen.getByPlaceholderText('sk-ant-...'), {
      target: { value: '  sk-ant-valid-123456789  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /connect & begin/i }))

    expect(onSave).toHaveBeenCalledWith('sk-ant-valid-123456789')
  })

  it('invokes onClose when the Later button is pressed', () => {
    const onClose = vi.fn()
    render(<ApiKeyModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /later/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
