import { FormEvent, useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { validateAnthropicKey } from '@/lib/validation'
import { cn } from '@/lib/utils'

export interface ApiKeyModalProps {
  open: boolean
  onClose: () => void
  onSave: (value: string) => void
}

export function ApiKeyModal({ open, onClose, onSave }: ApiKeyModalProps) {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) {
      setValue('')
      setTouched(false)
    }
  }, [open])

  const isValid = validateAnthropicKey(value)
  const showError = touched && !isValid

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(true)
    if (!isValid) return
    onSave(value.trim())
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
            Enter your Anthropic API key to begin generating Hebrew category entries. Your key stays
            in this browser and is never shared.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
            Anthropic API key
            <input
              type="password"
              className={cn(
                'rounded-lg border bg-muted/30 px-3 py-2 font-mono text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showError && 'border-destructive focus-visible:ring-destructive/40',
              )}
              placeholder="sk-ant-..."
              autoComplete="off"
              value={value}
              onChange={event => setValue(event.target.value)}
              onBlur={() => setTouched(true)}
            />
          </label>

          <p className="text-xs italic text-muted-foreground">
            Your key is stored only in localStorage and sent directly to api.anthropic.com — nowhere
            else.
          </p>

          {showError && (
            <p className="text-sm text-destructive">
              Please enter a valid API key starting with <code>sk-ant-</code>.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={!isValid}
              className="w-full sm:w-auto"
            >
              Connect &amp; Begin →
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
