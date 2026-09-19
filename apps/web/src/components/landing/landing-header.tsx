import Link from "next/link";
import { AppLinkButton } from "@/components/common/app-button";
import { crestInitials } from "@/components/layout/app-sidebar";

export type LandingHeaderProps = {
  schoolName: string;
  /** Shown instead of the full name on a phone, where the full name would be cut off. */
  shortName: string;
  links: { href: string; label: string }[];
};

/** The public site's top bar: crest and name, page anchors, and the two sign-ins. */
export function LandingHeader({ schoolName, shortName, links }: LandingHeaderProps) {
  return (
    <header className="bg-navy/95 sticky top-0 z-20 text-[#FCFAFA] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white/60 text-[11px] font-bold"
          >
            {crestInitials(schoolName)}
          </span>
          <span className="text-sm font-semibold sm:hidden">{shortName}</span>
          <span className="hidden truncate text-base font-semibold sm:inline">{schoolName}</span>
        </Link>

        <nav aria-label="Page sections" className="ml-auto hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="opacity-85 hover:underline hover:opacity-100">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <Link href="/login" className="hidden text-sm opacity-85 hover:underline hover:opacity-100 sm:inline">
            Staff
          </Link>
          <AppLinkButton href="/portal/login" size="small">
            Family portal
          </AppLinkButton>
        </div>
      </div>
    </header>
  );
}
