import { useCallback } from 'react'
import { Copy, RefreshCw } from 'lucide-react'

import type { CategoryEntry } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ApprovalState } from '@/types/ui'

export interface JsonPanelProps {
  entry: CategoryEntry | null
  isBusy: boolean
  onApprove: () => void
  approvalState: ApprovalState
  onCopy?: (json: string) => void
  onRegenerate: () => void
}

export function JsonPanel({
  entry,
  isBusy,
  onApprove,
  approvalState,
  onCopy,
  onRegenerate,
}: JsonPanelProps) {
  const json = entry ? JSON.stringify(entry, null, 2) : ''

  const copyJson = useCallback(async () => {
    if (!json) return
    try {
      await navigator.clipboard?.writeText(json)
    } catch {
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        window.prompt('Copy JSON manually', json)
      }
    }
    onCopy?.(json)
  }, [json, onCopy])

  if (!entry) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Generate a fresh entry to view the JSON output.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={onApprove}
          disabled={!entry || approvalState.status === 'saving'}
        >
          {approvalState.status === 'saving' ? 'Saving…' : 'Approve & Save'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={copyJson}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy JSON
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onRegenerate}
          disabled={isBusy}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate Fresh
        </Button>
        {entry._truncation_warning && (
          <Badge variant="destructive" className="text-xs">
            Possible truncation — inspect carefully
          </Badge>
        )}
      </div>
      {approvalState.message && (
        <p
          className={`text-sm ${
            approvalState.status === 'error' ? 'text-destructive' : 'text-emerald-600'
          }`}
        >
          {approvalState.message}
        </p>
      )}
      <ScrollArea className="h-[420px] rounded-xl border bg-muted/30 p-4">
        <pre className="text-sm leading-relaxed">{json}</pre>
      </ScrollArea>
    </div>
  )
}
