// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { CategoryEntry } from '@/types'
import type { GeneratorStatus } from '@/hooks/useGenerator'
import App from './App'

const baseGeneratorStatus: GeneratorStatus = {
  step: 'idle',
  label: 'Ready',
  helperText: '',
  tone: 'muted',
}

const generatorMock = {
  entry: null as CategoryEntry | null,
  validator: null,
  kardiaVerses: [] as CategoryEntry['_kardia_verses'] | [],
  rawRecovery: null as string | null,
  iteration: 0,
  status: baseGeneratorStatus,
  isBusy: false,
  error: null as string | null,
  generateFresh: vi.fn(),
  regenerateWithSameParams: vi.fn(),
  retryAfterFailure: vi.fn(),
  abortInFlight: vi.fn(),
  resetOutputs: vi.fn(),
}

vi.mock('@/hooks/useGenerator', () => ({
  useGenerator: () => generatorMock,
}))

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
    Object.assign(generatorMock, {
      entry: null,
      validator: null,
      kardiaVerses: [],
      rawRecovery: null,
      iteration: 0,
      status: baseGeneratorStatus,
      isBusy: false,
      error: null,
    })
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

  it('renders output controls when generator has data', () => {
    generatorMock.entry = {
      id: 'id',
      hebrew_root: '',
      transliteration: '',
      testament_scope: 'ot',
      category_label: 'Label',
      one_liner: '',
      full_definition: '',
      what_it_does: '',
      what_it_is_not: '',
      second_temple_context: '',
      kardia_rendering: '',
      surface_vehicles: {
        hebrew_lexemes: [],
        strongs_hebrew: [],
        lxx_greek: [],
        nt_greek: [],
        strongs_greek: [],
        english_glosses: [],
      },
      illustrative_renderings: [],
      key_verses: [],
      related_categories: [],
      theological_notes: '',
      semantic_domain_id: 'god-covenant',
      textual_layer_id: 'pre-exilic',
      version: '1.0',
      reviewed_by: '',
    }
    localStorage.setItem('kardia_api_key', 'sk-ant-existing-key-9999')
    render(<App />)
    expect(screen.getByText(/Copy JSON/i)).toBeInTheDocument()
  })
})
