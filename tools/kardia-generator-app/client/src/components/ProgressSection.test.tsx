import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProgressSection } from './ProgressSection'
import { catToId } from '@/lib/utils'

const groups = {
  Alpha: ['Elohim', 'YHWH'],
  Beta: ['chesed'],
}

describe('ProgressSection', () => {
  it('renders overall and per-group progress stats', () => {
    const completed = new Set([catToId('Elohim'), catToId('chesed')])
    render(
      <ProgressSection
        groups={groups}
        completedIds={completed}
      />,
    )

    expect(screen.getByText(/2 \/ 3 categories approved/i)).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText(/50% complete/i)).toBeInTheDocument()
  })
})
