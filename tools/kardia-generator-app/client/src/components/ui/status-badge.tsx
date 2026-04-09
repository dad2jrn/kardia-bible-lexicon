import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "danger" | "info"

const toneMap: Record<Tone, string> = {
  success: "text-[color:var(--kardia-success)]",
  warning: "text-[color:var(--kardia-warning)]",
  danger: "text-[color:var(--kardia-danger)]",
  info: "text-[color:var(--kardia-muted)]",
}

export function StatusBadge({
  tone = "info",
  label,
  className,
}: {
  tone?: Tone
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--kardia-border) 70%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-card) 80%,var(--kardia-bg))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kardia-muted)]",
        toneMap[tone],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  )
}
