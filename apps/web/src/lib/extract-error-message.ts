import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

/** Pulls the backend's Nest exception message out of an RTK Query error, with a generic fallback. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (!isFetchBaseQueryError(error)) return fallback;

  const data = error.data;
  if (data && typeof data === "object" && "message" in data) {
    const { message } = data as { message: unknown };
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
      return message.join(" ");
    }
  }

  return fallback;
}
