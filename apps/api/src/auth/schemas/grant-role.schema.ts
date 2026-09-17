import { z } from "zod";
import { Role } from "@prisma/client";

export const GrantRoleSchema = z.object({
  role: z.enum(Role),
});

export type GrantRoleDto = z.infer<typeof GrantRoleSchema>;
