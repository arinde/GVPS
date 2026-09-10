import { create } from "zustand";

/**
 * Ephemeral UI state only — what is open, what is selected, what is filtered
 * (AGENTS.md §3). No server data lives here; that is the RTK Query cache's job.
 *
 * Always read through a selector — `useUiStore((s) => s.openPanel)` — because
 * subscribing to the whole store re-renders on every unrelated change.
 */
type UiState = {
  /** Id of the panel or sheet currently open, or null when none is. */
  openPanel: string | null;
  /** Free-text filter per table, keyed by table id so two tables cannot collide. */
  tableFilters: Record<string, string>;

  openPanelById: (panelId: string) => void;
  closePanel: () => void;
  setTableFilter: (tableId: string, value: string) => void;
  clearTableFilter: (tableId: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  openPanel: null,
  tableFilters: {},

  openPanelById: (panelId) => set({ openPanel: panelId }),
  closePanel: () => set({ openPanel: null }),

  setTableFilter: (tableId, value) => set((state) => ({ tableFilters: { ...state.tableFilters, [tableId]: value } })),

  clearTableFilter: (tableId) =>
    set((state) => {
      const next = { ...state.tableFilters };
      delete next[tableId];
      return { tableFilters: next };
    }),
}));
