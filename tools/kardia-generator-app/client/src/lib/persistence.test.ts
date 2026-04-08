import { describe, expect, it, vi, afterEach } from 'vitest'

import type { CategoryEntry } from '@/types'
import { buildExportPayload, extractEntriesFromData } from './persistence'

const sampleEntry: CategoryEntry = {
  id: 'chesed',
  hebrew_root: 'חֶסֶד',
  transliteration: 'chesed',
  testament_scope: 'both',
  category_label: 'Chesed',
  one_liner: 'summary',
  full_definition: 'full',
  what_it_does: 'does',
  what_it_is_not: 'not',
  second_temple_context: 'context',
  kardia_rendering: 'render',
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
  theological_notes: 'notes',
  semantic_domain_id: 'god-covenant',
  textual_layer_id: 'pre-exilic',
  version: '1.0',
  reviewed_by: '',
  _kardia_verses: [],
  _iterations: 1,
  _truncation_warning: true,
}

describe('persistence helpers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('buildExportPayload produces metadata snapshot and strips truncation flag', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-04-08T12:00:00Z'))

    const payload = buildExportPayload([sampleEntry], 30)
    expect(payload.version).toBe('1.0')
    expect(payload.generated).toBe('2026-04-08T12:00:00.000Z')
    expect(payload.status).toEqual({
      total_seed_categories: 30,
      complete: 1,
      pending: 29,
    })
    expect(payload.entries[0]._truncation_warning).toBeUndefined()
    expect(payload.entries[0]._kardia_verses).toEqual([])
  })

  it('extractEntriesFromData handles bare arrays and nested payloads', () => {
    expect(extractEntriesFromData([sampleEntry])).toHaveLength(1)
    expect(extractEntriesFromData({ entries: [sampleEntry] })).toHaveLength(1)
    expect(() => extractEntriesFromData(null)).toThrow(/empty/i)
    expect(() => extractEntriesFromData({})).toThrow(/entries/i)
  })
})
