import { useEffect, useMemo, useState } from 'react'

import type { ValidatorFlag, ValidatorResult } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface ValidatorPanelProps {
  validator: ValidatorResult | null
  isBusy: boolean
  onRequestCorrections: (payload: CorrectionsPayload) => void | Promise<void>
}

export interface CorrectionsPayload {
  combinedCorrections: string
  autoCorrections: string
  manualNotes: string
  queuedFlagCount: number
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

export function ValidatorPanel({ validator, isBusy, onRequestCorrections }: ValidatorPanelProps) {
  const [selectedFlags, setSelectedFlags] = useState<Set<number>>(new Set())
  const [manualNotes, setManualNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSelectedFlags(new Set())
    setManualNotes('')
    setIsSubmitting(false)
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

  const selectedFlagObjects = useMemo(() => {
    return flags.filter(flag => selectedFlags.has(flag.flag_number))
  }, [flags, selectedFlags])

  const autoCorrectionsText = selectedFlagObjects
    .map(flag => {
      return `Flag ${flag.flag_number} (${flag.location}) — ${flag.point}:\n  Issue: ${flag.issue}\n  Apply this fix: ${flag.correction}`
    })
    .join('\n\n')

  const autoSection = selectedFlagObjects.length
    ? `AUTO-QUEUED FLAG CORRECTIONS (${selectedFlagObjects.length} flag${selectedFlagObjects.length === 1 ? '' : 's'}):\n${autoCorrectionsText}`
    : ''

  const trimmedManual = manualNotes.trim()
  const manualSection = trimmedManual ? `ADDITIONAL REVIEWER NOTES:\n${trimmedManual}` : ''
  const combinedCorrections = [autoSection, manualSection].filter(Boolean).join('\n\n---\n\n')
  const canSubmit = Boolean(combinedCorrections) && !isBusy && !isSubmitting

  if (!validator) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Validator output will appear here after the first run.
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!combinedCorrections) return
    setIsSubmitting(true)
    try {
      await onRequestCorrections({
        combinedCorrections,
        autoCorrections: autoSection,
        manualNotes: trimmedManual,
        queuedFlagCount: selectedFlagObjects.length,
      })
    } finally {
      setIsSubmitting(false)
    }
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

      <div className="space-y-3 rounded-2xl border border-dashed bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Correction Instructions
          </span>
          <Badge variant="outline" className="text-xs">
            {selectedFlagObjects.length} flag{selectedFlagObjects.length === 1 ? '' : 's'} queued
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Check flags above to auto-queue their fixes. Add reviewer overrides below. Both sections are merged and
          sent directly back to Anthropic for the correction pass.
        </p>
        <div className="rounded-xl bg-background/80 p-3 text-xs text-muted-foreground">
          <strong>Examples:</strong>
          <br />
          "Flag 2 — reduce the Augustinian description to one sentence then pivot into covenantal framing."
          <br />
          "Flag 5 — remove 'faithless generation', reframe Qumran as priestly-purity community."
          <br />
          "The one_liner should emphasize chesed as covenant interior life, not voluntary beneficence."
        </div>
        <Textarea
          value={manualNotes}
          onChange={event => setManualNotes(event.target.value)}
          placeholder="Describe the corrections needed..."
          rows={5}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isBusy || isSubmitting ? 'Regenerating…' : 'Regenerate with Corrections'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setManualNotes('')}
            disabled={!manualNotes}
          >
            Clear Notes
          </Button>
        </div>
      </div>
    </div>
  )
}
