type Named = { firstName: string | null; lastName: string | null; email: string };

/**
 * How a staff member is named on screen: "Okafor, Ngozi", surname first to
 * match the registers the office already keeps. Falls back to the email for
 * accounts created before staff details existed, such as the bootstrap
 * superadmin.
 */
export function staffName(staff: Named): string {
  if (staff.lastName && staff.firstName) return `${staff.lastName}, ${staff.firstName}`;
  return staff.lastName ?? staff.firstName ?? staff.email;
}
