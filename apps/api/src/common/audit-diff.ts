export type AuditDiff = { before: Record<string, unknown>; after: Record<string, unknown> };

// null, undefined and "" all mean "not recorded", and a Date compares by
// its instant, so an untouched field never shows up as a change.
function normalise(value: unknown): unknown {
  if (value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return [...value].map(normalise).sort();
  return value;
}

/**
 * The fields an edit actually changed, as the before and after an audit row
 * stores. Only changed fields are kept, so the log reads as "phone: A → B"
 * rather than a copy of the whole record. Returns null when nothing changed,
 * so a save with no edits writes no audit row.
 *
 * `mask` hides a field's value in both halves — the log still shows that it
 * changed, e.g. a salary account number reduced to its last four digits.
 */
export function auditDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  mask: Record<string, (value: unknown) => unknown> = {},
): AuditDiff | null {
  const diff: AuditDiff = { before: {}, after: {} };
  for (const key of Object.keys(after)) {
    const was = normalise(before[key]);
    const now = normalise(after[key]);
    if (JSON.stringify(was) === JSON.stringify(now)) continue;
    const hide = mask[key] ?? ((value: unknown) => value);
    diff.before[key] = hide(was);
    diff.after[key] = hide(now);
  }
  return Object.keys(diff.after).length ? diff : null;
}
