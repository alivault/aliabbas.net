import type { ComponentProps } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { createLink } from '@tanstack/react-router'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from 'cn'

/**
 * The button variants. Each one has a role: see BUTTON_VARIANT_ROLES, which
 * /design shows.
 */
const variantClasses = {
  // A liquid metal fill on hover. liquid-metal.ts finds the button by the
  // liquid-metal class and draws a shader canvas under the label. While it
  // shows, data-liquid-metal is set and the label turns light. Without
  // WebGL (data-liquid-metal="static"), a still gradient of dark chrome
  // with one light band.
  primary:
    'liquid-metal relative isolate bg-brand text-brand-foreground hover:bg-brand/85 data-liquid-metal:text-chrome-foreground data-liquid-metal:[text-shadow:0_0_0.6em_var(--chrome)] data-[liquid-metal=static]:bg-[linear-gradient(160deg,var(--chrome)_20%,color-mix(in_oklab,var(--chrome-foreground)_70%,var(--chrome))_50%,var(--chrome)_80%)]',
  // A metal ring that turns on the 1px border on hover: bands of chrome
  // with prism fringes, as light on polished metal. The mask keeps the
  // gradient to the border. The colors are of a material, not roles, so
  // they are not tokens. --chrome-angle is registered in globals.css. With
  // reduced motion, the ring shows but does not turn.
  secondary:
    'relative border-border bg-card text-fg-secondary hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary aria-expanded:text-foreground before:pointer-events-none before:absolute before:-inset-px before:rounded-[inherit] before:bg-[conic-gradient(from_var(--chrome-angle),oklch(0.12_0.005_260),oklch(0.45_0.25_265)_8%,oklch(0.78_0.15_225)_13%,oklch(0.98_0.01_230)_18%,oklch(0.82_0.15_70)_23%,oklch(0.66_0.22_15)_28%,oklch(0.55_0.26_295)_34%,oklch(0.12_0.005_260)_42%,oklch(0.12_0.005_260)_55%,oklch(0.55_0.21_265)_62%,oklch(0.9_0.1_205)_67%,oklch(1_0_0)_71%,oklch(0.88_0.12_80)_75%,oklch(0.7_0.19_40)_80%,oklch(0.6_0.27_310)_86%,oklch(0.12_0.005_260)_93%)] before:p-px before:opacity-0 before:transition-opacity before:duration-280 before:ease-[cubic-bezier(0.22,1,0.36,1)] before:[mask:linear-gradient(black_0_0)_content-box_exclude,linear-gradient(black_0_0)] hover:before:animate-chrome-turn hover:before:opacity-100 motion-reduce:hover:before:animate-none',
  ghost:
    'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground dark:hover:bg-muted/50',
  destructive:
    'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
} as const

/** The sizes. All buttons are round; the text is 14px or more. */
export const sizeClasses = {
  md: 'h-8 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-4 text-sm sm:px-5 sm:text-base',
  icon: 'size-8',
  'icon-lg': 'size-10',
} as const

export type ButtonVariant = keyof typeof variantClasses
export type ButtonSize = keyof typeof sizeClasses

/** When to use each variant. /design shows these. */
export const BUTTON_VARIANT_ROLES: Record<ButtonVariant, string> = {
  primary:
    'The main action of a view, in the brand color. At most one in each view or group. On hover, it fills with liquid metal.',
  secondary:
    'The action next to the main one, and other bordered actions, such as Stop and Retry. On hover, a chrome ring turns on its border.',
  ghost:
    'Actions in toolbars and lists, and most buttons that show only an icon.',
  destructive: 'Actions that delete.',
}

/** When to use each size. /design shows these. */
export const BUTTON_SIZE_ROLES: Record<ButtonSize, string> = {
  md: 'The default: 32px high.',
  lg: 'The main actions of a page, such as the hero and the closing call to action: 44px high.',
  icon: 'An icon only: a 32px circle. Give it an aria-label.',
  'icon-lg': 'An icon only that floats over content: a 40px circle.',
}

const buttonStyles = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: { variant: variantClasses, size: sizeClasses },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonStyleProps = VariantProps<typeof buttonStyles>

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & ButtonStyleProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonStyles({ variant, size, className }))}
      {...props}
    />
  )
}

/** The button classes, merged, so a size or a className wins over the base. */
function buttonVariants(props?: Parameters<typeof buttonStyles>[0]) {
  return cn(buttonStyles(props))
}

/**
 * A link that looks like a button. Use it, not Button with a link in
 * `render`: that gives the link role="button". For a page outside the
 * site, give `href`: it opens in a new tab.
 */
function ButtonAnchor({
  className,
  variant,
  size,
  href,
  ...props
}: ComponentProps<'a'> & ButtonStyleProps) {
  const external = /^https?:\/\//.test(href ?? '')
  return (
    <a
      data-slot="button"
      href={href}
      className={buttonVariants({ variant, size, className })}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...props}
    />
  )
}

/** A router link that looks like a button: `<ButtonLink to="/contact">`. */
const ButtonLink = createLink(ButtonAnchor)

export { Button, ButtonAnchor, ButtonLink, buttonVariants }
