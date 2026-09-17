/**
 * Money is stored and computed as integer kobo everywhere (PLAN.md §4.4,
 * AGENTS.md §8). These helpers are the only place kobo becomes a string, and
 * nothing here returns a float for further arithmetic.
 */

const KOBO_PER_NAIRA = 100;

/** Formats kobo for display, e.g. 1234567 -> "₦12,345.67". */
export function formatKobo(kobo: number, options: { showKobo?: boolean } = {}): string {
  assertIntegerKobo(kobo);
  const { showKobo = true } = options;

  const negative = kobo < 0;
  const absolute = Math.abs(kobo);
  const naira = Math.trunc(absolute / KOBO_PER_NAIRA);
  const remainder = absolute % KOBO_PER_NAIRA;

  const grouped = naira.toLocaleString("en-NG");
  const body = showKobo ? `${grouped}.${String(remainder).padStart(2, "0")}` : grouped;

  return `${negative ? "-" : ""}₦${body}`;
}

/**
 * Parses user input in naira into integer kobo.
 *
 * Returns null rather than NaN or a guess, so a caller must handle bad input
 * instead of silently writing a wrong amount to a ledger.
 */
export function parseNairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (cleaned === "" || !/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const negative = cleaned.startsWith("-");
  const [naira, fraction = ""] = cleaned.replace("-", "").split(".");
  const kobo = Number(naira) * KOBO_PER_NAIRA + Number(fraction.padEnd(2, "0"));

  return negative ? -kobo : kobo;
}

/**
 * Splits kobo into whole parts that sum exactly to the original.
 *
 * Used wherever a total is divided across line items or instalments. Naive
 * division loses or invents a kobo, and TESTS.md §5.4 asserts that never
 * happens across an invoice.
 */
export function splitKobo(total: number, parts: number): number[] {
  assertIntegerKobo(total);
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError(`parts must be a positive integer, received ${parts}`);
  }

  const base = Math.trunc(total / parts);
  const remainder = total - base * parts;
  const step = remainder < 0 ? -1 : 1;

  return Array.from({ length: parts }, (_, index) => (index < Math.abs(remainder) ? base + step : base));
}

function assertIntegerKobo(kobo: number): void {
  if (!Number.isInteger(kobo)) {
    throw new TypeError(`Money must be integer kobo, received ${kobo}`);
  }
}
