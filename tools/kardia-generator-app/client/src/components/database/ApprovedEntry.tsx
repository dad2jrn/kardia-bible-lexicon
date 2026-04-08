import { useCallback, useMemo, useState } from 'react'
import { BookOpenCheck, Copy, Trash2 } from 'lucide-react'

import type { CategoryEntry } from '@/types'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PreviewPanel } from '@/components/output/PreviewPanel'

export interface ApprovedEntryProps {
  entry: CategoryEntry
  onDelete: (id: string) => Promise<void>
  onCopyJson: (json: string) => void
  onGenerateVerses: (entry: CategoryEntry) => void
  onNotify?: (message: string) => void
}

export function ApprovedEntry({
  entry,
  onDelete,
  onCopyJson,
  onGenerateVerses,
  onNotify,
}: ApprovedEntryProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const kardiaVerses = entry._kardia_verses ?? []

  const json = useMemo(() => JSON.stringify(entry, null, 2), [entry])

  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(json)
    } catch {
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        window.prompt('Copy JSON manually', json)
      }
    }
    onCopyJson(json)
  }, [json, onCopyJson])

  const handleDelete = useCallback(async () => {
    setDeleteError(null)
    setDeleting(true)
    try {
      await onDelete(entry.id)
      onNotify?.(`Removed ${entry.category_label} from the database.`)
      setConfirmOpen(false)
    } catch (err) {
      setDeleteError((err as Error).message ?? 'Failed to delete entry.')
    } finally {
      setDeleting(false)
    }
  }, [entry.id, entry.category_label, onDelete, onNotify])

  return (
    <AccordionItem value={entry.id}>
      <AccordionTrigger>
        <div>
          <p className="text-sm font-semibold">{entry.category_label}</p>
          <p className="text-xs text-muted-foreground">{entry.id}</p>
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">
          {entry.testament_scope.toUpperCase()}
        </Badge>
      </AccordionTrigger>
      <AccordionContent>
        <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={copyJson}>
              <Copy className="mr-2 h-4 w-4" />
              Copy JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onGenerateVerses(entry)
              }}
            >
              <BookOpenCheck className="mr-2 h-4 w-4" />
              Generate Missing Verse Translations
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

          <Tabs defaultValue="json">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="mt-4">
              <ScrollArea className="h-72 rounded-xl border bg-background p-4">
                <pre className="text-xs leading-relaxed">{json}</pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <PreviewPanel
                entry={entry}
                kardiaVerses={kardiaVerses}
              />
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove entry</DialogTitle>
              <DialogDescription>
                This deletes <strong>{entry.category_label}</strong> from SQLite. You can re-import later if needed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Removing…' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AccordionContent>
    </AccordionItem>
  )
}
