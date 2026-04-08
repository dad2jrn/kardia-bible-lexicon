// @vitest-environment happy-dom

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CategoryEntry, ValidatorResult, KardiaVerse } from '@/types'
import type { CategorySelection } from '@/types/category'
import type { ModelId } from '@/constants/models'
import { JsonParseError } from '@/lib/anthropic'
import { useGenerator } from './useGenerator'

const { runGenerationMock, runValidationMock, runVerseMock, buildCorrectionPromptMock } = vi.hoisted(() => ({
  runGenerationMock: vi.fn(),
  runValidationMock: vi.fn(),
  runVerseMock: vi.fn(),
  buildCorrectionPromptMock: vi.fn(() => 'correction prompt'),
}))

vi.mock('@/lib/anthropic', async () => {
  const actual = await vi.importActual<typeof import('@/lib/anthropic')>('@/lib/anthropic')
  return {
    ...actual,
    buildGenerationPrompt: vi.fn(() => 'prompt'),
    buildCorrectionPrompt: buildCorrectionPromptMock,
    runGeneration: runGenerationMock,
    runValidation: runValidationMock,
    runKardiaVerseTranslation: runVerseMock,
  }
})

const category: CategorySelection = { id: 'elohim', label: 'Elohim', group: 'God & Covenant' }
const model: ModelId = 'claude-sonnet-4-6'
const apiKey = 'sk-ant-test'
const provider = 'anthropic' as const

const entry: CategoryEntry = {
  id: 'elohim',
  hebrew_root: 'אלה',
  transliteration: 'elohim',
  testament_scope: 'ot',
  category_label: 'Elohim',
  one_liner: 'One liner',
  full_definition: 'Definition',
  what_it_does: 'Does',
  what_it_is_not: 'Not',
  second_temple_context: 'Context',
  kardia_rendering: 'Rendering',
  surface_vehicles: {
    hebrew_lexemes: [],
    strongs_hebrew: [],
    lxx_greek: [],
    nt_greek: [],
    strongs_greek: [],
    english_glosses: { recommended: [], attested: [] },
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

const validator: ValidatorResult = {
  overall: 'clean',
  summary: 'Looks good',
  flags: [],
}

const verses: KardiaVerse[] = [
  { verse_ref: 'Gen 1:1', standard_rendering: 'God', kardia_translation: 'Elohim' },
]

describe('useGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runGenerationMock.mockReset()
    runValidationMock.mockReset()
    runVerseMock.mockReset()
  })

  it('runs the happy path pipeline', async () => {
    runGenerationMock.mockResolvedValue(entry)
    runValidationMock.mockResolvedValue(validator)
    runVerseMock.mockResolvedValue(verses)

    const { result } = renderHook(() => useGenerator())
    await act(() => result.current.generateFresh(category, model, apiKey, provider))

    await waitFor(() => expect(result.current.status.step).toBe('complete'))
    expect(result.current.entry).toEqual(entry)
    expect(result.current.validator).toEqual(validator)
    expect(result.current.kardiaVerses).toEqual(verses)
    expect(result.current.iteration).toBe(1)
    expect(runGenerationMock).toHaveBeenCalled()
    expect(runGenerationMock.mock.calls[0][3]).toBe('anthropic')
  })

  it('surfaces validator failures as errors', async () => {
    runGenerationMock.mockResolvedValue(entry)
    runValidationMock.mockRejectedValue(new Error('validator broke'))

    const { result } = renderHook(() => useGenerator())
    await act(() => result.current.generateFresh(category, model, apiKey, provider))

    await waitFor(() => expect(result.current.status.step).toBe('error'))
    expect(result.current.error).toContain('validator broke')
  })

  it('continues when verse translation fails', async () => {
    runGenerationMock.mockResolvedValue(entry)
    runValidationMock.mockResolvedValue(validator)
    runVerseMock.mockRejectedValue(new Error('verse boom'))

    const { result } = renderHook(() => useGenerator())
    await act(() => result.current.generateFresh(category, model, apiKey, provider))

    await waitFor(() => expect(result.current.status.step).toBe('complete'))
    expect(result.current.kardiaVerses).toEqual([])
  })

  it('stores raw recovery text on JsonParseError', async () => {
    runGenerationMock.mockRejectedValue(new JsonParseError('bad json', 'RAW TEXT'))

    const { result } = renderHook(() => useGenerator())
    await act(() => result.current.generateFresh(category, model, apiKey, provider))

    await waitFor(() => expect(result.current.status.step).toBe('error'))
    expect(result.current.rawRecovery).toBe('RAW TEXT')
  })

  it('handles AbortError surfaces idle state', async () => {
    runGenerationMock.mockRejectedValue(
      Object.assign(new Error('Aborted'), { name: 'AbortError' }),
    )
    const { result } = renderHook(() => useGenerator())
    await act(() => result.current.generateFresh(category, model, apiKey, provider))
    await waitFor(() => expect(result.current.status.step).toBe('idle'))
    expect(result.current.error).toBe('Generation cancelled.')
  })

  it('rebuilds the prompt and reruns the pipeline for corrections', async () => {
    runGenerationMock.mockResolvedValue(entry)
    runValidationMock.mockResolvedValue(validator)
    runVerseMock.mockResolvedValue([])
    const { result } = renderHook(() => useGenerator())

    await act(() => result.current.generateFresh(category, model, apiKey, provider))
    await waitFor(() => expect(result.current.iteration).toBe(1))

    await act(() =>
      result.current.requestCorrections({ combinedCorrections: 'AUTO NOTES' }),
    )
    await waitFor(() => expect(buildCorrectionPromptMock).toHaveBeenCalledWith(entry, validator.summary, 'AUTO NOTES'))
    await waitFor(() => expect(result.current.iteration).toBe(2))
    expect(runGenerationMock).toHaveBeenCalledTimes(2)
  })
})
