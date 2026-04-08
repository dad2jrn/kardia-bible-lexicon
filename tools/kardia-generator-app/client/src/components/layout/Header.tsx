import { Settings2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApiProvider } from '@/types'
import { cn } from '@/lib/utils'

export type HeaderTone = 'success' | 'warning'

export interface HeaderProps {
  isConnected: boolean
  activeProvider: ApiProvider
  statusLabel: string
  statusTone: HeaderTone
  onToggleDrawer: () => void
  onRequestApiKeyModal: () => void
}

const toneClasses: Record<HeaderTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-50',
}

export function Header({
  isConnected,
  activeProvider,
  statusLabel,
  statusTone,
  onToggleDrawer,
  onRequestApiKeyModal,
}: HeaderProps) {
  const providerLabel = activeProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'
  const pillText = statusLabel || (isConnected ? `${providerLabel} — Connected` : 'Not Connected')

  return (
    <header className="border-b bg-card/80 backdrop-blur px-4 py-6 shadow-sm md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Kardia Lexicon Project
          </span>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Category Generator</h1>
            <p className="text-sm text-muted-foreground">
              Second Temple Hebrew thought categories for the open source Kardia Bible
            </p>
          </div>
          <Badge variant="secondary" className="uppercase tracking-wide">
            v2 — updated system prompt · tiered glosses · correction loop
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={isConnected}
            onClick={() => (isConnected ? onToggleDrawer() : onRequestApiKeyModal())}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
              toneClasses[statusTone],
            )}
            title={
              isConnected
                ? `${providerLabel} key saved locally`
                : 'Connect an API key to start generating'
            }
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                isConnected ? 'bg-emerald-500' : 'bg-amber-500',
              )}
              aria-hidden="true"
            />
            <span>{pillText}</span>
          </button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Open API settings drawer"
            onClick={onToggleDrawer}
            title="API settings"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
