import type { Role } from "@prisma/client";

/** Shape JwtStrategy attaches to `request.user` once a token is verified. */
export type AuthenticatedStaff = {
  id: string;
  schoolId: string;
  email: string;
  roles: Role[];
  mustChangePassword: boolean;
};
