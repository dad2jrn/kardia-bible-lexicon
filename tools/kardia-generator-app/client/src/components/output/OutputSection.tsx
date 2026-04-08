import { useEffect, useState } from 'react'

import type { CategoryEntry, KardiaVerse, ValidatorResult } from '@/types'
import type { ApprovalState } from '@/types/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JsonPanel } from './JsonPanel'
import { ValidatorPanel, type CorrectionsPayload } from './ValidatorPanel'
import { PreviewPanel } from './PreviewPanel'
import { RecoveryPanel } from './RecoveryPanel'

export interface OutputSectionProps {
  entry: CategoryEntry | null
  validator: ValidatorResult | null
  kardiaVerses: KardiaVerse[]
  rawRecovery: string | null
  isBusy: boolean
  onApprove: () => void
  approvalState: ApprovalState
  onCopyJson: (json: string) => void
  onRegenerate: () => void
  onRetryRecovery: () => void
  onRequestCorrections: (payload: CorrectionsPayload) => void | Promise<void>
}

export function OutputSection({
  entry,
  validator,
  kardiaVerses,
  rawRecovery,
  isBusy,
  onApprove,
  approvalState,
  onCopyJson,
  onRegenerate,
  onRetryRecovery,
  onRequestCorrections,
}: OutputSectionProps) {
  const [tab, setTab] = useState('json')

  useEffect(() => {
    if (rawRecovery) {
      setTab('recovery')
    } else if (entry) {
      setTab('json')
    }
  }, [rawRecovery, entry])

  if (!entry && !rawRecovery) {
    return (
      <section className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">Output &amp; Validation</h3>
        <p className="mt-2">
          Run a generation pass to see JSON, validator notes, the reader preview, or recovery helpers
          if parsing fails. All content from the legacy HTML tool appears here once generated.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="validator">Validator</TabsTrigger>
          <TabsTrigger value="preview">Reader Preview</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>
        <TabsContent value="json" className="mt-4">
          <JsonPanel
            entry={entry}
            isBusy={isBusy}
            onApprove={onApprove}
            approvalState={approvalState}
            onCopy={onCopyJson}
            onRegenerate={onRegenerate}
          />
        </TabsContent>
        <TabsContent value="validator" className="mt-4">
          <ValidatorPanel
            validator={validator}
            isBusy={isBusy}
            onRequestCorrections={onRequestCorrections}
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <PreviewPanel
            entry={entry}
            kardiaVerses={kardiaVerses}
          />
        </TabsContent>
        <TabsContent value="recovery" className="mt-4">
          <RecoveryPanel
            rawText={rawRecovery}
            onRetry={onRetryRecovery}
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}
