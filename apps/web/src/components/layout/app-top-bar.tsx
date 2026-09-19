import { AppButton } from "@/components/common/app-button";

export type AppTopBarProps = {
  /** First line: where in the school year this is, e.g. "2026/2027 · First Term". */
  context: string;
  /** Second line: who is signed in, e.g. "Okafor, Ngozi · Superadmin". */
  signedInAs: string;
  onSignOut: () => void;
  isSigningOut?: boolean;
};

/**
 * STITCH-GLOBAL.md §7: 95px off-white bar across the content area on desktop.
 * Two lines of context on the left, "Log out" on the right. The spec's bell is
 * left out until notifications exist, so the bar has no control that does
 * nothing.
 */
export function AppTopBar({ context, signedInAs, onSignOut, isSigningOut = false }: AppTopBarProps) {
  return (
    <header className="bg-topbar sticky top-0 z-20 hidden h-[95px] items-center justify-between gap-6 px-10 lg:flex">
      <div className="text-muted-foreground min-w-0 text-base leading-6">
        <p className="truncate">{context}</p>
        <p className="truncate">{signedInAs}</p>
      </div>
      <AppButton className="w-[120px] shrink-0" onClick={onSignOut} disabled={isSigningOut}>
        {isSigningOut ? "Logging out…" : "Log out"}
      </AppButton>
    </header>
  );
}
