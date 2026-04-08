import { useState, useCallback } from 'react'

const STORAGE_KEY = 'kardia_api_key'

function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••'
  return key.slice(0, 10) + '••••' + key.slice(-4)
}

export interface UseApiKeyReturn {
  apiKey: string
  isConnected: boolean
  maskedKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export function useApiKey(): UseApiKeyReturn {
  const [apiKey, setApiKeyState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim()
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setApiKeyState(trimmed)
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState('')
  }, [])

  const isConnected = apiKey.startsWith('sk-ant-')
  const maskedKey = apiKey ? maskKey(apiKey) : ''

  return { apiKey, isConnected, maskedKey, setApiKey, clearApiKey }
}
