// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useApiKey } from './useApiKey'

const STORAGE_KEY = 'kardia_api_key'

function makeLocalStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  }
}

describe('useApiKey', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts empty when localStorage has no key', () => {
    const { result } = renderHook(() => useApiKey())
    expect(result.current.apiKey).toBe('')
    expect(result.current.isConnected).toBe(false)
    expect(result.current.maskedKey).toBe('')
  })

  it('reads the key from localStorage on first render', () => {
    localStorage.setItem(STORAGE_KEY, 'sk-ant-api01-testkey-abcd1234')
    const { result } = renderHook(() => useApiKey())
    expect(result.current.apiKey).toBe('sk-ant-api01-testkey-abcd1234')
    expect(result.current.isConnected).toBe(true)
  })

  // ── setApiKey ─────────────────────────────────────────────────────────────

  it('setApiKey writes to localStorage and updates state', () => {
    const { result } = renderHook(() => useApiKey())
    act(() => { result.current.setApiKey('sk-ant-api01-mykey-1234') })
    expect(result.current.apiKey).toBe('sk-ant-api01-mykey-1234')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('sk-ant-api01-mykey-1234')
  })

  it('setApiKey trims surrounding whitespace before saving', () => {
    const { result } = renderHook(() => useApiKey())
    act(() => { result.current.setApiKey('  sk-ant-api01-mykey-1234  ') })
    expect(result.current.apiKey).toBe('sk-ant-api01-mykey-1234')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('sk-ant-api01-mykey-1234')
  })

  it('setApiKey with empty string removes the key from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'sk-ant-api01-mykey-1234')
    const { result } = renderHook(() => useApiKey())
    act(() => { result.current.setApiKey('') })
    expect(result.current.apiKey).toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })

  it('setApiKey with whitespace-only string removes the key', () => {
    localStorage.setItem(STORAGE_KEY, 'sk-ant-api01-mykey-1234')
    const { result } = renderHook(() => useApiKey())
    act(() => { result.current.setApiKey('   ') })
    expect(result.current.apiKey).toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  // ── clearApiKey ───────────────────────────────────────────────────────────

  it('clearApiKey removes the key from localStorage and resets state', () => {
    localStorage.setItem(STORAGE_KEY, 'sk-ant-api01-mykey-1234')
    const { result } = renderHook(() => useApiKey())
    act(() => { result.current.clearApiKey() })
    expect(result.current.apiKey).toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.isConnected).toBe(false)
    expect(result.current.maskedKey).toBe('')
  })

  // ── isConnected ───────────────────────────────────────────────────────────

  describe('isConnected', () => {
    it('is true when the key starts with sk-ant-', () => {
      localStorage.setItem(STORAGE_KEY, 'sk-ant-api01-anything')
      const { result } = renderHook(() => useApiKey())
      expect(result.current.isConnected).toBe(true)
    })

    it('is false for a key without the sk-ant- prefix', () => {
      localStorage.setItem(STORAGE_KEY, 'sk-live-invalid-key')
      const { result } = renderHook(() => useApiKey())
      expect(result.current.isConnected).toBe(false)
    })

    it('is false for an empty key', () => {
      const { result } = renderHook(() => useApiKey())
      expect(result.current.isConnected).toBe(false)
    })

    it('updates reactively when setApiKey is called', () => {
      const { result } = renderHook(() => useApiKey())
      expect(result.current.isConnected).toBe(false)
      act(() => { result.current.setApiKey('sk-ant-api01-reactivetest-0000') })
      expect(result.current.isConnected).toBe(true)
      act(() => { result.current.clearApiKey() })
      expect(result.current.isConnected).toBe(false)
    })
  })

  // ── maskedKey ─────────────────────────────────────────────────────────────

  describe('maskedKey', () => {
    it('is empty string when no key is set', () => {
      const { result } = renderHook(() => useApiKey())
      expect(result.current.maskedKey).toBe('')
    })

    it('shows first 10 chars + •••• + last 4 for long keys', () => {
      // 'sk-ant-api' is exactly 10 chars; last 4 are '1234'
      localStorage.setItem(STORAGE_KEY, 'sk-ant-api01-mykey-1234')
      const { result } = renderHook(() => useApiKey())
      expect(result.current.maskedKey).toBe('sk-ant-api' + '••••' + '1234')
    })

    it('returns •••••••• for short keys (≤12 chars)', () => {
      localStorage.setItem(STORAGE_KEY, 'sk-short')
      const { result } = renderHook(() => useApiKey())
      expect(result.current.maskedKey).toBe('••••••••')
    })

    it('returns •••••••• for exactly 12-char keys', () => {
      localStorage.setItem(STORAGE_KEY, '123456789012')
      const { result } = renderHook(() => useApiKey())
      expect(result.current.maskedKey).toBe('••••••••')
    })

    it('updates reactively after setApiKey', () => {
      const { result } = renderHook(() => useApiKey())
      expect(result.current.maskedKey).toBe('')
      act(() => { result.current.setApiKey('sk-ant-api01-mykey-abcd') })
      expect(result.current.maskedKey).toBe('sk-ant-api' + '••••' + 'abcd')
    })
  })
})
