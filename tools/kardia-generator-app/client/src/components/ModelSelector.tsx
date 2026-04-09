import { MODEL_OPTIONS_BY_PROVIDER, type ModelId } from '@/constants/models'
import type { ApiProvider } from '@/types'
import { cn } from '@/lib/utils'

export interface ModelSelectorProps {
  provider: ApiProvider
  value: ModelId
  onChange: (model: ModelId) => void
  disabled?: boolean
  className?: string
}

export function ModelSelector({ provider, value, onChange, disabled, className }: ModelSelectorProps) {
  const options = MODEL_OPTIONS_BY_PROVIDER[provider]
  const helperCopy =
    provider === 'anthropic'
      ? 'Sonnet 4.6 recommended — holds complex theological guard rails reliably at roughly $0.03 per entry including validation.'
      : 'GPT-5.4 recommended — flagship reasoning tier with best default accuracy for multi-step batches.'

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        {helperCopy}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {options.map(option => {
          const isSelected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                'flex-1 rounded-2xl border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
                disabled && 'pointer-events-none opacity-50',
              )}
              aria-pressed={isSelected}
              onClick={() => !disabled && onChange(option.id)}
            >
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{option.label}</span>
                <span className="text-sm font-normal text-muted-foreground">{option.costHint}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{option.subtitle}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
