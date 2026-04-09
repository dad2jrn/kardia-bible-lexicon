import { useMemo } from 'react'

import { catToId, cn } from '@/lib/utils'
import { KardiaCard } from '@/components/ui/kardia-card'
import { HelperText } from '@/components/ui/helper-text'

export interface ProgressSectionProps {
  groups: Record<string, string[]>
  completedIds: Set<string>
  loading?: boolean
}

interface GroupProgress {
  name: string
  total: number
  complete: number
  percent: number
}

function buildGroupProgress(groups: Record<string, string[]>, completedIds: Set<string>): GroupProgress[] {
  return Object.entries(groups).map(([name, categories]) => {
    const complete = categories.filter(cat => completedIds.has(catToId(cat))).length
    const total = categories.length
    const percent = total === 0 ? 0 : Math.round((complete / total) * 100)
    return { name, total, complete, percent }
  })
}

export function ProgressSection({ groups, completedIds, loading }: ProgressSectionProps) {
  const totalCategories = useMemo(
    () => Object.values(groups).reduce((acc, cats) => acc + cats.length, 0),
    [groups],
  )
  const completeCount = completedIds.size
  const percent = totalCategories === 0 ? 0 : Math.round((completeCount / totalCategories) * 100)
  const perGroup = useMemo(() => buildGroupProgress(groups, completedIds), [groups, completedIds])

  return (
    <KardiaCard variant="surface" className="relative space-y-6">
      <div className="space-y-1">
        <p className="type-meta text-[color:var(--kardia-gold)]">Progress</p>
        <HelperText>
          {completeCount} / {totalCategories} categories approved ({percent}% complete)
        </HelperText>
      </div>

      <div className="space-y-2">
        <div className="h-3 rounded-full bg-[color:color-mix(in_srgb,var(--kardia-border) 40%,transparent)]">
          <div
            className="h-3 rounded-full bg-[color:var(--kardia-success)] transition-all"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="text-xs text-[color:var(--kardia-muted)]">
          {totalCategories - completeCount} categories remaining
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {perGroup.map(group => (
          <div
            key={group.name}
            className="rounded-2xl border border-[color:color-mix(in_srgb,var(--kardia-border) 75%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-card) 85%,var(--kardia-bg))] p-4"
          >
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-[color:var(--kardia-text)]">{group.name}</p>
              <span className="text-xs text-[color:var(--kardia-muted)]">{group.complete}/{group.total}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--kardia-border) 35%,transparent)]">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  group.percent === 100 ? 'bg-[color:var(--kardia-success)]' : 'bg-[color:var(--kardia-gold)]',
                )}
                style={{ width: `${group.percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[color:var(--kardia-muted)]">{group.percent}% complete</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--kardia-overlay)] backdrop-blur">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--kardia-border)] border-t-[color:var(--kardia-gold)]" aria-label="Loading progress" />
        </div>
      )}
    </KardiaCard>
  )
}
