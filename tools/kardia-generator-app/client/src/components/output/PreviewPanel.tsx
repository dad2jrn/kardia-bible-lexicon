import type { CategoryEntry, EnglishGlosses, KardiaVerse } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export interface PreviewPanelProps {
  entry: CategoryEntry | null
  kardiaVerses: KardiaVerse[]
}

function renderGlosses(glosses: EnglishGlosses | string[] | undefined) {
  if (!glosses) return null
  if (Array.isArray(glosses)) {
    return glosses.map(gloss => (
      <Badge key={gloss} variant="secondary" className="text-xs">
        {gloss}
      </Badge>
    ))
  }
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recommended</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {glosses.recommended.map(gloss => (
            <Badge key={gloss} variant="secondary" className="text-xs">
              {gloss}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Attested</p>
        <div className="mt-2 space-y-2">
          {glosses.attested.map(gloss => (
            <div key={gloss.gloss} className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="font-semibold">{gloss.gloss}</div>
              <p className="text-xs text-muted-foreground">
                Found in: {gloss.found_in.join(', ')} — loses: {gloss.loses}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PreviewPanel({ entry, kardiaVerses }: PreviewPanelProps) {
  if (!entry) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        The preview unlocks once a full entry is generated.
      </div>
    )
  }

  const glosses = renderGlosses(entry.surface_vehicles?.english_glosses)

  return (
    <ScrollArea className="h-[520px] rounded-xl border bg-muted/20 p-5">
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{entry.category_label}</p>
          <h3 className="text-2xl font-semibold tracking-tight">
            {entry.category_label}{' '}
            <span className="text-base text-muted-foreground">({entry.transliteration})</span>
          </h3>
          <p className="text-sm text-muted-foreground">{entry.kardia_rendering}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-base font-semibold">One-liner</p>
          <p className="text-sm text-muted-foreground">{entry.one_liner}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What it does</p>
            <p className="mt-2 text-sm">{entry.what_it_does}</p>
          </div>
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What it is not</p>
            <p className="mt-2 text-sm">{entry.what_it_is_not}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Full definition</p>
          <p className="mt-2 text-sm text-foreground whitespace-pre-line">{entry.full_definition}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Second Temple Context</p>
          <p className="mt-2 text-sm">{entry.second_temple_context}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Theological notes</p>
          <p className="mt-2 text-sm">{entry.theological_notes}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">English glosses</p>
          <div className="mt-3">{glosses}</div>
        </div>

        {entry.illustrative_renderings?.length ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Illustrative renderings</p>
            <div className="grid gap-3 md:grid-cols-2">
              {entry.illustrative_renderings.map(rendering => (
                <div key={rendering.translation + rendering.text} className="rounded-xl border bg-background p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{rendering.translation}</p>
                  <p className="mt-2 text-sm">{rendering.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {kardiaVerses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Kardia verse translations</p>
            <div className="space-y-3">
              {kardiaVerses.map(verse => (
                <div key={verse.verse_ref} className="rounded-xl border bg-background p-4 shadow-sm">
                  <div className="text-sm font-semibold">{verse.verse_ref}</div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Standard</p>
                  <p className="text-sm">{verse.standard_rendering}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Kardia</p>
                  <p className="text-sm">{verse.kardia_translation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
