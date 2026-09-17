import { z } from "zod";

// FEATURES.md doesn't specify a complexity policy, only that a change is
// forced on first login — a length floor is the one uncontroversial rule.
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
