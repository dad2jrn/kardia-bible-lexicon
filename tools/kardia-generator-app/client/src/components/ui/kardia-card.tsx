import { forwardRef, type HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "section" | "surface" | "ghost"
  interactive?: boolean
}

export const KardiaCard = forwardRef<HTMLDivElement, CardProps>(function KardiaCard(
  { className, variant = "section", interactive, ...props },
  ref
) {
  const base =
    "rounded-[var(--radius-xl)] border border-[color:color-mix(in_srgb,var(--kardia-border) 80%,transparent)] px-6 py-5 shadow-[var(--kardia-shadow-card)] backdrop-blur" +
    (interactive ? " transition hover:-translate-y-[1px]" : "")

  const variantClass =
    variant === "surface"
      ? "bg-[color:var(--kardia-card)]"
      : variant === "ghost"
        ? "border-transparent bg-transparent shadow-none"
        : "bg-[color:color-mix(in_srgb,var(--kardia-card) 90%,var(--kardia-surface))]"

  return (
    <div ref={ref} className={cn(base, variantClass, className)} {...props} />
  )
})
