/**
 * The arm a school would add next: the letter after the highest one it has.
 * ["A", "B"] -> "C"; [] -> "A". Returns "" when there is no obvious next
 * letter (a "Z", or arms named otherwise), leaving the field for the person.
 */
export function nextArmName(existing: string[]): string {
  if (existing.length === 0) return "A";
  if (!existing.every((name) => /^[A-Z]$/.test(name))) return "";
  const highest = existing.reduce((max, name) => (name > max ? name : max));
  return highest === "Z" ? "" : String.fromCharCode(highest.charCodeAt(0) + 1);
}
