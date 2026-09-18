import { isKnownState, isLgaOfState, NIGERIAN_STATES } from "@/reference/nigeria-states";

describe("NIGERIAN_STATES", () => {
  it("has 36 states plus the FCT", () => {
    expect(NIGERIAN_STATES).toHaveLength(37);
  });

  it("has exactly 774 local government areas", () => {
    expect(NIGERIAN_STATES.reduce((total, entry) => total + entry.lgas.length, 0)).toBe(774);
  });

  it("has no duplicate LGA within a state", () => {
    for (const entry of NIGERIAN_STATES) {
      expect(new Set(entry.lgas).size).toBe(entry.lgas.length);
    }
  });

  it.each([
    ["Kano", 44],
    ["Katsina", 34],
    ["Lagos", 20],
    ["Federal Capital Territory", 6],
    ["Bayelsa", 8],
  ])("%s has %i LGAs", (state, count) => {
    expect(NIGERIAN_STATES.find((entry) => entry.state === state)?.lgas).toHaveLength(count);
  });

  it("spells Katsina correctly (the source had Kastina)", () => {
    expect(isKnownState("Katsina")).toBe(true);
    expect(isKnownState("Kastina")).toBe(false);
  });
});

describe("isLgaOfState", () => {
  it("accepts an LGA inside its state", () => {
    const kano = NIGERIAN_STATES.find((entry) => entry.state === "Kano");
    expect(isLgaOfState("Kano", kano?.lgas[0] ?? "")).toBe(true);
  });

  it("rejects an LGA from a different state", () => {
    const lagos = NIGERIAN_STATES.find((entry) => entry.state === "Lagos");
    expect(isLgaOfState("Kano", lagos?.lgas[0] ?? "")).toBe(false);
  });
});
