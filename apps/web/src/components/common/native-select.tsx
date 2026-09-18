import type { ComponentProps } from "react";
import { cn } from "cn";

export type SelectOption = { value: string; label: string };

export type NativeSelectProps = Omit<ComponentProps<"select">, "children"> & {
  options: SelectOption[];
  /** Shown as a first, empty choice — "Select a state…". Omit to force a value. */
  placeholder?: string;
};

/**
 * A styled native <select>, used for every dropdown in data-entry forms.
 *
 * Native on purpose, not a custom popover: on a phone it opens the operating
 * system's own picker, and on a keyboard typing "K" jumps to Kano. For a
 * secretary entering a whole class, both matter more than a custom look.
 * Matches shadcn's Input so fields line up, including the red border that
 * aria-invalid produces.
 */
export function NativeSelect({ options, placeholder, className, ...props }: NativeSelectProps) {
  return (
    <select
      {...props}
      className={cn(
        "border-input bg-card h-9 w-full min-w-0 rounded-md border px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
