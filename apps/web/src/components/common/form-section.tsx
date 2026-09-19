import type { ReactNode } from "react";

export type FormSectionProps = {
  title: string;
  /** One line under the heading, e.g. why a section is optional. */
  description?: string;
  /** Right-aligned control, such as "Add another". */
  action?: ReactNode;
  children: ReactNode;
};

/**
 * A titled group of fields inside a long form, so a registration or staff
 * record reads as a few short sections rather than one wall of inputs.
 * STITCH-GLOBAL.md §3: section headings SemiBold, #282828.
 */
export function FormSection({ title, description, action, children }: FormSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="border-border flex items-end justify-between gap-3 border-b pb-2">
        <div>
          <h2 className="text-base">{title}</h2>
          {description ? <p className="text-muted-foreground mt-0.5 text-xs">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
