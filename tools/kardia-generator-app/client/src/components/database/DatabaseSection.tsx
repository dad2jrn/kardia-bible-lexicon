import { type ChangeEvent, useMemo, useRef, useState } from 'react'
import { Database, Download, Upload } from 'lucide-react'

import type { CategoryEntry } from '@/types'
import type { ImportSummary } from '@/hooks/useEntries'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { KardiaCard } from '@/components/ui/kardia-card'
import { HelperText } from '@/components/ui/helper-text'
import { ApprovedEntry } from './ApprovedEntry'
import { buildExportPayload, extractEntriesFromData } from '@/lib/persistence'
import { cn } from '@/lib/utils'

export interface DatabaseSectionProps {
  entries: CategoryEntry[]
  loading: boolean
  error?: string | null
  totalCategories: number
  onDeleteEntry: (id: string) => Promise<void>
  onImportEntries: (entries: CategoryEntry[]) => Promise<ImportSummary>
  onCopyJson: (json: string) => void
  onGenerateVerses: (entry: CategoryEntry) => void
  onNotify?: (message: string) => void
}

interface ImportState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string | null
}

export function DatabaseSection({
  entries,
  loading,
  error,
  totalCategories,
  onDeleteEntry,
  onImportEntries,
  onCopyJson,
  onGenerateVerses,
  onNotify,
}: DatabaseSectionProps) {
  const [importState, setImportState] = useState<ImportState>({ status: 'idle', message: null })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.category_label.localeCompare(b.category_label)),
    [entries],
  )

  const handleExport = () => {
    const payload = buildExportPayload(entries, totalCategories)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'categories.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    onNotify?.('Exported categories.json with current approved entries.')
  }

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportState({ status: 'loading', message: 'Importing entries…' })
    try {
      const text = await file.text()
      const parsed = extractEntriesFromData(JSON.parse(text))
      const summary = await onImportEntries(parsed)
      setImportState({
        status: 'success',
        message: `Import complete — ${summary.success} succeeded, ${summary.failure} failed.`,
      })
    } catch (err) {
      setImportState({
        status: 'error',
        message: (err as Error).message ?? 'Unable to import file.',
      })
    } finally {
      event.target.value = ''
    }
  }

  return (
    <KardiaCard variant="surface" className="relative space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--kardia-text)]">
            <Database className="h-4 w-4 text-[color:var(--kardia-gold)]" />
            Approved Entries
          </div>
          <HelperText>
            {entries.length} entries saved · {totalCategories - entries.length} remaining
          </HelperText>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export categories.json
          </Button>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import categories.json
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="Import categories.json"
            onChange={handleImportChange}
          />
        </div>
      </div>

      {error && <p className="text-sm text-[color:var(--kardia-danger)]">Unable to load entries: {error}</p>}

      {importState.message && (
        <p
          className={cn(
            'text-sm',
            importState.status === 'error'
              ? 'text-[color:var(--kardia-danger)]'
              : 'text-[color:var(--kardia-success)]',
          )}
        >
          {importState.message}
        </p>
      )}

      {sortedEntries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--kardia-border) 60%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-card) 75%,var(--kardia-bg))] p-6 text-center text-sm text-[color:var(--kardia-muted)]">
          No approved entries yet. Approve a generated entry to populate SQLite.
        </p>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {sortedEntries.map(entry => (
            <ApprovedEntry
              key={entry.id}
              entry={entry}
              onDelete={onDeleteEntry}
              onCopyJson={onCopyJson}
              onGenerateVerses={onGenerateVerses}
              onNotify={onNotify}
            />
          ))}
        </Accordion>
      )}

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--kardia-overlay)] backdrop-blur">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--kardia-border)] border-t-[color:var(--kardia-gold)]" aria-label="Loading database" />
        </div>
      )}
    </KardiaCard>
  )
}
