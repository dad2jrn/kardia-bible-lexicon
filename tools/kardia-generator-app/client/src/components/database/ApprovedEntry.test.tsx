import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { CategoryEntry } from '@/types'
import { ApprovedEntry } from './ApprovedEntry'

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

describe('ApprovedEntry', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('copies JSON and opens preview tabs', async () => {
    const onCopy = vi.fn()
    render(
      <ApprovedEntry
        entry={entry}
        onCopyJson={onCopy}
        onDelete={vi.fn()}
        onGenerateVerses={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /copy json/i }))
    await waitFor(() => expect(onCopy).toHaveBeenCalled())
  })

  it('confirms deletion before calling onDelete', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(
      <ApprovedEntry
        entry={entry}
        onCopyJson={vi.fn()}
        onDelete={onDelete}
        onGenerateVerses={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    const removeButtons = await screen.findAllByRole('button', { name: /^remove/i })
    fireEvent.click(removeButtons.at(-1)!)

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('chesed'))
  })
})
