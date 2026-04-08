import { Loader2, RotateCcw } from 'lucide-react'

import type { GeneratorStatus } from '@/hooks/useGenerator'
import type { CategorySelection } from '@/types/category'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'

export interface GeneratePanelProps {
  selectedCategory: CategorySelection | null
  selectedModelLabel: string
  isConnected: boolean
  status: GeneratorStatus
  iteration: number
  isBusy: boolean
  error?: string | null
  onGenerate: () => void
  onAbort: () => void
  onRetry: () => void
}

const toneStyles: Record<GeneratorStatus['tone'], string> = {
  muted: 'bg-muted text-muted-foreground',
  info: 'bg-blue-50 text-blue-900 dark:bg-blue-500/10 dark:text-blue-100',
  success: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100',
  error: 'bg-destructive/10 text-destructive',
}

export function GeneratePanel({
  selectedCategory,
  selectedModelLabel,
  isConnected,
  status,
  iteration,
  isBusy,
  error,
  onGenerate,
  onAbort,
  onRetry,
}: GeneratePanelProps) {
  const hasCategory = Boolean(selectedCategory)
  const canGenerate = isConnected && hasCategory && !isBusy

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Generation Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Runs generation → validator → verse translations using {selectedModelLabel}.
          </p>
        </div>
        {iteration > 0 && (
          <Badge variant="outline" className="text-xs uppercase tracking-[0.2em]">
            Pass #{iteration}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Button
          type="button"
          disabled={!canGenerate}
          onClick={onGenerate}
          className="flex-1"
        >
          {isBusy ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running pipeline…
            </span>
          ) : (
            `Generate${selectedCategory ? ` ${selectedCategory.label}` : ''}`
          )}
        </Button>
        {isBusy && (
          <Button
            type="button"
            variant="ghost"
            onClick={onAbort}
          >
            Cancel
          </Button>
        )}
      </div>

      {!isConnected && (
        <p className="text-sm text-muted-foreground">
          Connect a valid Anthropic key before starting a run.
        </p>
      )}

      <div
        className={cn(
          'rounded-xl px-4 py-3 text-sm transition',
          toneStyles[status.tone],
          isBusy && 'border border-blue-100 dark:border-blue-400/30',
        )}
        aria-live="polite"
      >
        <div className="font-medium">{status.label}</div>
        <p className="text-sm text-muted-foreground dark:text-inherit">{status.helperText}</p>
      </div>

      {status.tone === 'error' && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center gap-2 font-semibold">
            <RotateCcw className="h-4 w-4" />
            {error ?? 'Generation failed.'}
          </div>
          <button
            type="button"
            className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] underline-offset-4 hover:underline"
            onClick={onRetry}
          >
            Retry last parameters
          </button>
        </div>
      )}
    </div>
  )
}
