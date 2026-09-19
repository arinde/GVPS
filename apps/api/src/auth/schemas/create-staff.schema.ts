import { z } from "zod";
import { Role } from "@prisma/client";
import { PhoneSchema } from "@/common/schemas/phone.schema";

const Name = z.string().trim().min(1).max(80);

// Superadmin-only (FEATURES.md §1.6, PLAN.md §4.12). Basic details are
// required so the office knows who an account belongs to — an email address
// alone does not say which Mrs Okafor it is. At least one role is required: an
// account with no roles can sign in but reach nothing, a confusing state to
// create on purpose.
export const CreateStaffSchema = z.object({
  firstName: Name,
  lastName: Name,
  otherNames: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: PhoneSchema,
  email: z.email(),
  roles: z.array(z.enum(Role)).min(1, "Choose at least one role"),
});

export type CreateStaffDto = z.infer<typeof CreateStaffSchema>;
