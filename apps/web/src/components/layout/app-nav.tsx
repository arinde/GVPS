import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "cn";
import type { NavItem } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";

/**
 * Presentational (AGENTS.md §1): the shell above decides what is visible and
 * who is signed in. This only draws it.
 */
export type AppNavProps = {
  items: NavItem[];
  currentPath: string;
  email: string;
  periodLabel?: string;
  onSignOut: () => void;
  isSigningOut?: boolean;
};

/**
 * The active link is the longest href the path matches, not merely the first.
 * "/students/new" is a prefix match for "/students" too, so without this both
 * light up at once.
 */
function activeHref(items: NavItem[], currentPath: string): string | null {
  const matches = items.filter((item) =>
    item.href === "/" ? currentPath === "/" : currentPath === item.href || currentPath.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;

  return matches.reduce((longest, item) => (item.href.length > longest.href.length ? item : longest)).href;
}

export function AppNav({ items, currentPath, email, periodLabel, onSignOut, isSigningOut = false }: AppNavProps) {
  const current = activeHref(items, currentPath);

  return (
    <header className="bg-sidebar text-sidebar-foreground border-sidebar-border border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="font-heading text-lg font-bold">
          GVPS
        </Link>

        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex flex-wrap gap-1">
            {items.map((item) => {
              const active = item.href === current;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {periodLabel ? <span className="hidden opacity-80 md:inline">{periodLabel}</span> : null}
          <span className="max-w-[12rem] truncate opacity-80" title={email}>
            {email}
          </span>
          <Button variant="ghost" size="sm" onClick={onSignOut} disabled={isSigningOut}>
            <LogOut aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{isSigningOut ? "Signing out…" : "Sign out"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
