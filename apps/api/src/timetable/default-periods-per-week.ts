/**
 * FEATURES.md §8.1 — a sensible starting weekly load per subject, so a form
 * teacher isn't stuck typing "1" for everything and fixing it by hand.
 *
 * The owner's own rule: the school has 40 generic learning periods a week
 * (every teaching period except the Wednesday Sports pair, the Thursday Club
 * pair, and Prep/Lesson, which aren't subject slots at all). Defaults should
 * fill that 40 when every subject a class is offered gets added — less if
 * only some are, never more. So this isn't a flat per-subject number: each
 * subject's default is its share of 40, weighted by standard Nigerian
 * UBE/NERDC and WAEC timetabling priority — Mathematics pinned level with
 * English at the top ("Maths should have more credit than others," the
 * owner's words, never below English) — down to once-a-week enrichment
 * subjects. Just a starting point — "then I can edit any one not ok by me."
 */
const WEIGHT_BY_CODE: Record<string, number> = {
  // Core twin subjects — heaviest share in every section.
  MTH: 5, // Mathematics
  ENG: 5, // English Language

  // Senior sciences — practicals usually earn a double period.
  PHY: 4, // Physics
  CHE: 4, // Chemistry
  BIO: 4, // Biology
  FMT: 4, // Further Mathematics

  // Other examinable senior subjects.
  GEO: 3, // Geography
  LIT: 3, // Literature in English
  GOV: 3, // Government
  HIS: 3, // History
  ACC: 3, // Financial Accounting
  ECO: 3, // Economics
  COM: 3, // Commerce
  OFP: 3, // Office Practice
  BUS: 3, // Business Studies
  BTE: 3, // Basic Technology
  BSC: 3, // Basic Science

  // Standard electives / once-or-twice-a-week subjects.
  SOS: 2, // Social Studies
  AGR: 2, // Agricultural Science
  ART: 2, // Fine Art
  CIV: 2, // Civic Education
  CRS: 2, // Christian Religious Studies
  ICT: 2, // Computer Studies
  CRA: 2, // Creative Arts
  PHE: 2, // Physical and Health Education
  HEC: 2, // Home Economics
  FRE: 2, // French

  // Entrance-exam enrichment subjects — lightest share.
  VER: 1, // Verbal Reasoning
  QNT: 1, // Quantitative Reasoning
};

const FALLBACK_WEIGHT = 2;

/** The 40 generic learning periods a week the owner's bell schedule sets aside for subjects. */
export const TOTAL_LEARNING_PERIODS_PER_WEEK = 40;

function weightForCode(code: string): number {
  return WEIGHT_BY_CODE[code] ?? FALLBACK_WEIGHT;
}

/**
 * Splits `total` periods across every subject in `codes`, proportional to
 * each one's standard weight, every subject getting at least 1. Uses the
 * largest-remainder method so the shares always sum to exactly `total` (not
 * "close to" it) when `codes` is the class's whole offered roster — adding
 * only some of them naturally sums to less, which is allowed.
 */
export function distributePeriods(
  codes: readonly string[],
  total: number = TOTAL_LEARNING_PERIODS_PER_WEEK,
): Map<string, number> {
  if (codes.length === 0) return new Map();

  const weights = codes.map(weightForCode);
  const sumWeights = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => (total * weight) / sumWeights);
  const shares = raw.map((value) => Math.max(1, Math.floor(value)));

  // Hand out whatever the floor left on the table, largest fractional part first.
  let leftover = total - shares.reduce((sum, share) => sum + share, 0);
  const byRemainder = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (leftover <= 0) break;
    shares[index]++;
    leftover--;
  }

  // The "at least 1 each" floor can itself push the total past the budget
  // when there are many subjects — trim back from the lightest-weighted first.
  const byWeightAscending = [...codes.keys()].sort((a, b) => weights[a] - weights[b]);
  let over = shares.reduce((sum, share) => sum + share, 0) - total;
  for (const index of byWeightAscending) {
    if (over <= 0) break;
    if (shares[index] <= 1) continue;
    shares[index]--;
    over--;
  }

  return new Map(codes.map((code, index) => [code, shares[index]]));
}
