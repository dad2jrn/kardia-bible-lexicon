import { FormEvent, useEffect, useMemo, useState } from 'react'
import { KeyRound, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ApiProvider } from '@/types'
import { validateAnthropicKey, validateOpenAiKey } from '@/lib/validation'

export interface SettingsDrawerProps {
  open: boolean
  anthropicKey: string
  openaiKey: string
  maskedActiveKey: string
  isConnected: boolean
  activeProvider: ApiProvider
  onSaveAnthropic: (value: string) => void
  onSaveOpenai: (value: string) => void
  onSetActiveProvider: (provider: ApiProvider) => void
  onClearAll: () => void
  onRequestModal: () => void
}

export function SettingsDrawer({
  open,
  anthropicKey,
  openaiKey,
  maskedActiveKey,
  isConnected,
  activeProvider,
  onSaveAnthropic,
  onSaveOpenai,
  onSetActiveProvider,
  onClearAll,
  onRequestModal,
}: SettingsDrawerProps) {
  const [anthropicValue, setAnthropicValue] = useState(anthropicKey)
  const [openaiValue, setOpenaiValue] = useState(openaiKey)
  const [revealAnthropic, setRevealAnthropic] = useState(false)
  const [revealOpenai, setRevealOpenai] = useState(false)
  const [touched, setTouched] = useState({ anthropic: false, openai: false })

  useEffect(() => {
    setAnthropicValue(anthropicKey)
    setOpenaiValue(openaiKey)
    setTouched({ anthropic: false, openai: false })
  }, [anthropicKey, openaiKey])

  const anthropicDirty = anthropicValue !== anthropicKey
  const openaiDirty = openaiValue !== openaiKey

  const isAnthropicValid = anthropicValue.trim() === '' || validateAnthropicKey(anthropicValue)
  const isOpenaiValid = openaiValue.trim() === '' || validateOpenAiKey(openaiValue)
  const showAnthropicError = touched.anthropic && !isAnthropicValid && anthropicValue.trim() !== ''
  const showOpenaiError = touched.openai && !isOpenaiValid && openaiValue.trim() !== ''

  const statusCopy = useMemo(() => {
    if (isConnected) {
      const providerLabel = activeProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'
      return `${providerLabel} connected as ${maskedActiveKey || '********'}`
    }
    return 'Not connected — add at least one provider key to run generations.'
  }, [activeProvider, isConnected, maskedActiveKey])

  const handleAnthropicSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(prev => ({ ...prev, anthropic: true }))
    if (!anthropicDirty || !isAnthropicValid) return
    onSaveAnthropic(anthropicValue.trim())
  }

  const handleOpenaiSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(prev => ({ ...prev, openai: true }))
    if (!openaiDirty || !isOpenaiValid) return
    onSaveOpenai(openaiValue.trim())
  }

  return (
    <section
      className={cn(
        'border-b bg-muted/30 px-4 transition-[max-height,opacity] duration-300 md:px-8',
        open ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div className="space-y-4 py-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          <span>API Key Settings</span>
          <span className="font-mono tracking-tight text-muted-foreground">
            {isConnected
              ? maskedActiveKey
              : activeProvider === 'anthropic'
                ? 'sk-ant-••••'
                : 'sk-••••'}
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

        <div className="space-y-4 rounded-2xl border border-dashed border-muted-foreground/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Active Provider
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['anthropic', 'openai'] as ApiProvider[]).map(provider => {
              const isActive = provider === activeProvider
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => onSetActiveProvider(provider)}
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
            The active provider controls which model list and API key power generation.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <form className="space-y-3" onSubmit={handleAnthropicSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Anthropic API key
              <div className="flex items-center gap-2">
                <input
                  className={cn(
                    'w-full flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    showAnthropicError && 'border-destructive focus-visible:ring-destructive/40',
                  )}
                  type={revealAnthropic ? 'text' : 'password'}
                  value={anthropicValue}
                  placeholder="sk-ant-..."
                  autoComplete="off"
                  onBlur={() => setTouched(prev => ({ ...prev, anthropic: true }))}
                  onChange={event => setAnthropicValue(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealAnthropic(prev => !prev)}
                >
                  {revealAnthropic ? 'Hide' : 'Show'}
                </Button>
              </div>
            </label>
            {showAnthropicError && (
              <p className="text-sm text-destructive">
                Please enter a valid Anthropic key starting with <code>sk-ant-</code>.
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={!anthropicDirty || !isAnthropicValid}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAnthropicValue('')
                  setTouched(prev => ({ ...prev, anthropic: false }))
                  onSaveAnthropic('')
                }}
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Stored locally; sent only to api.anthropic.com.
            </p>
          </form>

          <form className="space-y-3" onSubmit={handleOpenaiSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium">
              OpenAI API key
              <div className="flex items-center gap-2">
                <input
                  className={cn(
                    'w-full flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    showOpenaiError && 'border-destructive focus-visible:ring-destructive/40',
                  )}
                  type={revealOpenai ? 'text' : 'password'}
                  value={openaiValue}
                  placeholder="sk-..."
                  autoComplete="off"
                  onBlur={() => setTouched(prev => ({ ...prev, openai: true }))}
                  onChange={event => setOpenaiValue(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealOpenai(prev => !prev)}
                >
                  {revealOpenai ? 'Hide' : 'Show'}
                </Button>
              </div>
            </label>
            {showOpenaiError && (
              <p className="text-sm text-destructive">
                Please enter a valid OpenAI key starting with <code>sk-</code>.
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={!openaiDirty || !isOpenaiValid}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpenaiValue('')
                  setTouched(prev => ({ ...prev, openai: false }))
                  onSaveOpenai('')
                }}
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Stored locally; sent only to api.openai.com.
            </p>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onClearAll}>
            Clear all keys
          </Button>
        </div>
      </div>
    </section>
  )
}
