import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--kardia-muted)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--kardia-bg)] [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[color:color-mix(in_srgb,var(--kardia-gold) 20%,var(--kardia-surface))] text-[color:var(--kardia-text)]",
        secondary:
          "border-[color:color-mix(in_srgb,var(--kardia-border) 70%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-card) 80%,var(--kardia-bg))] text-[color:var(--kardia-muted)]",
        success: "border-transparent bg-[color:color-mix(in_srgb,var(--kardia-success) 25%,var(--kardia-bg))] text-[color:var(--kardia-success)]",
        warning: "border-transparent bg-[color:color-mix(in_srgb,var(--kardia-warning) 25%,var(--kardia-bg))] text-[color:var(--kardia-warning-dark,var(--kardia-warning))]",
        destructive:
          "border-transparent bg-[color:color-mix(in_srgb,var(--kardia-danger) 20%,var(--kardia-bg))] text-[color:var(--kardia-danger)]",
        outline:
          "border-[color:color-mix(in_srgb,var(--kardia-border) 85%,transparent)] text-[color:var(--kardia-muted)]",
      },
      density: {
        relaxed: "h-7 px-3.5 tracking-[0.2em]",
        compact: "h-5 px-2 text-[0.65rem]",
      },
    },
    defaultVariants: {
      variant: "secondary",
      density: "relaxed",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge }
