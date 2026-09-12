"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";

/**
 * Holds the store for one client tree.
 *
 * `useState` with a lazy initialiser is what keeps this per-request:
 * `makeStore()` runs once per mount rather than once per module load, so an SSR
 * render cannot share a store with the next request (AGENTS.md §3).
 *
 * This is not the state-for-derivable-values that §2 bans — the store is
 * created, never derived, and the setter is deliberately unused.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return <Provider store={store}>{children}</Provider>;
}
