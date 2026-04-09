import { forwardRef } from "react"
import { Check, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

export interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  completed?: boolean
  tone?: "default" | "success" | "warning"
  label: string
  description?: string
  showSelectedLabel?: boolean
}

export const Pill = forwardRef<HTMLButtonElement, PillProps>(function Pill(
  {
    selected,
    completed,
    tone = "default",
    label,
    description,
    showSelectedLabel = true,
    className,
    ...props
  },
  ref
) {
  const toneColor =
    tone === "success"
      ? "text-[color:var(--kardia-success)]"
      : tone === "warning"
        ? "text-[color:var(--kardia-warning)]"
        : "text-[color:var(--kardia-muted)]"

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group flex flex-col gap-2 rounded-2xl border border-[color:color-mix(in_srgb,var(--kardia-border) 70%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-card) 85%,var(--kardia-bg))] px-4 py-3 text-left transition hover:border-[color:var(--kardia-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--kardia-bg)]",
        selected &&
          "border-[color:var(--kardia-gold)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--kardia-gold) 70%,transparent)]",
        completed && "bg-[color:color-mix(in_srgb,var(--kardia-card) 80%,var(--kardia-success))]",
        className
      )}
      aria-pressed={selected}
      {...props}
    >
      <div className="flex items-center justify-between text-sm font-semibold text-[color:var(--kardia-text)]">
        <span>{label}</span>
        {selected && showSelectedLabel && (
          <span className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-[color:var(--kardia-gold)]">
            <Sparkles className="size-3" /> Selected
          </span>
        )}
        {!selected && completed && (
          <span className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-[color:var(--kardia-success)]">
            <Check className="size-3" /> Complete
          </span>
        )}
      </div>
      {description && <p className={cn("text-xs", toneColor)}>{description}</p>}
    </button>
  )
})
