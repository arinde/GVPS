import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";

// STITCH-GLOBAL.md §13. Primary is blue and darkens on hover; secondary is
// white with a #B9C5CE border; danger keeps the white face and signals with
// the red status set, so a destructive action is recognisable but not loud.
const VARIANTS = {
  primary: { base: "default", classes: "bg-primary text-primary-foreground hover:bg-primary-hover" },
  secondary: { base: "outline", classes: "border-input bg-white text-foreground hover:bg-zebra" },
  ghost: { base: "ghost", classes: "text-foreground hover:bg-zebra" },
  danger: { base: "outline", classes: "border-danger-border bg-white text-danger-foreground hover:bg-danger" },
} as const;

// §4 and §13: 40px standard, 32px small; 8px corners; SemiBold 14px labels.
// Disabled is 40% opacity — and §13 requires visible text nearby saying why.
const SIZES = {
  default: "h-10 rounded-lg px-5 text-sm font-semibold disabled:opacity-40",
  small: "h-8 rounded-lg px-3 text-sm font-semibold disabled:opacity-40",
} as const;

type Variant = keyof typeof VARIANTS;
type Size = keyof typeof SIZES;

export type AppButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size" | "render"> & {
  variant?: Variant;
  size?: Size;
};

/**
 * The app's button: shadcn's Button with the design system's variants and
 * sizes. Wraps rather than edits the generated component (AGENTS.md §6).
 * Use this, not ui/button, in feature code. For navigation, use
 * AppLinkButton — a button must not pretend to be a link.
 */
export function AppButton({ variant = "primary", size = "default", className, ...props }: AppButtonProps) {
  const { base, classes } = VARIANTS[variant];
  return <Button {...props} variant={base} className={cn(SIZES[size], classes, className)} />;
}

export type AppLinkButtonProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

/**
 * Navigation that looks like a button: a real link, announced as a link and
 * opened like one (middle-click, new tab), dressed in the button styles.
 * Rendering a Base UI Button as an anchor instead would label it a button to
 * assistive technology.
 */
export function AppLinkButton({
  href,
  variant = "primary",
  size = "default",
  className,
  children,
}: AppLinkButtonProps) {
  const { base, classes } = VARIANTS[variant];
  return (
    <Link href={href} className={cn(buttonVariants({ variant: base }), SIZES[size], classes, className)}>
      {children}
    </Link>
  );
}
