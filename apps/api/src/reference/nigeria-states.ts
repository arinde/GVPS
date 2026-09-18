// Named ".data.json", not "nigeria-states.json": Jest resolves extensions in the
// order js, json, ts, so a same-named JSON file shadows this module.
import data from "@/reference/nigeria-states.data.json";

/**
 * Nigeria's 36 states and the Federal Capital Territory, with their 774 local
 * government areas. Static reference data, vendored rather than pulled in as a
 * runtime dependency, and kept as JSON because it is data — the 400-line cap
 * on code files (AGENTS.md §7) does not apply to it.
 *
 * Source: the "nigerian-states-and-lgas" npm package, v1.0.8 (ISC licence).
 * Audited before use: 37 entries, 774 LGAs, no duplicates, and every
 * per-state count matches the official figures. One correction applied: the
 * source spells Katsina as "Kastina". The counts are pinned by
 * nigeria-states.spec.ts, so an edit that drops or duplicates an LGA fails.
 *
 * A second candidate, "naija-state-local-government", was rejected: it lists
 * 846 LGAs, with duplicates in Edo.
 */
export type NigerianState = { state: string; lgas: string[] };

export const NIGERIAN_STATES: NigerianState[] = data;

const BY_NAME = new Map(NIGERIAN_STATES.map((entry) => [entry.state, new Set(entry.lgas)]));

export function isKnownState(state: string): boolean {
  return BY_NAME.has(state);
}

export function isLgaOfState(state: string, lga: string): boolean {
  return BY_NAME.get(state)?.has(lga) ?? false;
}
