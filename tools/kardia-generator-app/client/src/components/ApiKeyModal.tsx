import { FormEvent, useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ApiProvider } from '@/types'
import { validateAnthropicKey, validateOpenAiKey } from '@/lib/validation'
import { cn } from '@/lib/utils'

export interface ApiKeyModalProps {
  open: boolean
  anthropicKey: string
  openaiKey: string
  activeProvider: ApiProvider
  onClose: () => void
  onSaveAnthropic: (value: string) => void
  onSaveOpenai: (value: string) => void
  onSelectProvider: (provider: ApiProvider) => void
}

export function ApiKeyModal({
  open,
  anthropicKey,
  openaiKey,
  activeProvider,
  onClose,
  onSaveAnthropic,
  onSaveOpenai,
  onSelectProvider,
}: ApiKeyModalProps) {
  const [anthropicValue, setAnthropicValue] = useState(anthropicKey)
  const [openaiValue, setOpenaiValue] = useState(openaiKey)
  const [touched, setTouched] = useState({ anthropic: false, openai: false })

  useEffect(() => {
    if (!open) {
      setAnthropicValue(anthropicKey)
      setOpenaiValue(openaiKey)
      setTouched({ anthropic: false, openai: false })
    } else {
      setAnthropicValue(anthropicKey)
      setOpenaiValue(openaiKey)
    }
  }, [open, anthropicKey, openaiKey])

  const isAnthropicValid = anthropicValue.trim() === '' || validateAnthropicKey(anthropicValue)
  const isOpenaiValid = openaiValue.trim() === '' || validateOpenAiKey(openaiValue)
  const showAnthropicError = touched.anthropic && !isAnthropicValid && anthropicValue.trim() !== ''
  const showOpenaiError = touched.openai && !isOpenaiValid && openaiValue.trim() !== ''

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched({ anthropic: true, openai: true })
    if (!isAnthropicValid || !isOpenaiValid) return

    const trimmedAnthropic = anthropicValue.trim()
    const trimmedOpenai = openaiValue.trim()

    if (trimmedAnthropic !== anthropicKey) {
      onSaveAnthropic(trimmedAnthropic)
    }
    if (trimmedOpenai !== openaiKey) {
      onSaveOpenai(trimmedOpenai)
    }

    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-w-md" showCloseButton>
        <DialogHeader>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary">
            Kardia Lexicon
          </span>
          <DialogTitle>Connect your API key</DialogTitle>
          <DialogDescription>
            Add your Anthropic or OpenAI API keys. Keys stay in this browser and are never shared.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
            Anthropic API key
            <input
              type="password"
              className={cn(
                'rounded-lg border bg-muted/30 px-3 py-2 font-mono text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showAnthropicError && 'border-destructive focus-visible:ring-destructive/40',
              )}
              placeholder="sk-ant-..."
              autoComplete="off"
              value={anthropicValue}
              onChange={event => setAnthropicValue(event.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, anthropic: true }))}
            />
          </label>

          {showAnthropicError && (
            <p className="text-sm text-destructive">
              Please enter a valid Anthropic key starting with <code>sk-ant-</code>.
            </p>
          )}

          <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
            OpenAI API key
            <input
              type="password"
              className={cn(
                'rounded-lg border bg-muted/30 px-3 py-2 font-mono text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showOpenaiError && 'border-destructive focus-visible:ring-destructive/40',
              )}
              placeholder="sk-..."
              autoComplete="off"
              value={openaiValue}
              onChange={event => setOpenaiValue(event.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, openai: true }))}
            />
          </label>

          {showOpenaiError && (
            <p className="text-sm text-destructive">
              Please enter a valid OpenAI key starting with <code>sk-</code>.
            </p>
          )}

          <div className="space-y-2 rounded-xl border border-dashed border-muted-foreground/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Active Provider
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['anthropic', 'openai'] as ApiProvider[]).map(provider => {
                const isActive = provider === activeProvider
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => onSelectProvider(provider)}
                    aria-pressed={isActive}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background hover:border-primary/40',
                    )}
                  >
                    {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              The active provider&apos;s key is used for generation runs. Switch anytime without losing
              saved keys.
            </p>
          </div>

          <p className="text-xs italic text-muted-foreground">
            Keys stay in localStorage and are sent only to their respective provider APIs.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={!isAnthropicValid || !isOpenaiValid}
              className="w-full sm:w-auto"
            >
              Save Keys &amp; Continue →
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              Later
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
