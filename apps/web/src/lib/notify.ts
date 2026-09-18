import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";

/**
 * The one way the app tells someone an action finished. Every screen calls
 * this; nothing imports "sonner" directly — an ESLint rule enforces that.
 *
 * Centralised so that tone, timing and error wording are decided once:
 * - errors run through parseApiError, so a toast never shows raw JSON and a
 *   network failure never reads as "invalid password";
 * - errors stay up longer than successes, because they need reading and
 *   usually acting on;
 * - swapping the toast library later touches this file only.
 */
const SUCCESS_MS = 4_000;
const ERROR_MS = 8_000;

export type NotifyOptions = {
  /** A second, quieter line under the headline. */
  description?: string;
  /** Override the default display time, e.g. to keep an admission number up. */
  durationMs?: number;
};

export const notify = {
  success(message: string, options: NotifyOptions = {}) {
    toast.success(message, { description: options.description, duration: options.durationMs ?? SUCCESS_MS });
  },

  info(message: string, options: NotifyOptions = {}) {
    toast.info(message, { description: options.description, duration: options.durationMs ?? SUCCESS_MS });
  },

  warning(message: string, options: NotifyOptions = {}) {
    toast.warning(message, { description: options.description, duration: options.durationMs ?? ERROR_MS });
  },

  /**
   * Shows an API or network error as a readable toast and returns the parsed
   * error, so a form can also put the field messages beside its inputs:
   *
   *   const { fieldErrors } = notify.error(error, "Could not register this student.");
   */
  error(error: unknown, fallback: string, options: NotifyOptions = {}) {
    const parsed = parseApiError(error, fallback);
    const hasFields = Object.keys(parsed.fieldErrors).length > 0;

    // With field errors the form marks each input, so the toast only needs to
    // say that something needs fixing; the detail lives beside the fields.
    toast.error(hasFields ? "Please correct the highlighted fields." : parsed.message, {
      description: hasFields ? undefined : options.description,
      duration: options.durationMs ?? ERROR_MS,
    });
    return parsed;
  },
};
