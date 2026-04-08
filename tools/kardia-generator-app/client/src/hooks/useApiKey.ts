import { useCallback, useMemo, useState } from 'react'

import type { ApiKeyStore, ApiProvider } from '@/types'

const ANTHROPIC_KEY_STORAGE = 'kardia_api_key'
const OPENAI_KEY_STORAGE = 'kardia_openai_key'
const ACTIVE_PROVIDER_STORAGE = 'kardia_active_provider'
const DEFAULT_PROVIDER: ApiProvider = 'anthropic'

function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••'
  return key.slice(0, 10) + '••••' + key.slice(-4)
}

function readInitialStore(): ApiKeyStore {
  const anthropicKey = localStorage.getItem(ANTHROPIC_KEY_STORAGE) ?? ''
  const openaiKey = localStorage.getItem(OPENAI_KEY_STORAGE) ?? ''
  const storedProvider = localStorage.getItem(ACTIVE_PROVIDER_STORAGE) as ApiProvider | null

  if (!storedProvider) {
    const fallback: ApiProvider = anthropicKey ? 'anthropic' : openaiKey ? 'openai' : DEFAULT_PROVIDER
    localStorage.setItem(ACTIVE_PROVIDER_STORAGE, fallback)
    return { anthropicKey, openaiKey, activeProvider: fallback }
  }

  const activeProvider: ApiProvider = storedProvider === 'openai' ? 'openai' : DEFAULT_PROVIDER
  return { anthropicKey, openaiKey, activeProvider }
}

export interface UseApiKeyReturn extends ApiKeyStore {
  activeKey: string
  isConnected: boolean
  maskedActiveKey: string
  setAnthropicKey: (key: string) => void
  setOpenaiKey: (key: string) => void
  setActiveProvider: (provider: ApiProvider) => void
  clearAll: () => void
}

export function useApiKey(): UseApiKeyReturn {
  const [store, setStore] = useState<ApiKeyStore>(() => readInitialStore())

  const setAnthropicKey = useCallback((key: string) => {
    const trimmed = key.trim()
    if (trimmed) {
      localStorage.setItem(ANTHROPIC_KEY_STORAGE, trimmed)
    } else {
      localStorage.removeItem(ANTHROPIC_KEY_STORAGE)
    }
    setStore(prev => ({ ...prev, anthropicKey: trimmed }))
  }, [])

  const setOpenaiKey = useCallback((key: string) => {
    const trimmed = key.trim()
    if (trimmed) {
      localStorage.setItem(OPENAI_KEY_STORAGE, trimmed)
    } else {
      localStorage.removeItem(OPENAI_KEY_STORAGE)
    }
    setStore(prev => ({ ...prev, openaiKey: trimmed }))
  }, [])

  const setActiveProvider = useCallback((provider: ApiProvider) => {
    const nextProvider: ApiProvider = provider === 'openai' ? 'openai' : DEFAULT_PROVIDER
    localStorage.setItem(ACTIVE_PROVIDER_STORAGE, nextProvider)
    setStore(prev => ({ ...prev, activeProvider: nextProvider }))
  }, [])

  const clearAll = useCallback(() => {
    localStorage.removeItem(ANTHROPIC_KEY_STORAGE)
    localStorage.removeItem(OPENAI_KEY_STORAGE)
    localStorage.removeItem(ACTIVE_PROVIDER_STORAGE)
    setStore({ anthropicKey: '', openaiKey: '', activeProvider: DEFAULT_PROVIDER })
  }, [])

  const activeKey = useMemo(
    () => (store.activeProvider === 'anthropic' ? store.anthropicKey : store.openaiKey),
    [store.activeProvider, store.anthropicKey, store.openaiKey],
  )
  const isConnected = activeKey.length > 0
  const maskedActiveKey = activeKey ? maskKey(activeKey) : ''

  return {
    ...store,
    activeKey,
    isConnected,
    maskedActiveKey,
    setAnthropicKey,
    setOpenaiKey,
    setActiveProvider,
    clearAll,
  }
}
