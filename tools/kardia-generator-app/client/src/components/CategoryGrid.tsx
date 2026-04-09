import { memo, useMemo } from 'react'

import { catToId } from '@/lib/utils'
import type { CategorySelection } from '@/types/category'
import { Pill } from '@/components/ui/pill'

export interface CategoryGridProps {
  groups: Record<string, string[]>
  selectedId?: string | null
  completedIds?: Set<string> | string[]
  disabled?: boolean
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onSelect?: (selection: CategorySelection) => void
}

export const CategoryGrid = memo(function CategoryGrid({
  groups,
  selectedId,
  completedIds,
  disabled,
  loading,
  error,
  onRetry,
  onSelect,
}: CategoryGridProps) {
  const completedSet = useMemo(() => {
    if (!completedIds) return new Set<string>()
    return completedIds instanceof Set ? completedIds : new Set(completedIds)
  }, [completedIds])

  return (
    <div className="relative space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="font-medium">Unable to load existing entries.</div>
          <p className="mt-1 text-destructive/80">Reason: {error}</p>
          {onRetry && (
            <button
              type="button"
              className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-destructive underline-offset-4 hover:underline"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {Object.entries(groups).map(([group, categories]) => (
        <div key={group} className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {group}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map(category => {
              const id = catToId(category)
              const isSelected = selectedId === id
              const isCompleted = completedSet.has(id)
              return (
                <Pill
                  key={id}
                  label={category}
                  description={group}
                  selected={isSelected}
                  completed={isCompleted}
                  disabled={disabled || loading}
                  aria-label={`Select ${category}`}
                  onClick={() => {
                    if (disabled || loading) return
                    onSelect?.({ id, label: category, group })
                  }}
                />
              )
            })}
          </div>
        </div>
      ))}

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" aria-label="Loading categories" />
        </div>
      )}
    </div>
  )
})
