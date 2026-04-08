import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ModelSelector } from './ModelSelector'

describe('ModelSelector', () => {
  it('marks Sonnet as selected by default value', () => {
    const handleChange = vi.fn()
    render(<ModelSelector value="claude-sonnet-4-6" onChange={handleChange} />)
    expect(screen.getByRole('button', { name: /sonnet 4\.6/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('invokes onChange when selecting another model', () => {
    const handleChange = vi.fn()
    render(<ModelSelector value="claude-sonnet-4-6" onChange={handleChange} />)
    const opusButton = screen.getByRole('button', { name: /opus 4\.6/i })
    fireEvent.click(opusButton)
    expect(handleChange).toHaveBeenCalledWith('claude-opus-4-6')
  })
})
