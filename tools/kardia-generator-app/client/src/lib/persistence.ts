import type { CategoryEntry } from '@/types'

export interface CategoriesExportPayload {
  version: string
  description: string
  license: string
  project: string
  generated: string
  status: {
    total_seed_categories: number
    complete: number
    pending: number
  }
  entries: CategoryEntry[]
}

const EXPORT_DESCRIPTION =
  'Kardia Lexicon — Hebrew thought category database. One entry per Hebrew thought category. The Hebrew category is always primary. Greek is the vehicle. Hebrew is the thought.'

function cloneEntry(entry: CategoryEntry): CategoryEntry {
  const { _truncation_warning, ...rest } = entry
  const cloned = JSON.parse(JSON.stringify(rest)) as CategoryEntry
  if (!cloned._kardia_verses) {
    cloned._kardia_verses = entry._kardia_verses ?? []
  }
  if ((cloned as Record<string, unknown>)._truncation_warning !== undefined) {
    delete (cloned as Record<string, unknown>)._truncation_warning
  }
  return cloned
}

export function buildExportPayload(
  entries: CategoryEntry[],
  totalSeedCategories: number,
): CategoriesExportPayload {
  const sanitized = entries.map(entry => cloneEntry(entry))
  const complete = sanitized.length
  const pending = Math.max(totalSeedCategories - complete, 0)
  return {
    version: '1.0',
    description: EXPORT_DESCRIPTION,
    license: 'CC BY-NC-SA 4.0',
    project: 'https://github.com/dad2jrn/kardia-bible-lexicon',
    generated: new Date().toISOString(),
    status: {
      total_seed_categories: totalSeedCategories,
      complete,
      pending,
    },
    entries: sanitized,
  }
}

export function extractEntriesFromData(data: unknown): CategoryEntry[] {
  if (!data) {
    throw new Error('File is empty.')
  }
  if (Array.isArray(data)) {
    return data as CategoryEntry[]
  }
  if (typeof data === 'object' && 'entries' in (data as Record<string, unknown>)) {
    const entries = (data as { entries?: unknown }).entries
    if (Array.isArray(entries)) {
      return entries as CategoryEntry[]
    }
  }
  throw new Error('Invalid categories file — could not find entries array.')
}
