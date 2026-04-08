import { useState, useEffect, useCallback } from 'react'
import type { CategoryEntry, KardiaVerse } from '@/types'

export interface UseEntriesReturn {
  entries: CategoryEntry[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  approve: (entry: CategoryEntry) => Promise<void>
  updateEntry: (id: string, patch: EntryPatch) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
}

export interface EntryPatch {
  kardia_verses?: KardiaVerse[]
  status?: string
  reviewed_by?: string
  iterations?: number
  version?: string
  theological_notes?: string
  kardia_rendering?: string
  developmental_note?: string
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/entries${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res
}

export function useEntries(): UseEntriesReturn {
  const [entries, setEntries] = useState<CategoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('')
      const data = (await res.json()) as CategoryEntry[]
      setEntries(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const approve = useCallback(async (entry: CategoryEntry) => {
    const res = await apiFetch('', {
      method: 'POST',
      body: JSON.stringify(entry),
    })
    const { id } = (await res.json()) as { ok: boolean; id: string }
    // Optimistic: re-fetch to get the fully reconstructed row from the DB
    const refreshed = await apiFetch('')
    const data = (await refreshed.json()) as CategoryEntry[]
    setEntries(data)
    void id
  }, [])

  const updateEntry = useCallback(async (id: string, patch: EntryPatch) => {
    // Normalise kardia_verses field name — API expects kardia_verses, not _kardia_verses
    const body: Record<string, unknown> = { ...patch }
    await apiFetch(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    setEntries(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              ...(patch.kardia_verses !== undefined
                ? { _kardia_verses: patch.kardia_verses }
                : {}),
              ...Object.fromEntries(
                Object.entries(patch).filter(([k]) => k !== 'kardia_verses')
              ),
            }
          : e
      )
    )
  }, [])

  const deleteEntry = useCallback(async (id: string) => {
    await apiFetch(`/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return { entries, loading, error, refresh: fetchEntries, approve, updateEntry, deleteEntry }
}
