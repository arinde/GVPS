/**
 * STITCH-GLOBAL.md §4 and §10 for every text-like control: 40px tall, 8px
 * corners, a #B9C5CE border that turns sidebar navy on focus over a pale-blue
 * fill. The 2px focus border is drawn as border plus a 1px inset shadow so
 * the field does not shift by a pixel when focused.
 *
 * Shared by TextInput and NativeSelect so the two can never drift apart.
 */
export const FIELD_CLASSES = [
  "h-10 rounded-lg border border-input bg-white px-3 text-sm text-foreground shadow-none",
  "placeholder:text-placeholder",
  "focus-visible:border-navy focus-visible:bg-input-focus focus-visible:shadow-[inset_0_0_0_1px_var(--navy)] focus-visible:ring-0",
  "aria-invalid:border-destructive aria-invalid:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");
