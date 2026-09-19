import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "cn";
import type { NavItem } from "@/components/layout/nav-items";

export type MobileTopBarProps = {
  title: string;
  onSignOut: () => void;
  isSigningOut?: boolean;
};

/** STITCH-GLOBAL.md §12: 56px white bar with the screen title. Phones only. */
export function MobileTopBar({ title, onSignOut, isSigningOut = false }: MobileTopBarProps) {
  return (
    <header className="border-border sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
      <p className="text-foreground truncate text-base font-semibold">{title}</p>
      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        aria-label="Log out"
        className="text-foreground hover:bg-zebra flex size-10 items-center justify-center rounded-lg disabled:opacity-40"
      >
        <LogOut className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}

export type MobileTabBarProps = {
  /** At most four fit a phone's width (§12); the shell passes the first four. */
  items: NavItem[];
  activeHref: string | null;
};

/**
 * STITCH-GLOBAL.md §12: 60px bottom tab bar, items evenly spaced, active in
 * primary blue and inactive in #B9C5CE. Phones only — the sidebar replaces it
 * on desktop.
 */
export function MobileTabBar({ items, activeHref }: MobileTabBarProps) {
  return (
    <nav aria-label="Main" className="border-border fixed inset-x-0 bottom-0 z-30 h-[60px] border-t bg-white lg:hidden">
      <ul className="flex h-full items-stretch">
        {items.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold",
                  active ? "text-primary" : "text-placeholder",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
