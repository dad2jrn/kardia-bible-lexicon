import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { CategoryEntry } from '@/types'
import { JsonPanel } from './JsonPanel'
import type { ApprovalState } from '@/types/ui'

const entry: CategoryEntry = {
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
  _truncation_warning: true,
}

const approvalIdle: ApprovalState = { status: 'idle', message: null }

describe('JsonPanel', () => {
  it('shows placeholder when entry missing', () => {
    render(
      <JsonPanel
        entry={null}
        isBusy={false}
        onApprove={vi.fn()}
        approvalState={approvalIdle}
        onRegenerate={vi.fn()}
      />,
    )
    expect(screen.getByText(/Generate a fresh entry/i)).toBeInTheDocument()
  })

  it('copies JSON and surfaces truncation badge', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    ;(navigator as unknown as { clipboard: { writeText: typeof writeText } }).clipboard = {
      writeText,
    }
    const onCopy = vi.fn()
    const onApprove = vi.fn()
    render(
      <JsonPanel
        entry={entry}
        isBusy={false}
        onApprove={onApprove}
        approvalState={approvalIdle}
        onRegenerate={vi.fn()}
        onCopy={onCopy}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /copy json/i }))
    expect(writeText).toHaveBeenCalled()
    expect(onCopy).toHaveBeenCalled()
    expect(screen.getByText(/Possible truncation/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(onApprove).toHaveBeenCalled()
  })

  it('shows approval status messaging', () => {
    render(
      <JsonPanel
        entry={entry}
        isBusy={false}
        onApprove={vi.fn()}
        approvalState={{ status: 'error', message: 'Failed to save' }}
        onRegenerate={vi.fn()}
      />,
    )
    expect(screen.getByText(/Failed to save/)).toBeInTheDocument()
  })
})
