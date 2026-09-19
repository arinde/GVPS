import type { ComponentProps } from "react";
import { cn } from "cn";
import { FIELD_CLASSES } from "@/components/common/field-styles";

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
 * Shares FIELD_CLASSES with TextInput, so selects and text fields match
 * exactly, including focus and the red border aria-invalid produces.
 */
export function NativeSelect({ options, placeholder, className, ...props }: NativeSelectProps) {
  return (
    <select
      {...props}
      // The browser draws its own arrow; pr-8 leaves room for it inside the
      // shared field styling.
      className={cn(FIELD_CLASSES, "w-full min-w-0 pr-8", className)}
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
