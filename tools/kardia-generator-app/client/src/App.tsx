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
import { KardiaCard } from '@/components/ui/kardia-card'
import { HelperText } from '@/components/ui/helper-text'
import { StatusBadge } from '@/components/ui/status-badge'
import { DEFAULT_MODEL_BY_PROVIDER, MODEL_META_BY_ID, type ModelId } from '@/constants/models'
import { CATEGORIES } from '@/constants/categories'
import { useApiKey } from '@/hooks/useApiKey'
import { useEntries } from '@/hooks/useEntries'
import { useGenerator } from '@/hooks/useGenerator'
import { cn } from '@/lib/utils'
import type { CategorySelection } from '@/types/category'
import type { CategoryEntry } from '@/types'
import type { ApprovalState } from '@/types/ui'
import type { CorrectionsPayload } from '@/components/output/ValidatorPanel'
import { DesignSystemPage } from '@/pages/DesignSystem'

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
    [isConnected, providerLabel],
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

  const handleCopyJson = useCallback(() => {
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

  const shouldShowDesignSystem =
    typeof window !== 'undefined' && window.location.pathname.includes('design-system')
  if (shouldShowDesignSystem) {
    return <DesignSystemPage />
  }

  const workflowNav = [
    {
      id: 'category',
      label: 'Category Library',
      description: 'Browse theological roots and see completion state.',
      meta: `${completedIds.size}/${totalCategories}`,
    },
    {
      id: 'models',
      label: 'Model Strategy',
      description: `Active provider: ${providerLabel}.`,
      meta: selectedModelMeta.label,
    },
    {
      id: 'workflow',
      label: 'Generation Workflow',
      description: 'Readiness checklist + generation controls.',
      meta: generatorStatus.label,
    },
    {
      id: 'outputs',
      label: 'Outputs & QA',
      description: 'JSON, validator flags, reader preview.',
      meta: entry ? 'Entry ready' : 'Awaiting run',
    },
    {
      id: 'database',
      label: 'SQLite Archive',
      description: 'Approved entries and import/export.',
      meta: `${entries.length} saved`,
    },
  ]

  const readinessItems = [
    { label: 'Provider connected', complete: isConnected },
    { label: 'Category selected', complete: Boolean(selectedCategory) },
    { label: 'Model selected', complete: Boolean(selectedModel) },
  ]

  const generatorHeadline = generatorBusy
    ? 'Generation in progress'
    : entry
      ? 'Entry ready for approval'
      : 'Awaiting generation'

  const generatorSubhead = generatorStatus.label

  return (
    <div className="min-h-screen bg-[color:var(--kardia-bg)] text-foreground">
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

      <div className="px-4 pb-12 pt-8 md:px-8">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          {statusMessage && (
            <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--kardia-success) 40%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-success) 12%,var(--kardia-card))] px-6 py-4 text-sm text-[color:var(--kardia-success)] shadow-[0_15px_35px_-25px_rgba(0,0,0,0.7)]">
              {statusMessage}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_320px]">
            <aside className="space-y-4" aria-label="Primary navigation">
              <KardiaCard className="space-y-4" variant="section">
                <div className="space-y-1">
                  <p className="type-meta text-[color:var(--kardia-gold)]">Session</p>
                  <h3 className="type-card-title">{providerLabel} workspace</h3>
                  <HelperText>
                    {isConnected ? 'Keys stored locally via secure storage.' : 'Connect a provider key to start generation.'}
                  </HelperText>
                </div>
                <div className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--kardia-border) 60%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-card) 80%,var(--kardia-bg))] px-4 py-3 text-sm">
                  <div className="flex items-center justify-between text-[color:var(--kardia-muted)]">
                    <span>Approved entries</span>
                    <span className="font-semibold text-[color:var(--kardia-text)]">{entries.length}</span>
                  </div>
                  <p className="text-xs text-[color:var(--kardia-muted)]">{totalCategories - entries.length} remaining</p>
                </div>
                <a
                  href="/design-system"
                  className="text-sm font-semibold text-[color:var(--kardia-gold)] underline-offset-4 hover:underline"
                >
                  View design reference →
                </a>
              </KardiaCard>

              <KardiaCard className="space-y-4" variant="surface">
                <p className="type-meta text-[color:var(--kardia-gold)]">Workflow map</p>
                <nav className="space-y-2">
                  {workflowNav.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-2xl border border-transparent bg-[color:color-mix(in_srgb,var(--kardia-card) 85%,var(--kardia-bg))] px-4 py-3 transition hover:border-[color:var(--kardia-gold)]"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{item.label}</span>
                        <span className="text-xs text-[color:var(--kardia-muted)]">{item.meta}</span>
                      </div>
                      <p className="text-xs text-[color:var(--kardia-muted)]">{item.description}</p>
                    </a>
                  ))}
                </nav>
              </KardiaCard>
            </aside>

            <div className="space-y-6">
              <KardiaCard id="category" className="space-y-4" variant="section">
                <div className="space-y-1">
                  <p className="type-meta text-[color:var(--kardia-gold)]">Select category</p>
                  <h2 className="type-card-title">Curated theological roots</h2>
                  <HelperText>
                    Pick any Hebrew seed category to start a run. {completedIds.size} / {totalCategories} complete.
                  </HelperText>
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

                <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--kardia-border) 70%,transparent)] px-4 py-2 text-sm text-[color:var(--kardia-muted)]">
                  <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--kardia-muted)]">Selected</span>
                  <span className="font-medium text-[color:var(--kardia-text)]">
                    {selectedCategory ? `${selectedCategory.label} (${selectedCategory.group})` : 'No category selected'}
                  </span>
                </div>
              </KardiaCard>

              <KardiaCard id="models" className="space-y-5" variant="section">
                <div className="space-y-1">
                  <p className="type-meta text-[color:var(--kardia-gold)]">Model strategy</p>
                  <h2 className="type-card-title">{providerLabel} models</h2>
                  <HelperText>Choose a model before generation. Options update automatically by provider.</HelperText>
                </div>

                <ModelSelector
                  provider={activeProvider}
                  value={selectedModel}
                  onChange={model => setSelectedModel(model)}
                  disabled={!isConnected}
                />

                <p className="text-sm text-[color:var(--kardia-muted)]">
                  Currently using <span className="font-semibold text-[color:var(--kardia-text)]">{selectedModelMeta.label}</span> ({selectedModelMeta.costHint})
                </p>
              </KardiaCard>

              <KardiaCard id="workflow" className="space-y-5" variant="section">
                <div className="space-y-1">
                  <p className="type-meta text-[color:var(--kardia-gold)]">Generation workflow</p>
                  <h2 className="type-card-title">Prepare and run</h2>
                  <HelperText>Confirm readiness, then launch a generation pass. Abort or retry without leaving this panel.</HelperText>
                </div>

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
              </KardiaCard>

              <div id="outputs">
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
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ProgressSection
                  groups={CATEGORIES}
                  completedIds={completedIds}
                  loading={entriesLoading}
                />

                <div id="database" className="lg:col-span-2">
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
                </div>
              </div>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-8" aria-label="Status summary">
              <KardiaCard className="space-y-2" variant="surface">
                <p className="type-meta text-[color:var(--kardia-gold)]">Selected category</p>
                {selectedCategory ? (
                  <>
                    <h3 className="type-card-title">{selectedCategory.label}</h3>
                    <HelperText>{selectedCategory.group}</HelperText>
                  </>
                ) : (
                  <HelperText>Select a category from the library to see the summary.</HelperText>
                )}
              </KardiaCard>

              <KardiaCard className="space-y-4" variant="surface">
                <p className="type-meta text-[color:var(--kardia-gold)]">Readiness checklist</p>
                <ul className="space-y-3">
                  {readinessItems.map(item => (
                    <li key={item.label} className="flex items-center gap-3 text-sm">
                      <span
                        className={cn(
                          'inline-flex size-5 items-center justify-center rounded-full border',
                          item.complete
                            ? 'border-transparent bg-[color:var(--kardia-success)] text-[color:#041b12]'
                            : 'border-[color:color-mix(in_srgb,var(--kardia-border) 70%,transparent)] text-[color:var(--kardia-muted)]',
                        )}
                      >
                        {item.complete ? '✓' : ''}
                      </span>
                      <span className={cn(item.complete ? 'text-[color:var(--kardia-text)]' : 'text-[color:var(--kardia-muted)]')}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </KardiaCard>

              <KardiaCard className="space-y-3" variant="surface">
                <p className="type-meta text-[color:var(--kardia-gold)]">Generation status</p>
                <h3 className="type-card-title">{generatorHeadline}</h3>
                <StatusBadge label={generatorSubhead} tone={generatorBusy ? 'warning' : 'info'} />
                <HelperText>
                  {isConnected
                    ? 'Outputs reset automatically when you change the selected category.'
                    : 'Reconnect API keys to resume generation.'}
                </HelperText>
              </KardiaCard>
            </aside>
          </div>
        </div>
      </div>

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
