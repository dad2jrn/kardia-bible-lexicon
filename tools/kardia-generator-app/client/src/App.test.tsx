// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import App from './App'

function makeLocalStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(k => delete store[k])
    },
  }
}

describe('App shell', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }) as Promise<Response>,
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the API key modal on first load and updates status once connected', async () => {
    render(<App />)

    expect(screen.getByRole('dialog', { name: /connect your api key/i })).toBeInTheDocument()
    const statusPill = screen.getByRole('button', { name: /connect api key/i })
    expect(statusPill.getAttribute('aria-pressed')).toBe('false')

    fireEvent.change(screen.getByPlaceholderText('sk-ant-...'), {
      target: { value: 'sk-ant-demo-key-123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: /connect & begin/i }))

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /connect your api key/i }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /api connected/i })).toBeInTheDocument()
  })

  it('toggles the settings drawer and closes it with Escape', () => {
    localStorage.setItem('kardia_api_key', 'sk-ant-existing-key-9999')
    render(<App />)

    const drawerSection = screen.getByText(/api key settings/i).closest('section')
    expect(drawerSection?.getAttribute('aria-hidden')).toBe('true')

    fireEvent.click(screen.getByLabelText(/open api settings drawer/i))
    expect(drawerSection?.getAttribute('aria-hidden')).toBe('false')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(drawerSection?.getAttribute('aria-hidden')).toBe('true')
  })

  it('updates the selected pill when choosing a category', async () => {
    localStorage.setItem('kardia_api_key', 'sk-ant-existing-key-9999')
    render(<App />)

    const button = await screen.findByRole('button', { name: /Elohim/i })
    fireEvent.click(button)

    await waitFor(() =>
      expect(screen.getByText(/Elohim \(God & Covenant\)/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/Currently using Sonnet 4\.6/)).toBeInTheDocument()

    fireEvent.click(button)
    await waitFor(() =>
      expect(screen.getByText(/No category selected/)).toBeInTheDocument(),
    )
  })
})
