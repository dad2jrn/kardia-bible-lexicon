import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiKeyModal } from '@/components/ApiKeyModal'
import { CategoryGrid } from '@/components/CategoryGrid'
import { ModelSelector } from '@/components/ModelSelector'
import { GeneratePanel } from '@/components/GeneratePanel'
import { OutputSection } from '@/components/output/OutputSection'
import { ProgressSection } from '@/components/ProgressSection'
import { DatabaseSection } from '@/components/database/DatabaseSection'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MODEL_OPTIONS, type ModelId } from '@/constants/models'
import { CATEGORIES } from '@/constants/categories'
import { useApiKey } from '@/hooks/useApiKey'
import { useEntries } from '@/hooks/useEntries'
import { useGenerator } from '@/hooks/useGenerator'
import type { CategorySelection } from '@/types/category'
import type { CategoryEntry } from '@/types'
import type { ApprovalState } from '@/types/ui'

function App() {
  const { apiKey, maskedKey, isConnected, setApiKey, clearApiKey } = useApiKey()
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    refresh: refreshEntries,
    approve,
    deleteEntry,
    importEntries,
  } = useEntries()
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [isModalOpen, setModalOpen] = useState(() => !apiKey)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-sonnet-4-6')
  const [approvalState, setApprovalState] = useState<ApprovalState>({ status: 'idle', message: null })
  const prevKey = useRef(apiKey)
  const prevCategoryId = useRef<string | null>(null)
  const {
    entry,
    validator,
    kardiaVerses,
    rawRecovery,
    iteration,
    status: generatorStatus,
    isBusy: generatorBusy,
    error: generatorError,
    generateFresh,
    regenerateWithSameParams,
    retryAfterFailure,
    abortInFlight,
    resetOutputs,
  } = useGenerator()

  useEffect(() => {
    if (isConnected) {
      setModalOpen(false)
    }
  }, [isConnected])

  useEffect(() => {
    if (!apiKey && prevKey.current) {
      setModalOpen(true)
    }
    prevKey.current = apiKey
  }, [apiKey])

  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [statusMessage])

  useEffect(() => {
    if (!isDrawerOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isDrawerOpen])

  const apiStatus = useMemo(
    () =>
      isConnected
        ? {
            label: 'API Connected',
            tone: 'success' as const,
            tooltip: 'Anthropic key saved locally',
          }
        : {
            label: 'Connect API key',
            tone: 'warning' as const,
            tooltip: 'Add a valid Anthropic key to start generating entries',
          },
    [isConnected],
  )

  const handleSaveKey = useCallback(
    (value: string) => {
      setApiKey(value)
      setStatusMessage('API key saved securely.')
    },
    [setApiKey],
  )

  const handleClearKey = useCallback(() => {
    clearApiKey()
    setStatusMessage('API key cleared.')
  }, [clearApiKey])

  const completedIds = useMemo(
    () => new Set(entries.map(entry => entry.id)),
    [entries],
  )

  const totalCategories = useMemo(
    () => Object.values(CATEGORIES).reduce((acc, group) => acc + group.length, 0),
    [],
  )

  const selectedModelMeta = MODEL_OPTIONS.find(option => option.id === selectedModel) ?? MODEL_OPTIONS[0]

  useEffect(() => {
    if (!selectedCategory) {
      if (entry || rawRecovery) {
        resetOutputs()
      }
      prevCategoryId.current = null
      return
    }
    if (prevCategoryId.current && prevCategoryId.current !== selectedCategory.id) {
      resetOutputs()
    }
    prevCategoryId.current = selectedCategory.id
  }, [selectedCategory, resetOutputs, entry, rawRecovery])

  useEffect(() => {
    setApprovalState({ status: 'idle', message: null })
  }, [entry])

  const handleGenerate = useCallback(() => {
    if (!selectedCategory || !apiKey) return
    void generateFresh(selectedCategory, selectedModel, apiKey)
  }, [selectedCategory, selectedModel, apiKey, generateFresh])

  const handleCopyJson = useCallback((_json: string) => {
    setStatusMessage('JSON copied to clipboard.')
  }, [])

  const handleApprove = useCallback(async () => {
    if (!entry) return
    const label = entry.category_label
    const versesToPersist = kardiaVerses.length > 0 ? kardiaVerses : entry._kardia_verses ?? []
    const payload: CategoryEntry = {
      ...entry,
      _kardia_verses: versesToPersist,
    }
    setApprovalState({ status: 'saving', message: 'Saving entry…' })
    try {
      await approve(payload)
      setApprovalState({ status: 'success', message: `${label} saved to SQLite.` })
      setStatusMessage('Entry approved and saved.')
      setTimeout(() => {
        resetOutputs()
      }, 1000)
    } catch (err) {
      setApprovalState({
        status: 'error',
        message: (err as Error).message ?? 'Failed to save entry.',
      })
    }
  }, [approve, entry, kardiaVerses, resetOutputs])

  const handleCorrections = useCallback((flagIds: number[]) => {
    if (flagIds.length === 0) {
      setStatusMessage('Select validator flags before drafting corrections.')
      return
    }
    setStatusMessage('Corrections queued — Phase 8 will send them to Anthropic.')
  }, [])

  const handleDeleteEntry = useCallback(async (id: string) => {
    await deleteEntry(id)
    setStatusMessage('Entry removed from database.')
  }, [deleteEntry])

  const handleImportEntries = useCallback(async (incoming: CategoryEntry[]) => {
    const summary = await importEntries(incoming)
    setStatusMessage(`Import finished: ${summary.success} succeeded, ${summary.failure} failed.`)
    return summary
  }, [importEntries])

  const handleGenerateVerses = useCallback((approvedEntry: CategoryEntry) => {
    setStatusMessage(`Verse translation backfill for ${approvedEntry.category_label} arrives in Phase 9.`)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        isConnected={isConnected}
        statusLabel={apiStatus.label}
        statusTone={apiStatus.tone}
        onToggleDrawer={() => setDrawerOpen(prev => !prev)}
        onRequestApiKeyModal={() => setModalOpen(true)}
      />

      <SettingsDrawer
        open={isDrawerOpen}
        apiKey={apiKey}
        maskedKey={maskedKey}
        isConnected={isConnected}
        onSave={key => {
          handleSaveKey(key)
          setDrawerOpen(false)
        }}
        onClear={handleClearKey}
        onRequestModal={() => setModalOpen(true)}
      />

      {statusMessage && (
        <div className="bg-emerald-50 px-4 py-2 text-sm text-emerald-800 shadow-sm md:px-8">
          {statusMessage}
        </div>
      )}

      <main className="flex-1 space-y-6 px-4 py-8 md:px-8">
        <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Select Category
            </span>
            <p className="text-sm text-muted-foreground">
              Pick any Hebrew seed category to start a run. {completedIds.size} / {totalCategories} complete.
            </p>
          </div>

          <CategoryGrid
            groups={CATEGORIES}
            selectedId={selectedCategory?.id ?? null}
            completedIds={completedIds}
            disabled={!isConnected}
            loading={entriesLoading}
            error={entriesError}
            onRetry={refreshEntries}
            onSelect={selection =>
              setSelectedCategory(prev => (prev?.id === selection.id ? null : selection))
            }
          />

          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Selected</span>
            <span className="font-medium">
              {selectedCategory ? `${selectedCategory.label} (${selectedCategory.group})` : 'No category selected'}
            </span>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Model & Generation
            </span>
            <p className="text-sm text-muted-foreground">
              Choose an Anthropic model before running generation. Pricing estimates mirror the legacy tool.
            </p>
          </div>

          <ModelSelector
            value={selectedModel}
            onChange={model => setSelectedModel(model)}
            disabled={!isConnected}
          />

          <p className="text-sm text-muted-foreground">
            Currently using <strong className="font-semibold">{selectedModelMeta.label}</strong> ({selectedModelMeta.costHint})
          </p>

          <GeneratePanel
            selectedCategory={selectedCategory}
            selectedModelLabel={selectedModelMeta.label}
            isConnected={isConnected}
            status={generatorStatus}
            iteration={iteration}
            isBusy={generatorBusy}
            error={generatorError}
            onGenerate={handleGenerate}
            onAbort={abortInFlight}
            onRetry={regenerateWithSameParams}
          />
        </section>

        <OutputSection
          entry={entry}
          validator={validator}
          kardiaVerses={kardiaVerses}
          rawRecovery={rawRecovery}
          isBusy={generatorBusy}
          onApprove={handleApprove}
          approvalState={approvalState}
          onCopyJson={handleCopyJson}
          onRegenerate={regenerateWithSameParams}
          onRetryRecovery={retryAfterFailure}
          onRequestCorrections={handleCorrections}
        />

        <ProgressSection
          groups={CATEGORIES}
          completedIds={completedIds}
          loading={entriesLoading}
        />

        <DatabaseSection
          entries={entries}
          loading={entriesLoading}
          error={entriesError}
          totalCategories={totalCategories}
          onDeleteEntry={handleDeleteEntry}
          onImportEntries={handleImportEntries}
          onCopyJson={handleCopyJson}
          onGenerateVerses={handleGenerateVerses}
          onNotify={setStatusMessage}
        />
      </main>

      <Footer />

      <ApiKeyModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveKey}
      />
    </div>
  )
}

export default App
