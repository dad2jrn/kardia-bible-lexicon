import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiKeyModal } from '@/components/ApiKeyModal'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useApiKey } from '@/hooks/useApiKey'

const placeholderSections = [
  { title: 'Select Category', copy: 'Category grid coming in Phase 5.' },
  { title: 'Model & Generation', copy: 'Model selector + status panel coming in Phase 5.' },
  {
    title: 'Output & Validation',
    copy: 'Generation output, validator report, and reader preview arrive in Phase 6.',
  },
]

function App() {
  const { apiKey, maskedKey, isConnected, setApiKey, clearApiKey } = useApiKey()
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [isModalOpen, setModalOpen] = useState(() => !apiKey)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const prevKey = useRef(apiKey)

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
        {placeholderSections.map(section => (
          <section key={section.title} className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Coming soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{section.copy}</p>
          </section>
        ))}
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
