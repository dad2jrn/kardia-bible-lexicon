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
  success:
    'border-[color:color-mix(in_srgb,var(--kardia-success) 45%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-success) 12%,var(--kardia-card))] text-[color:var(--kardia-success)]',
  warning:
    'border-[color:color-mix(in_srgb,var(--kardia-warning) 45%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-warning) 12%,var(--kardia-card))] text-[color:var(--kardia-warning)]',
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
  const handleStatusClick = () => (isConnected ? onToggleDrawer() : onRequestApiKeyModal())

  return (
    <header className="border-b border-[color:color-mix(in_srgb,var(--kardia-border) 80%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-surface) 85%,var(--kardia-bg))]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--kardia-gold) 75%,#fef9f0)] text-lg font-semibold text-[color:#1b1206] shadow-[0_25px_80px_-50px_rgba(0,0,0,0.8)]">
            K
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--kardia-gold)]">
              Kardia Research · Scholarly Pipeline
            </span>
            <div>
              <h1 className="type-section-title">Category Generator</h1>
              <p className="text-sm text-[color:var(--kardia-muted)]">
                Second Temple theological categories for the open-source lexicon
              </p>
            </div>
            <Badge variant="secondary" density="compact" className="uppercase tracking-[0.25em] text-[color:var(--kardia-muted)]">
              Phase 1 · Design System
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            aria-pressed={isConnected}
            aria-label={pillText}
            onClick={handleStatusClick}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] transition shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
              toneClasses[statusTone],
            )}
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                isConnected ? 'bg-[color:var(--kardia-success)]' : 'bg-[color:var(--kardia-warning)]',
              )}
              aria-hidden="true"
            />
            {pillText}
          </button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            aria-label="Open API settings drawer"
            onClick={onToggleDrawer}
            className="gap-2 text-[color:var(--kardia-text)]"
          >
            <Settings2 className="size-4" /> Manage Keys
          </Button>
        </div>
      </div>
    </header>
  )
}
