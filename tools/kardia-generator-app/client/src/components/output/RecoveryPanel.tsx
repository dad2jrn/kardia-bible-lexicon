import { useCallback } from 'react'
import { ClipboardList, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface RecoveryPanelProps {
  rawText: string | null
  onRetry: () => void
}

export function RecoveryPanel({ rawText, onRetry }: RecoveryPanelProps) {
  const copyRaw = useCallback(async () => {
    if (!rawText) return
    try {
      await navigator.clipboard?.writeText(rawText)
    } catch {
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        window.prompt('Copy raw output manually', rawText)
      }
    }
  }, [rawText])

  if (!rawText) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        There is no recovery data yet — generate a new entry to populate this section.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        JSON parsing failed. Copy the raw output below before retrying so you do not lose content.
      </div>
      <ScrollArea className="h-[360px] rounded-xl border bg-muted/30 p-4 text-sm">
        <pre className="whitespace-pre-wrap">{rawText}</pre>
      </ScrollArea>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={copyRaw}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          Copy Raw
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
        >
          <Undo2 className="mr-2 h-4 w-4" />
          Retry last run
        </Button>
      </div>
    </div>
  )
}

