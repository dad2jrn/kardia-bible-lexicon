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
import { DEFAULT_MODEL_BY_PROVIDER, MODEL_META_BY_ID, type ModelId } from '@/constants/models'
import { CATEGORIES } from '@/constants/categories'
import { useApiKey } from '@/hooks/useApiKey'
import { useEntries } from '@/hooks/useEntries'
import { useGenerator } from '@/hooks/useGenerator'
import type { CategorySelection } from '@/types/category'
import type { CategoryEntry } from '@/types'
import type { ApprovalState } from '@/types/ui'
import type { CorrectionsPayload } from '@/components/output/ValidatorPanel'

function App() {
  const {
    anthropicKey,
    openaiKey,
    activeProvider,
    activeKey,
    isConnected,
    maskedActiveKey,
    setAnthropicKey,
    setOpenaiKey,
    setActiveProvider,
    clearAll,
  } = useApiKey()
  const hasAnyKey = Boolean(anthropicKey || openaiKey)
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
  const [isModalOpen, setModalOpen] = useState(() => !hasAnyKey)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    DEFAULT_MODEL_BY_PROVIDER[activeProvider],
  )
  const [approvalState, setApprovalState] = useState<ApprovalState>({ status: 'idle', message: null })
  const prevHasKeys = useRef(hasAnyKey)
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
    requestCorrections,
    resetOutputs,
  } = useGenerator()

  useEffect(() => {
    if (!hasAnyKey && prevHasKeys.current) {
      setModalOpen(true)
    }
    prevHasKeys.current = hasAnyKey
  }, [hasAnyKey])

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

  const providerLabel = activeProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'
  const apiStatus = useMemo(
    () =>
      isConnected
        ? {
            label: `${providerLabel} — Connected`,
            tone: 'success' as const,
          }
        : {
            label: 'Not Connected',
            tone: 'warning' as const,
          },
    [hasAnyKey, isConnected, providerLabel],
  )

  const handleSaveAnthropicKey = useCallback(
    (value: string) => {
      setAnthropicKey(value)
      setStatusMessage(value ? 'Anthropic key saved securely.' : 'Anthropic key cleared.')
    },
    [setAnthropicKey],
  )

  const handleSaveOpenaiKey = useCallback(
    (value: string) => {
      setOpenaiKey(value)
      setStatusMessage(value ? 'OpenAI key saved securely.' : 'OpenAI key cleared.')
    },
    [setOpenaiKey],
  )

  const handleClearAllKeys = useCallback(() => {
    clearAll()
    setStatusMessage('All API keys cleared.')
  }, [clearAll])

  const completedIds = useMemo(
    () => new Set(entries.map(entry => entry.id)),
    [entries],
  )

  const totalCategories = useMemo(
    () => Object.values(CATEGORIES).reduce((acc, group) => acc + group.length, 0),
    [],
  )

  const selectedModelMeta =
    MODEL_META_BY_ID[selectedModel] ?? MODEL_META_BY_ID[DEFAULT_MODEL_BY_PROVIDER[activeProvider]]

  useEffect(() => {
    setSelectedModel(DEFAULT_MODEL_BY_PROVIDER[activeProvider])
  }, [activeProvider])

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
    if (!selectedCategory || !activeKey) return
    void generateFresh(selectedCategory, selectedModel, activeKey, activeProvider)
  }, [activeKey, activeProvider, selectedCategory, selectedModel, generateFresh])

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

  const handleCorrections = useCallback(async (payload: CorrectionsPayload) => {
    if (!entry || !validator || !selectedCategory || !activeKey) {
      setStatusMessage('Generate an entry before running corrections.')
      return
    }

    if (!payload.combinedCorrections) {
      setStatusMessage('Add reviewer notes or select validator flags before regenerating.')
      return
    }

    const flagLabel =
      payload.queuedFlagCount > 0
        ? `${payload.queuedFlagCount} flag${payload.queuedFlagCount === 1 ? '' : 's'}`
        : 'reviewer notes'
    const noteSuffix = payload.manualNotes ? ' + reviewer notes' : ''
    setStatusMessage(`Regenerating with ${flagLabel}${noteSuffix}.`)

    try {
      await requestCorrections({ combinedCorrections: payload.combinedCorrections })
    } catch (err) {
      setStatusMessage((err as Error).message ?? 'Failed to run corrections.')
    }
  }, [activeKey, entry, validator, selectedCategory, requestCorrections])

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
        activeProvider={activeProvider}
        statusLabel={apiStatus.label}
        statusTone={apiStatus.tone}
        onToggleDrawer={() => setDrawerOpen(prev => !prev)}
        onRequestApiKeyModal={() => setModalOpen(true)}
      />

      <SettingsDrawer
        open={isDrawerOpen}
        anthropicKey={anthropicKey}
        openaiKey={openaiKey}
        maskedActiveKey={maskedActiveKey}
        isConnected={isConnected}
        activeProvider={activeProvider}
        onSaveAnthropic={handleSaveAnthropicKey}
        onSaveOpenai={handleSaveOpenaiKey}
        onSetActiveProvider={setActiveProvider}
        onClearAll={handleClearAllKeys}
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
              Choose a {providerLabel} model before running generation. Options update automatically when
              you switch providers.
            </p>
          </div>

          <ModelSelector
            provider={activeProvider}
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
        anthropicKey={anthropicKey}
        openaiKey={openaiKey}
        activeProvider={activeProvider}
        onClose={() => setModalOpen(false)}
        onSaveAnthropic={handleSaveAnthropicKey}
        onSaveOpenai={handleSaveOpenaiKey}
        onSelectProvider={setActiveProvider}
      />
    </div>
  )
}

export default App
