// Dates arrive as ISO strings and are formatted only here, at the edge
// (AGENTS.md §8). UTC throughout, so a date of birth never shifts by a day
// with the viewer's timezone.

/** "2013-03-08" -> "8 March 2013" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** "2026-09-01" -> "September 2026" */
export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Whole years between a date of birth and `today`. */
export function ageInYears(dateOfBirth: string, today: Date = new Date()): number {
  const born = new Date(dateOfBirth);
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const birthdayPassed =
    today.getUTCMonth() > born.getUTCMonth() ||
    (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() >= born.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age;
}
