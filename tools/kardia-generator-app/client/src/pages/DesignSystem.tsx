import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DesignTokensShowcase } from "@/components/ui/design-tokens"
import { KardiaCard } from "@/components/ui/kardia-card"

export function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[color:var(--kardia-bg)] px-6 py-10 text-[color:var(--kardia-text)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <KardiaCard className="flex items-center justify-between bg-[color:var(--kardia-elevated)]">
          <div className="space-y-2">
            <p className="type-meta text-[color:var(--kardia-gold)]">Internal reference</p>
            <h1 className="type-page-title">Design System – Phase 1</h1>
            <p className="text-sm text-[color:var(--kardia-muted)]">
              Tokens, typography, and primitives for the Category Generator redesign.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-[color:var(--kardia-muted)]"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 size-4" /> Back to app
          </Button>
        </KardiaCard>

        <DesignTokensShowcase />
      </div>
    </div>
  )
}
