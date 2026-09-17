import { z } from "zod";
import { Role } from "@prisma/client";

// Superadmin-only (FEATURES.md §1.6, PLAN.md §4.12). At least one role is
// required — an account with no roles can log in but can reach nothing,
// which is a confusing state to create on purpose.
export const CreateStaffSchema = z.object({
  email: z.email(),
  roles: z.array(z.enum(Role)).min(1),
});

export type CreateStaffDto = z.infer<typeof CreateStaffSchema>;
