import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex items-center justify-center gap-2 rounded-xl border bg-clip-padding px-4 py-2.5 text-sm font-semibold tracking-tight transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--kardia-bg)] active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-40 data-[state=loading=true]:cursor-progress data-[state=loading=true]:opacity-70 aria-pressed:ring-[color:var(--focus-ring-color)] aria-pressed:ring-2 aria-pressed:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-br from-[color:var(--kardia-gold)] via-[color:color-mix(in_srgb,var(--kardia-gold) 85%,var(--kardia-gold-dark))] to-[color:var(--kardia-gold-dark)] text-primary-foreground shadow-[0_35px_60px_-35px_rgba(12,7,1,0.65)] hover:brightness-110",
        secondary:
          "border-[color:color-mix(in_srgb,var(--kardia-border) 85%,transparent)] bg-[color:color-mix(in_srgb,var(--kardia-card) 90%,var(--kardia-surface))] text-[color:var(--kardia-text)] hover:border-[color:var(--kardia-gold)] hover:text-[color:var(--kardia-text)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--kardia-muted)] hover:bg-white/5 hover:text-[color:var(--kardia-text)]",
        outline:
          "border-[color:var(--kardia-border-strong)] bg-transparent text-[color:var(--kardia-text)] hover:border-[color:var(--kardia-gold)]",
        subtle:
          "border-transparent bg-[color:color-mix(in_srgb,var(--kardia-card) 75%,var(--kardia-bg))] text-[color:var(--kardia-text)] hover:bg-[color:color-mix(in_srgb,var(--kardia-card) 65%,var(--kardia-bg))]",
        destructive:
          "border-transparent bg-[color:color-mix(in_srgb,var(--kardia-danger) 75%,#2b0b0b)] text-white hover:bg-[color:color-mix(in_srgb,var(--kardia-danger) 85%,#2b0b0b)]",
        link: "border-transparent bg-transparent p-0 text-[color:var(--kardia-gold)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "min-h-10 px-5 py-2.5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "min-h-7 gap-1 rounded-lg px-3 text-xs",
        sm: "min-h-8 rounded-lg px-3.5 text-sm",
        lg: "min-h-12 gap-2 rounded-2xl px-6 text-base",
        icon: "size-11 rounded-2xl",
        "icon-sm": "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
