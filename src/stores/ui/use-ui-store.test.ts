import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "@/stores/ui/use-ui-store";

const initial = useUiStore.getState();

beforeEach(() => {
  useUiStore.setState(initial, true);
});

describe("useUiStore", () => {
  it("opens and closes a panel", () => {
    useUiStore.getState().openPanelById("student-sheet");
    expect(useUiStore.getState().openPanel).toBe("student-sheet");

    useUiStore.getState().closePanel();
    expect(useUiStore.getState().openPanel).toBeNull();
  });

  it("keeps each table's filter separate", () => {
    useUiStore.getState().setTableFilter("students", "adeyemi");
    useUiStore.getState().setTableFilter("guardians", "okafor");

    expect(useUiStore.getState().tableFilters).toEqual({
      students: "adeyemi",
      guardians: "okafor",
    });
  });

  it("clears one filter without touching the others", () => {
    useUiStore.getState().setTableFilter("students", "adeyemi");
    useUiStore.getState().setTableFilter("guardians", "okafor");

    useUiStore.getState().clearTableFilter("students");

    expect(useUiStore.getState().tableFilters).toEqual({ guardians: "okafor" });
  });

  it("replaces rather than appends when the same table filters twice", () => {
    useUiStore.getState().setTableFilter("students", "ade");
    useUiStore.getState().setTableFilter("students", "adeyemi");

    expect(useUiStore.getState().tableFilters.students).toBe("adeyemi");
  });
});
