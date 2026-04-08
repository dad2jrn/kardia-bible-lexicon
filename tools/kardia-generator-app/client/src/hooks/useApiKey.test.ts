// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useApiKey } from './useApiKey'

const ANTH_KEY = 'kardia_api_key'
const OPENAI_KEY = 'kardia_openai_key'
const PROVIDER_KEY = 'kardia_active_provider'

function makeStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    },
  }
}

describe('useApiKey', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('initializes empty when no keys exist', () => {
    const { result } = renderHook(() => useApiKey())
    expect(result.current.anthropicKey).toBe('')
    expect(result.current.openaiKey).toBe('')
    expect(result.current.activeProvider).toBe('anthropic')
    expect(result.current.activeKey).toBe('')
    expect(result.current.isConnected).toBe(false)
    expect(result.current.maskedActiveKey).toBe('')
  })

  it('reads stored values and derives active key from provider', () => {
    localStorage.setItem(ANTH_KEY, 'sk-ant-existing-1234')
    localStorage.setItem(OPENAI_KEY, 'sk-openai-existing-0001')
    localStorage.setItem(PROVIDER_KEY, 'openai')

    const { result } = renderHook(() => useApiKey())
    expect(result.current.anthropicKey).toBe('sk-ant-existing-1234')
    expect(result.current.openaiKey).toBe('sk-openai-existing-0001')
    expect(result.current.activeProvider).toBe('openai')
    expect(result.current.activeKey).toBe('sk-openai-existing-0001')
    expect(result.current.isConnected).toBe(true)
    expect(result.current.maskedActiveKey.endsWith('0001')).toBe(true)
  })

  it('setAnthropicKey trims values and clears when empty', () => {
    const { result } = renderHook(() => useApiKey())
    act(() => {
      result.current.setAnthropicKey('  sk-ant-fresh-0002  ')
    })
    expect(result.current.anthropicKey).toBe('sk-ant-fresh-0002')
    expect(localStorage.getItem(ANTH_KEY)).toBe('sk-ant-fresh-0002')
    expect(result.current.activeKey).toBe('sk-ant-fresh-0002')
    expect(result.current.isConnected).toBe(true)

    act(() => {
      result.current.setAnthropicKey('')
    })
    expect(result.current.anthropicKey).toBe('')
    expect(localStorage.getItem(ANTH_KEY)).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })

  it('setOpenaiKey updates state and respects active provider', () => {
    const { result } = renderHook(() => useApiKey())
    act(() => {
      result.current.setOpenaiKey('  sk-openai-abc  ')
    })
    expect(result.current.openaiKey).toBe('sk-openai-abc')
    expect(localStorage.getItem(OPENAI_KEY)).toBe('sk-openai-abc')
    expect(result.current.isConnected).toBe(false)

    act(() => {
      result.current.setActiveProvider('openai')
    })
    expect(result.current.activeProvider).toBe('openai')
    expect(result.current.activeKey).toBe('sk-openai-abc')
    expect(result.current.isConnected).toBe(true)
  })

  it('setActiveProvider switches without deleting stored keys', () => {
    localStorage.setItem(ANTH_KEY, 'sk-ant-123')
    localStorage.setItem(OPENAI_KEY, 'sk-openai-789')
    const { result } = renderHook(() => useApiKey())

    expect(result.current.activeKey).toBe('sk-ant-123')
    act(() => {
      result.current.setActiveProvider('openai')
    })
    expect(result.current.activeKey).toBe('sk-openai-789')
    expect(result.current.isConnected).toBe(true)
  })

  it('clearAll removes keys and resets provider', () => {
    localStorage.setItem(ANTH_KEY, 'sk-ant-123')
    localStorage.setItem(OPENAI_KEY, 'sk-openai-789')
    localStorage.setItem(PROVIDER_KEY, 'openai')
    const { result } = renderHook(() => useApiKey())

    act(() => {
      result.current.clearAll()
    })
    expect(localStorage.getItem(ANTH_KEY)).toBeNull()
    expect(localStorage.getItem(OPENAI_KEY)).toBeNull()
    expect(localStorage.getItem(PROVIDER_KEY)).toBeNull()
    expect(result.current.activeProvider).toBe('anthropic')
    expect(result.current.isConnected).toBe(false)
  })

  it('migrates legacy anthropic key by seeding provider default', () => {
    localStorage.setItem(ANTH_KEY, 'sk-ant-legacy')
    const { result } = renderHook(() => useApiKey())
    expect(result.current.anthropicKey).toBe('sk-ant-legacy')
    expect(localStorage.getItem(PROVIDER_KEY)).toBe('anthropic')
  })
})
