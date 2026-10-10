import Link from "next/link";
import type { Breadcrumb } from "@/components/layout/nav-items";

export type BreadcrumbsProps = { items: Breadcrumb[] };

/**
 * One line above every page's own heading, so a screen reached three clicks
 * deep (a report card, a fee structure, an edit form) always has a way back
 * that doesn't depend on the browser's own back button. Nothing to wire per
 * page — AppShell derives this from the current path.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-border border-b bg-white px-4 py-2 lg:px-10">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span aria-hidden="true" className="text-placeholder">
                /
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className="text-muted-foreground hover:text-foreground hover:underline">
                {item.label}
              </Link>
            ) : (
              <span
                className={index === items.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
