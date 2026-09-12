import { describe, expect, it } from "vitest";
import { formatKobo, parseNairaToKobo, splitKobo } from "@/lib/money";

describe("formatKobo", () => {
  it("formats kobo as naira with thousands separators", () => {
    expect(formatKobo(1234567)).toBe("₦12,345.67");
  });

  it("pads a single-digit kobo remainder", () => {
    expect(formatKobo(1205)).toBe("₦12.05");
  });

  it("formats zero", () => {
    expect(formatKobo(0)).toBe("₦0.00");
  });

  it("puts the sign before the currency symbol", () => {
    expect(formatKobo(-50000)).toBe("-₦500.00");
  });

  it("omits kobo when asked", () => {
    expect(formatKobo(1234567, { showKobo: false })).toBe("₦12,345");
  });

  it("rejects a non-integer amount rather than rounding it", () => {
    expect(() => formatKobo(12.5)).toThrow(TypeError);
  });
});

describe("parseNairaToKobo", () => {
  it.each([
    ["1234.56", 123456],
    ["₦1,234.56", 123456],
    ["1234", 123400],
    ["0.5", 50],
    ["0.05", 5],
    ["-12.34", -1234],
  ])("parses %s to %i kobo", (input, expected) => {
    expect(parseNairaToKobo(input)).toBe(expected);
  });

  it.each(["", "abc", "12.345", "1.2.3", "₦"])("returns null for %s", (input) => {
    expect(parseNairaToKobo(input)).toBeNull();
  });

  it("round-trips through formatKobo", () => {
    const kobo = parseNairaToKobo("45,000.25");
    expect(kobo).toBe(4500025);
    expect(formatKobo(kobo as number)).toBe("₦45,000.25");
  });
});

describe("splitKobo", () => {
  it("splits evenly when it divides cleanly", () => {
    expect(splitKobo(30000, 3)).toEqual([10000, 10000, 10000]);
  });

  it("distributes the remainder to the earliest parts, losing nothing", () => {
    expect(splitKobo(100, 3)).toEqual([34, 33, 33]);
  });

  it("always sums back to the original", () => {
    for (const total of [1, 7, 100, 12345, 999999]) {
      for (const parts of [1, 2, 3, 7, 12]) {
        const split = splitKobo(total, parts);
        expect(split).toHaveLength(parts);
        expect(split.reduce((sum, part) => sum + part, 0)).toBe(total);
      }
    }
  });

  it("handles a negative total without inventing a kobo", () => {
    const split = splitKobo(-100, 3);
    expect(split.reduce((sum, part) => sum + part, 0)).toBe(-100);
  });

  it("rejects a non-positive part count", () => {
    expect(() => splitKobo(100, 0)).toThrow(RangeError);
  });
});
