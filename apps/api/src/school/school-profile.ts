import { z } from "zod";

/** Entered as a percentage (7.5), stored as basis points (750) so no float reaches the money maths. */
export const SchoolProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(200).nullable(),
  phone: z.string().trim().max(30).nullable(),
  email: z.string().trim().email("Enter a valid email address.").max(120).nullable(),
  taxNumber: z.string().trim().max(40).nullable(),
  vatRatePercent: z.number().min(0).max(100),
});
export type SchoolProfileDto = z.infer<typeof SchoolProfileSchema>;

export function toBasisPoints(percent: number): number {
  return Math.round(percent * 100);
}

export function fromBasisPoints(bps: number): number {
  return bps / 100;
}
