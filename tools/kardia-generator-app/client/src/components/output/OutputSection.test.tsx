import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { CategoryEntry, ValidatorResult } from '@/types'
import { OutputSection } from './OutputSection'
import type { ApprovalState } from '@/types/ui'

const entry = {
  id: 'id',
  hebrew_root: 'root',
  transliteration: 'root',
  testament_scope: 'ot',
  category_label: 'Label',
  one_liner: 'one',
  full_definition: 'full',
  what_it_does: 'does',
  what_it_is_not: 'not',
  second_temple_context: 'ctx',
  kardia_rendering: 'render',
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
} satisfies CategoryEntry

const validator: ValidatorResult = {
  overall: 'clean',
  summary: 'ok',
  flags: [],
}

describe('OutputSection', () => {
  const approvalState: ApprovalState = { status: 'idle', message: null }

  it('shows placeholder before first run', () => {
    render(
      <OutputSection
        entry={null}
        validator={null}
        kardiaVerses={[]}
        rawRecovery={null}
        isBusy={false}
        onApprove={vi.fn()}
        approvalState={approvalState}
        onCopyJson={vi.fn()}
        onRegenerate={vi.fn()}
        onRetryRecovery={vi.fn()}
        onRequestCorrections={vi.fn()}
      />,
    )
    expect(screen.getByText(/Run a generation pass/i)).toBeInTheDocument()
  })

  it('renders tabs and switches to recovery automatically', () => {
    const { rerender } = render(
      <OutputSection
        entry={entry}
        validator={validator}
        kardiaVerses={[]}
        rawRecovery={null}
        isBusy={false}
        onApprove={vi.fn()}
        approvalState={approvalState}
        onCopyJson={vi.fn()}
        onRegenerate={vi.fn()}
        onRetryRecovery={vi.fn()}
        onRequestCorrections={vi.fn()}
      />,
    )
    expect(screen.getByText(/Approve/i)).toBeInTheDocument()

    rerender(
      <OutputSection
        entry={null}
        validator={null}
        kardiaVerses={[]}
        rawRecovery="RAW"
        isBusy={false}
        onApprove={vi.fn()}
        approvalState={approvalState}
        onCopyJson={vi.fn()}
        onRegenerate={vi.fn()}
        onRetryRecovery={vi.fn()}
        onRequestCorrections={vi.fn()}
      />,
    )

    expect(screen.getByText(/JSON parsing failed/i)).toBeInTheDocument()
  })
})
