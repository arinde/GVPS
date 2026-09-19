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

/** "Good morning" before noon, "Good afternoon" before five, then "Good evening". */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * When something happened, as short as it can be read: "10:42" today,
 * "Tue" this week, "8 Sep" before that. Local time — this is a clock, not a
 * date of birth.
 */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  if (at.toDateString() === now.toDateString()) {
    return at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
  if (now.getTime() - at.getTime() < sixDaysMs) return at.toLocaleDateString("en-GB", { weekday: "short" });
  return at.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
