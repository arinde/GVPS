import { z } from "zod";

/**
 * Plain-English validation messages for every schema in the API.
 *
 * zod's defaults are written for developers — "Too small: expected string to
 * have >=10 characters" — and they reach school office staff verbatim through
 * the form error summary. Configured once here rather than as a custom message
 * on every field, so a new schema gets readable errors without anyone having
 * to remember. A schema's own explicit message still wins.
 *
 * Returning undefined falls back to zod's default for anything not covered.
 */
z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        return issue.input === undefined || issue.input === null ? "Required" : undefined;

      case "too_small":
        if (issue.origin === "string") {
          return Number(issue.minimum) <= 1 ? "Required" : `Must be at least ${issue.minimum} characters`;
        }
        if (issue.origin === "array") return `Add at least ${issue.minimum}`;
        if (issue.origin === "number") return `Must be ${issue.minimum} or more`;
        return undefined;

      case "too_big":
        if (issue.origin === "string") return `Must be ${issue.maximum} characters or fewer`;
        if (issue.origin === "array") return `No more than ${issue.maximum} allowed`;
        if (issue.origin === "number") return `Must be ${issue.maximum} or less`;
        return undefined;

      case "invalid_format":
        if (issue.format === "email") return "Enter a valid email address";
        if (issue.format === "date") return "Enter a valid date";
        return undefined;

      case "invalid_value":
        return "Choose one of the listed options";

      default:
        return undefined;
    }
  },
});
