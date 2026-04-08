import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { CategoryEntry } from '@/types'
import { DatabaseSection } from './DatabaseSection'

const entry: CategoryEntry = {
  id: 'chesed',
  hebrew_root: 'root',
  transliteration: 'chesed',
  testament_scope: 'ot',
  category_label: 'Chesed',
  one_liner: 'one',
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
  theological_notes: '',
  semantic_domain_id: 'god-covenant',
  textual_layer_id: 'pre-exilic',
  version: '1.0',
  reviewed_by: '',
  _kardia_verses: [],
}

describe('DatabaseSection', () => {
  const createObjectUrl = vi.fn(() => 'blob:mock')
  const revokeObjectUrl = vi.fn()
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    createObjectUrl.mockClear()
    revokeObjectUrl.mockClear()
    clickSpy.mockClear()
  })

  it('exports entries to JSON and triggers download', async () => {
    render(
      <DatabaseSection
        entries={[entry]}
        loading={false}
        totalCategories={30}
        onCopyJson={vi.fn()}
        onDeleteEntry={vi.fn()}
        onImportEntries={vi.fn().mockResolvedValue({ success: 0, failure: 0 })}
        onGenerateVerses={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export categories/i }))
    expect(createObjectUrl).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })

  it('imports a file and reports summary', async () => {
    const onImport = vi.fn().mockResolvedValue({ success: 1, failure: 0 })
    render(
      <DatabaseSection
        entries={[]}
        loading={false}
        totalCategories={30}
        onCopyJson={vi.fn()}
        onDeleteEntry={vi.fn()}
        onImportEntries={onImport}
        onGenerateVerses={vi.fn()}
      />,
    )

    const fileInput = screen.getByLabelText(/import/i, { selector: 'input' })
    const file = new File([JSON.stringify({ entries: [entry] })], 'categories.json', {
      type: 'application/json',
    })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(onImport).toHaveBeenCalled())
    expect(screen.getByText(/import complete/i)).toBeInTheDocument()
  })
})
