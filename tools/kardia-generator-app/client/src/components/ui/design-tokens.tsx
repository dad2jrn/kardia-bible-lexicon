import { Sparkle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { HelperText } from "@/components/ui/helper-text"
import { KardiaCard } from "@/components/ui/kardia-card"
import { Pill } from "@/components/ui/pill"
import { StatusBadge } from "@/components/ui/status-badge"

const sampleCategories = [
  { label: "Elohim", description: "God & covenant" },
  { label: "Imago Dei", description: "Human nature" },
]

export function DesignTokensShowcase() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="type-meta text-[color:var(--kardia-gold)]">Typography</p>
        <KardiaCard>
          <h1 className="type-page-title">Category Generator</h1>
          <p className="type-body text-[color:var(--kardia-muted)]">
            Scholarly theological tooling for Kardia. Demonstrates the typography scale.
          </p>
          <HelperText className="mt-4">Helper text tone.</HelperText>
        </KardiaCard>
      </section>

      <section className="space-y-3">
        <p className="type-meta text-[color:var(--kardia-gold)]">Buttons</p>
        <div className="grid gap-4 md:grid-cols-2">
          <KardiaCard className="space-y-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </KardiaCard>
          <KardiaCard className="space-y-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </KardiaCard>
        </div>
      </section>

      <section className="space-y-3">
        <p className="type-meta text-[color:var(--kardia-gold)]">Pills</p>
        <KardiaCard className="grid gap-4 md:grid-cols-2">
          {sampleCategories.map(cat => (
            <Pill key={cat.label} label={cat.label} description={cat.description} />
          ))}
          <Pill label="Koinonia" description="Relational & ethical" selected />
          <Pill label="Metanoia" description="Sin & redemption" completed />
        </KardiaCard>
      </section>

      <section className="space-y-3">
        <p className="type-meta text-[color:var(--kardia-gold)]">Status & Empty States</p>
        <div className="grid gap-4 md:grid-cols-2">
          <KardiaCard className="flex flex-col gap-3">
            <Badge variant="default">Premium Access</Badge>
            <Badge variant="success">Connected</Badge>
            <StatusBadge tone="warning" label="Provider Limited" />
          </KardiaCard>
          <EmptyState title="No category" description="Select a category to preview the summary." icon={<Sparkle className="size-6" />} />
        </div>
      </section>
    </div>
  )
}
