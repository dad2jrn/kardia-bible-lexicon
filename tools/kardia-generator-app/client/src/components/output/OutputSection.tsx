import { useState } from 'react'

import type { CategoryEntry, KardiaVerse, ValidatorResult } from '@/types'
import type { ApprovalState } from '@/types/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JsonPanel } from './JsonPanel'
import { ValidatorPanel, type CorrectionsPayload } from './ValidatorPanel'
import { PreviewPanel } from './PreviewPanel'
import { RecoveryPanel } from './RecoveryPanel'
import { KardiaCard } from '@/components/ui/kardia-card'
import { HelperText } from '@/components/ui/helper-text'

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
  const activeTab = rawRecovery ? 'recovery' : tab

  if (!entry && !rawRecovery) {
    return (
      <KardiaCard variant="section" className="space-y-3 text-sm text-[color:var(--kardia-muted)]">
        <h3 className="type-card-title text-[color:var(--kardia-text)]">Output &amp; Validation</h3>
        <HelperText>
          Run a generation pass to see JSON, validator notes, the reader preview, or recovery helpers if parsing fails.
        </HelperText>
      </KardiaCard>
    )
  }

  return (
    <KardiaCard variant="section" className="p-5">
      <Tabs value={activeTab} onValueChange={setTab}>
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
    </KardiaCard>
  )
}
