export type ParsedApiError = {
  /** One readable sentence (or a few) for the summary above the submit button. */
  message: string;
  /** Per-field messages keyed by the API's dotted path, e.g. "guardians.0.phone". */
  fieldErrors: Record<string, string>;
};

type ValidationIssue = { path: (string | number)[]; message: string };

function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as ValidationIssue).path) &&
    typeof (value as ValidationIssue).message === "string"
  );
}

/**
 * Turns an API path into words a person recognises:
 * "newPassword" → "New password", "guardians.0.phone" → "Guardian 1 phone".
 */
export function humanizePath(path: (string | number)[]): string {
  const words = path.map((segment) => {
    if (typeof segment === "number") return String(segment + 1);
    const spaced = segment.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    // "guardians" reads better as "guardian" when followed by its number.
    return spaced.endsWith("s") && path.length > 1 ? spaced.slice(0, -1) : spaced;
  });
  const sentence = words
    .join(" ")
    .replace(/\bid\b/g, "")
    .trim();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Understands every error shape the API and the network produce:
 *
 * - a plain string message (Nest exceptions: 401, 404, 409…);
 * - a list of strings;
 * - a list of { path, message } validation issues from ZodValidationPipe,
 *   which also become per-field errors so forms can mark the right input;
 * - RTK Query's own FETCH_ERROR / TIMEOUT_ERROR when the server is
 *   unreachable, which must not read as "invalid password".
 */
export function parseApiError(error: unknown, fallback: string): ParsedApiError {
  const empty: ParsedApiError = { message: fallback, fieldErrors: {} };
  if (typeof error !== "object" || error === null || !("status" in error)) return empty;

  const { status, data } = error as { status: unknown; data?: unknown };

  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
    return { message: "Can't reach the server. Check your connection and try again.", fieldErrors: {} };
  }
  if (status === 429) {
    return { message: "Too many attempts. Wait a minute and try again.", fieldErrors: {} };
  }

  const message = data && typeof data === "object" && "message" in data ? (data as { message: unknown }).message : null;

  if (typeof message === "string") return { message, fieldErrors: {} };

  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return { message: message.join(" "), fieldErrors: {} };
  }

  if (Array.isArray(message) && message.every(isValidationIssue)) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of message) {
      const key = issue.path.join(".");
      // First message per field wins; a second rarely adds anything.
      fieldErrors[key] ??= issue.message;
    }
    const lines = message.map((issue) =>
      issue.path.length > 0 ? `${humanizePath(issue.path)}: ${issue.message}` : issue.message,
    );
    return { message: [...new Set(lines)].join(". "), fieldErrors };
  }

  if (typeof status === "number" && status >= 500) {
    return { message: "Something went wrong on the server. Please try again.", fieldErrors: {} };
  }

  return empty;
}

/**
 * The errors under one prefix, with the prefix removed — how a repeated
 * section gets its own messages: scopedErrors(errors, "guardians.0") turns
 * "guardians.0.phone" into "phone".
 */
export function scopedErrors(fieldErrors: Record<string, string>, prefix: string): Record<string, string> {
  const scoped: Record<string, string> = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    if (key.startsWith(`${prefix}.`)) scoped[key.slice(prefix.length + 1)] = message;
  }
  return scoped;
}

/**
 * The errors minus the named keys, or minus everything under a prefix when a
 * key ends in "." — how a form clears only what the user just corrected.
 */
export function withoutFieldErrors(fieldErrors: Record<string, string>, keys: string[]): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter(
      ([key]) => !keys.some((cleared) => (cleared.endsWith(".") ? key.startsWith(cleared) : key === cleared)),
    ),
  );
}
