import { z } from "zod";

/**
 * An optional field whose form control sends "" when left empty.
 *
 * The blank is turned into undefined before validation, so a real value is
 * checked by `schema` alone and its own message reaches the user. The obvious
 * alternative, `schema.optional().or(z.literal(""))`, builds a union — and a
 * failed union reports a bare "Invalid input", losing "Choose a bank from the
 * list" and every other specific message.
 */
export function blankAsUndefined<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
}
