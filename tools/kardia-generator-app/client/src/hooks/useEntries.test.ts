// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEntries } from './useEntries'
import type { CategoryEntry, KardiaVerse } from '@/types'

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeEntry(id: string): CategoryEntry {
  return {
    id,
    hebrew_root: 'חֶסֶד',
    transliteration: id,
    testament_scope: 'both',
    category_label: id,
    one_liner: 'test',
    full_definition: 'test',
    what_it_does: 'test',
    what_it_is_not: 'test',
    second_temple_context: 'test',
    kardia_rendering: 'covenant faithfulness',
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
    theological_notes: 'test',
    semantic_domain_id: 'god-covenant',
    textual_layer_id: 'pre-exilic',
    version: '1.0.0',
    reviewed_by: '',
  }
}

// ── Fetch mock helpers ────────────────────────────────────────────────────────

type MockResponse = { ok: boolean; status?: number; data: unknown }

function mockResponse({ ok, status, data }: MockResponse) {
  return {
    ok,
    status: status ?? (ok ? 200 : 500),
    json: () => Promise.resolve(data),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useEntries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ── Mount / fetch ─────────────────────────────────────────────────────────

  it('starts loading=true and resolves to fetched entries', async () => {
    const entries = [makeEntry('chesed')]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse({ ok: true, data: entries })),
    )

    const { result } = renderHook(() => useEntries())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toEqual(entries)
    expect(result.current.error).toBeNull()
  })

  it('sets error when the initial GET fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockResponse({ ok: false, data: { error: 'DB unavailable' } }),
      ),
    )

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('DB unavailable')
    expect(result.current.entries).toEqual([])
  })

  it('uses HTTP status text as fallback when error body has no error field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse({ ok: false, status: 503, data: {} })),
    )

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('HTTP 503')
  })

  // ── approve ───────────────────────────────────────────────────────────────

  it('approve POSTs the entry and re-fetches to sync DB state', async () => {
    const entry = makeEntry('chesed')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [] }))                                  // mount GET
      .mockResolvedValueOnce(mockResponse({ ok: true, status: 201, data: { ok: true, id: 'chesed' } })) // POST
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [entry] }))                              // re-fetch GET

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.approve(entry) })

    expect(fetchMock).toHaveBeenCalledTimes(3)

    const [postUrl, postInit] = fetchMock.mock.calls[1]
    expect(postUrl).toBe('/api/entries')
    expect(postInit.method).toBe('POST')
    expect(JSON.parse(postInit.body)).toMatchObject({ id: 'chesed' })

    expect(result.current.entries).toEqual([entry])
  })

  it('approve propagates errors from the POST', async () => {
    const entry = makeEntry('chesed')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [] }))
      .mockResolvedValueOnce(mockResponse({ ok: false, data: { error: 'validation failed' } }))

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => { await result.current.approve(entry) })
    ).rejects.toThrow('validation failed')
  })

  // ── updateEntry ───────────────────────────────────────────────────────────

  it('updateEntry PUTs to the correct URL and merges scalar patch into local state', async () => {
    const entry = makeEntry('chesed')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [entry] }))
      .mockResolvedValueOnce(mockResponse({ ok: true, data: { ok: true, id: 'chesed' } }))

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateEntry('chesed', { kardia_rendering: 'covenant loyalty' })
    })

    const [putUrl, putInit] = fetchMock.mock.calls[1]
    expect(putUrl).toBe('/api/entries/chesed')
    expect(putInit.method).toBe('PUT')

    expect(result.current.entries[0].kardia_rendering).toBe('covenant loyalty')
  })

  it('updateEntry remaps kardia_verses to _kardia_verses in local state', async () => {
    const entry = makeEntry('chesed')
    const verses: KardiaVerse[] = [
      {
        verse_ref: 'Ps.136.1',
        standard_rendering: 'His love endures forever',
        kardia_translation: 'His covenant faithfulness endures forever',
      },
    ]

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [entry] }))
      .mockResolvedValueOnce(mockResponse({ ok: true, data: { ok: true, id: 'chesed' } }))

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateEntry('chesed', { kardia_verses: verses })
    })

    // _kardia_verses updated; kardia_verses key must not remain
    expect(result.current.entries[0]._kardia_verses).toEqual(verses)
    expect((result.current.entries[0] as Record<string, unknown>)['kardia_verses']).toBeUndefined()
  })

  it('updateEntry only mutates the targeted entry', async () => {
    const e1 = makeEntry('chesed')
    const e2 = makeEntry('emeth')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [e1, e2] }))
      .mockResolvedValueOnce(mockResponse({ ok: true, data: { ok: true, id: 'chesed' } }))

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateEntry('chesed', { kardia_rendering: 'updated' })
    })

    expect(result.current.entries.find(e => e.id === 'emeth')?.kardia_rendering).toBe(
      'covenant faithfulness',
    )
  })

  // ── deleteEntry ───────────────────────────────────────────────────────────

  it('deleteEntry calls DELETE and removes the entry from local state', async () => {
    const e1 = makeEntry('chesed')
    const e2 = makeEntry('emeth')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [e1, e2] }))
      .mockResolvedValueOnce(mockResponse({ ok: true, data: { ok: true, id: 'chesed' } }))

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toHaveLength(2)

    await act(async () => { await result.current.deleteEntry('chesed') })

    const [deleteUrl, deleteInit] = fetchMock.mock.calls[1]
    expect(deleteUrl).toBe('/api/entries/chesed')
    expect(deleteInit.method).toBe('DELETE')

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].id).toBe('emeth')
  })

  it('deleteEntry propagates errors from the server', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, data: [makeEntry('chesed')] }))
      .mockResolvedValueOnce(mockResponse({ ok: false, data: { error: 'Entry not found' } }))

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useEntries())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => { await result.current.deleteEntry('chesed') })
    ).rejects.toThrow('Entry not found')

    // State must not change on error
    expect(result.current.entries).toHaveLength(1)
  })
})
