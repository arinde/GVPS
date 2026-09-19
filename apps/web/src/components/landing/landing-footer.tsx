import Link from "next/link";

export type LandingFooterProps = { schoolName: string; motto: string; established: number; year: number };

/** The public site's footer: name, year, and the ways in. */
export function LandingFooter({ schoolName, motto, established, year }: LandingFooterProps) {
  return (
    <footer className="bg-navy text-[#FCFAFA]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="font-semibold">{schoolName}</p>
          <p className="text-sm italic opacity-80">{motto}</p>
          <p className="mt-1 text-xs opacity-60">
            Established {established} · © {year}
          </p>
        </div>
        <nav aria-label="Sign in" className="flex gap-5 sm:ml-auto">
          <Link href="/portal/login" className="opacity-85 hover:underline hover:opacity-100">
            Family portal
          </Link>
          <Link href="/login" className="opacity-85 hover:underline hover:opacity-100">
            Staff sign-in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
