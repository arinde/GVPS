import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  /** One line under the title, e.g. "34 students · Primary 3A". */
  subtitle?: ReactNode;
  /** Right-aligned actions, typically one primary button. */
  actions?: ReactNode;
};

/**
 * The heading every page opens with. STITCH-GLOBAL.md §3: page heading Kumbh
 * Sans Bold 36px #282828; the subtitle in secondary text. Wraps under the
 * title on a phone rather than squeezing the actions.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-4xl">{title}</h1>
        {subtitle ? <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
