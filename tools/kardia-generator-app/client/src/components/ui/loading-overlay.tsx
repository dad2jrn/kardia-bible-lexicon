import { cn } from "@/lib/utils"

export function LoadingOverlay({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] bg-[color:var(--kardia-overlay)] backdrop-blur",
        className
      )}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--kardia-border)] border-t-[color:var(--kardia-gold)]" aria-hidden="true" />
      <p className="text-sm text-[color:var(--kardia-muted)]">{label}</p>
    </div>
  )
}
