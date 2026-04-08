import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import type { ValidatorFlag, ValidatorResult } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ValidatorPanelProps {
  validator: ValidatorResult | null
  onRequestCorrections: (selectedFlags: number[]) => void
}

const overallCopy: Record<ValidatorResult['overall'], { label: string; tone: string }> = {
  clean: { label: 'Clean', tone: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100' },
  'minor-flags': {
    label: 'Minor Flags',
    tone: 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100',
  },
  'major-flags': {
    label: 'Major Flags',
    tone: 'bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100',
  },
}

const severityTone: Record<ValidatorFlag['severity'], string> = {
  minor: 'bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100',
  major: 'bg-rose-100 text-rose-900 dark:bg-rose-400/10 dark:text-rose-100',
}

export function ValidatorPanel({ validator, onRequestCorrections }: ValidatorPanelProps) {
  const [selectedFlags, setSelectedFlags] = useState<Set<number>>(new Set())

  useEffect(() => {
    setSelectedFlags(new Set())
  }, [validator])

  const flags = validator?.flags ?? []
  const queueCount = selectedFlags.size
  const allSelected = flags.length > 0 && queueCount === flags.length

  const toggleFlag = (flag: ValidatorFlag) => {
    setSelectedFlags(prev => {
      const next = new Set(prev)
      if (next.has(flag.flag_number)) {
        next.delete(flag.flag_number)
      } else {
        next.add(flag.flag_number)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFlags(new Set())
    } else {
      setSelectedFlags(new Set(flags.map(flag => flag.flag_number)))
    }
  }

  const badges = useMemo(() => {
    if (!validator) return null
    const copy = overallCopy[validator.overall]
    return (
      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', copy.tone)}>{copy.label}</span>
    )
  }, [validator])

  if (!validator) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Validator output will appear here after the first run.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {badges}
        <p className="text-sm text-muted-foreground">{validator.summary}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <button
          type="button"
          className="underline-offset-4 hover:underline"
          onClick={handleSelectAll}
        >
          {allSelected ? 'Clear flags' : 'Select all flags'}
        </button>
        <span>
          Queued corrections: <strong>{queueCount}</strong>
        </span>
      </div>

      <ul className="space-y-3">
        {flags.map(flag => (
          <li key={flag.flag_number} className="rounded-xl border p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={selectedFlags.has(flag.flag_number)}
                onChange={() => toggleFlag(flag)}
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', severityTone[flag.severity])}>
                    {flag.severity === 'major' ? 'Major' : 'Minor'}
                  </Badge>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Flag #{flag.flag_number} — {flag.location}
                  </span>
                </div>
                <p className="text-sm font-semibold">{flag.issue}</p>
                <p className="text-sm text-muted-foreground">{flag.correction}</p>
              </div>
            </label>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <AlertTriangle className="h-4 w-4" />
          Correction loop lands in Phase 8
        </div>
        <p className="text-sm text-muted-foreground">
          Selecting flags now cues the corrections summary so we can hand it directly to the next pass.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => onRequestCorrections(Array.from(selectedFlags))}
          aria-disabled="true"
        >
          Regenerate with Corrections
        </Button>
      </div>
    </div>
  )
}

