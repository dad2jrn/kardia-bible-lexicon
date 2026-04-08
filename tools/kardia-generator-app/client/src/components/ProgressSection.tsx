import { useMemo } from 'react'

import { catToId, cn } from '@/lib/utils'

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
    <section className="relative rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Progress
        </span>
        <p className="text-sm text-muted-foreground">
          {completeCount} / {totalCategories} categories approved ({percent}% complete)
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-3 rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {totalCategories - completeCount} categories remaining
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {perGroup.map(group => (
          <div key={group.name} className="rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">{group.name}</p>
              <span className="text-xs text-muted-foreground">{group.complete}/{group.total}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  group.percent === 100 ? 'bg-emerald-500' : 'bg-primary/70',
                )}
                style={{ width: `${group.percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{group.percent}% complete</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-label="Loading progress" />
        </div>
      )}
    </section>
  )
}
