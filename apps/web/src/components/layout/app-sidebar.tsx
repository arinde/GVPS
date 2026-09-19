import Link from "next/link";
import { cn } from "cn";
import type { NavItem } from "@/components/layout/nav-items";

/**
 * Up to three initials for the crest placeholder: "Greenvale Primary School"
 * gives "GPS"; a name that is already short, like "GVPS", is used as it is.
 * Stands in until the school-profile module stores a real crest image.
 */
export function crestInitials(schoolName: string): string {
  const name = schoolName.trim();
  if (!name.includes(" ")) return name.slice(0, 4).toUpperCase();
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export type AppSidebarProps = {
  items: NavItem[];
  activeHref: string | null;
  schoolName: string;
};

/**
 * STITCH-GLOBAL.md §6: fixed 241px navy sidebar on desktop, crest and school
 * name at the top, a divider, then 40px nav items 24px in from each edge. Not
 * rendered on phones, which get MobileTopBar and MobileTabBar instead (§12).
 */
export function AppSidebar({ items, activeHref, schoolName }: AppSidebarProps) {
  return (
    <aside className="bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30 hidden w-[241px] flex-col lg:flex">
      <div className="border-sidebar-border flex flex-col items-center gap-3 border-b px-6 py-5">
        <div
          aria-hidden="true"
          className="border-sidebar-foreground/30 flex size-20 items-center justify-center rounded-full border-2 text-xl font-bold tracking-wide"
        >
          {crestInitials(schoolName)}
        </div>
        <p className="text-center text-sm font-semibold">{schoolName}</p>
      </div>

      <nav aria-label="Main" className="mt-7 px-6">
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-4 rounded-[4px] px-4 text-sm font-semibold transition-colors",
                    active ? "bg-sidebar-primary" : "hover:bg-sidebar-accent",
                  )}
                >
                  <Icon className={cn("size-4", active ? "" : "opacity-70")} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
