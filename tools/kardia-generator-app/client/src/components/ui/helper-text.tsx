import { cn } from "@/lib/utils"

export function HelperText({
  className,
  tone = "muted",
  children,
}: {
  className?: string
  tone?: "muted" | "warning" | "danger" | "success"
  children: React.ReactNode
}) {
  const toneColor =
    tone === "warning"
      ? "text-[color:var(--kardia-warning)]"
      : tone === "danger"
        ? "text-[color:var(--kardia-danger)]"
        : tone === "success"
          ? "text-[color:var(--kardia-success)]"
          : "text-[color:var(--kardia-muted)]"

  return (
    <p className={cn("text-sm leading-relaxed", toneColor, className)}>
      {children}
    </p>
  )
}
