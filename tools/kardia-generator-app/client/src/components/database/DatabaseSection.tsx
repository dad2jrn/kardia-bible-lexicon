import { type ChangeEvent, useMemo, useRef, useState } from 'react'
import { Database, Download, Upload } from 'lucide-react'

import type { CategoryEntry } from '@/types'
import type { ImportSummary } from '@/hooks/useEntries'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { ApprovedEntry } from './ApprovedEntry'
import { buildExportPayload, extractEntriesFromData } from '@/lib/persistence'

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
    <section className="relative rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-primary" />
            Approved Entries
          </div>
          <p className="text-xs text-muted-foreground">
            {entries.length} entries saved · {totalCategories - entries.length} remaining
          </p>
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

      {error && <p className="mt-3 text-sm text-destructive">Unable to load entries: {error}</p>}

      {importState.message && (
        <p
          className={`mt-3 text-sm ${
            importState.status === 'error'
              ? 'text-destructive'
              : 'text-emerald-600'
          }`}
        >
          {importState.message}
        </p>
      )}

      {sortedEntries.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No approved entries yet. Approve a generated entry to populate SQLite.
        </p>
      ) : (
        <Accordion type="multiple" className="mt-6 space-y-4">
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" aria-label="Loading database" />
        </div>
      )}
    </section>
  )
}
