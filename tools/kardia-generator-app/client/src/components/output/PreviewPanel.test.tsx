import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CategoryEntry, KardiaVerse } from '@/types'
import { PreviewPanel } from './PreviewPanel'

const entry = {
  id: 'id',
  hebrew_root: 'root',
  transliteration: 'root',
  testament_scope: 'ot',
  category_label: 'Label',
  one_liner: 'one liner',
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
    english_glosses: { recommended: ['gloss'], attested: [] },
  },
  illustrative_renderings: [{ translation: 'NLT', text: 'example' }],
  key_verses: [],
  related_categories: [],
  theological_notes: 'notes',
  semantic_domain_id: 'god-covenant',
  textual_layer_id: 'pre-exilic',
  version: '1.0',
  reviewed_by: '',
} satisfies CategoryEntry

const verses: KardiaVerse[] = [
  { verse_ref: 'Gen 1:1', standard_rendering: 'God', kardia_translation: 'Rendering' },
]

describe('PreviewPanel', () => {
  it('renders entry preview content', () => {
    render(
      <PreviewPanel
        entry={entry}
        kardiaVerses={verses}
      />,
    )
    expect(screen.getByText(/one liner/i)).toBeInTheDocument()
    expect(screen.getByText(/Kardia verse translations/i)).toBeInTheDocument()
  })
})

