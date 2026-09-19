import { Role } from "@prisma/client";

/**
 * Which students a staff member may see (FEATURES.md §1.5, §14).
 *
 * - "school": every student in their school.
 * - "arms":   only students actively enrolled, this session, in these arms.
 *             An empty list is a real answer — a teacher with no class
 *             allocated sees nobody, rather than falling back to everyone.
 */
export type StudentScope = { kind: "school" } | { kind: "arms"; sessionId: string | null; armIds: string[] };

// FEATURES.md §14, student registry row: superadmin and admin read and write,
// principal and bursar read, all school-wide.
//
// Known simplification: §1.1 scopes the principal to a section (primary or
// secondary). Nothing yet records which section a principal heads, so a
// principal is school-wide until it does.
const WHOLE_SCHOOL_READERS: readonly Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.BURSAR, Role.ADMIN_SECRETARY];

// Who may register into any class.
const REGISTER_ANYWHERE: readonly Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY];

// Who may register into their own allocated classes. FEATURES.md §14 gives form
// teachers read-only access; the school asked for teachers to register their
// own class, so this deliberately widens the spec.
const REGISTER_OWN_CLASS: readonly Role[] = [Role.FORM_TEACHER];

const holdsAny = (roles: readonly Role[], allowed: readonly Role[]) => roles.some((role) => allowed.includes(role));

/**
 * The scope implied by roles plus the arms allocated this session. The widest
 * grant wins: a teacher who is also the secretary sees the whole school.
 */
export function scopeFor(roles: readonly Role[], sessionId: string | null, allocatedArmIds: string[]): StudentScope {
  if (holdsAny(roles, WHOLE_SCHOOL_READERS)) return { kind: "school" };
  return { kind: "arms", sessionId, armIds: allocatedArmIds };
}

/** Whether these roles, with these allocated arms, may register a student into `armId`. */
export function mayRegisterInto(roles: readonly Role[], allocatedArmIds: string[], armId: string): boolean {
  if (mayRegisterAnywhere(roles)) return true;
  return holdsAny(roles, REGISTER_OWN_CLASS) && allocatedArmIds.includes(armId);
}

/** Whether these roles may register into any class, not just allocated ones. */
export function mayRegisterAnywhere(roles: readonly Role[]): boolean {
  return holdsAny(roles, REGISTER_ANYWHERE);
}

/** Whether these roles could register anyone at all — drives the nav and form. */
export function mayRegisterAtAll(roles: readonly Role[]): boolean {
  return holdsAny(roles, REGISTER_ANYWHERE) || holdsAny(roles, REGISTER_OWN_CLASS);
}

/** Every role that could reach the registration endpoint, for the controller guard. */
export const REGISTRATION_ROLES: readonly Role[] = [...REGISTER_ANYWHERE, ...REGISTER_OWN_CLASS];
