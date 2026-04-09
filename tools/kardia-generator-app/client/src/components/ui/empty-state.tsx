import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, className, icon }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-subtle flex w-full flex-col items-center gap-3 border border-dashed border-[color:color-mix(in_srgb,var(--kardia-border) 50%,transparent)] px-6 py-10 text-center",
        className
      )}
    >
      {icon && <div className="text-[color:var(--kardia-gold)]">{icon}</div>}
      <h3 className="type-card-title font-semibold text-[color:var(--kardia-text)]">{title}</h3>
      {description && <p className="text-sm text-[color:var(--kardia-muted)]">{description}</p>}
      {action}
    </div>
  )
}
