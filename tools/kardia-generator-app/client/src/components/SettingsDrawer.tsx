import { FormEvent, useEffect, useMemo, useState } from 'react'
import { KeyRound, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateAnthropicKey } from '@/lib/validation'

export interface SettingsDrawerProps {
  open: boolean
  apiKey: string
  maskedKey: string
  isConnected: boolean
  onSave: (value: string) => void
  onClear: () => void
  onRequestModal: () => void
}

export function SettingsDrawer({
  open,
  apiKey,
  maskedKey,
  isConnected,
  onSave,
  onClear,
  onRequestModal,
}: SettingsDrawerProps) {
  const [value, setValue] = useState(apiKey)
  const [revealKey, setRevealKey] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    setValue(apiKey)
    setTouched(false)
  }, [apiKey])

  const dirty = value !== apiKey
  const isValid = validateAnthropicKey(value)
  const showError = touched && !isValid && dirty

  const statusCopy = useMemo(() => {
    if (isConnected) {
      return `Connected as ${maskedKey || '********'}`
    }
    return 'Not connected — add an Anthropic key to run generations.'
  }, [isConnected, maskedKey])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(true)
    if (!dirty || !isValid) return
    onSave(value.trim())
  }

  return (
    <section
      className={cn(
        'border-b bg-muted/30 px-4 transition-[max-height,opacity] duration-300 md:px-8',
        open ? 'max-h-[360px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div className="space-y-4 py-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          <span>API Key Settings</span>
          <span className="font-mono tracking-tight text-muted-foreground">
            {isConnected ? maskedKey : 'sk-ant-••••'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isConnected ? (
            <KeyRound className="size-4 text-emerald-500" aria-hidden="true" />
          ) : (
            <ShieldAlert className="size-4 text-amber-500" aria-hidden="true" />
          )}
          {statusCopy}
        </div>

        {!isConnected && (
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={onRequestModal}
          >
            Add API key via secure modal →
          </button>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Anthropic API key
            <div className="flex items-center gap-2">
              <input
                className={cn(
                  'w-full flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  showError && 'border-destructive focus-visible:ring-destructive/40',
                )}
                type={revealKey ? 'text' : 'password'}
                value={value}
                placeholder="sk-ant-..."
                autoComplete="off"
                onBlur={() => setTouched(true)}
                onChange={event => setValue(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevealKey(prev => !prev)}
              >
                {revealKey ? 'Hide' : 'Show'}
              </Button>
            </div>
          </label>
          {showError && (
            <p className="text-sm text-destructive">
              Please enter a valid Anthropic key starting with <code>sk-ant-</code>.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!dirty || !isValid}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setValue('')
                setTouched(false)
                onClear()
              }}
            >
              Clear key
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Key is stored in localStorage and persists between sessions; it is never sent to the
            Express server.
          </p>
        </form>
      </div>
    </section>
  )
}
