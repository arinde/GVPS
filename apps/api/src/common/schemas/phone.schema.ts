import { z } from "zod";

// Nigerian numbers, entered however the parent writes them: 08012345678,
// +2348012345678, or with spaces. Normalised to +234XXXXXXXXXX so the same
// parent is recognised as the same person across their children
// (PLAN.md §4.6 — guardians are shared entities, not per-student fields).
// Shared by guardians and staff, so both are normalised identically.
export const PhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^(\+?234|0)\d{10}$/.test(value), "Enter a valid Nigerian phone number")
  .transform((value) =>
    value.startsWith("0") ? `+234${value.slice(1)}` : value.startsWith("+") ? value : `+${value}`,
  );
