import { describe, expect, test } from "vitest";
import { formatUsdc, parseUsdc, splitAmount } from "./money";

describe("parseUsdc", () => {
  test("bounds numeric input and matches the database amount ceiling", () => {
    expect(parseUsdc("1000000000")).toBe(1_000_000_000_000_000n);
    expect(() => parseUsdc("1000000000.000001")).toThrow();
    expect(() => parseUsdc("9".repeat(33))).toThrow();
  });
  test.each([
    ["10", 10_000_000n],
    ["10,5", 10_500_000n],
    ["10.500000", 10_500_000n],
    ["1,000001", 1_000_001n],
  ])("converts %s to base units", (input, expected) => {
    expect(parseUsdc(input)).toBe(expected);
  });

  test.each(["", " ", "1.0000001", "-1", "+1", "0.5", "1e2", "texto", "1,2.3"])(
    "rejects invalid payment %s",
    (input) => {
      expect(() => parseUsdc(input)).toThrow();
    },
  );
});

describe("formatUsdc", () => {
  test.each([
    [10_500_000n, "10.50"],
    [1_000_000n, "1.00"],
    [1_000_001n, "1.000001"],
  ])("formats %s without floating point", (units, expected) => {
    expect(formatUsdc(units)).toBe(expected);
  });
});

describe("splitAmount", () => {
  test("splits 100 USDC equally", () => {
    expect(splitAmount(100_000_000n, [5000, 5000])).toEqual([
      50_000_000n,
      50_000_000n,
    ]);
  });

  test("assigns the integer remainder to the largest share", () => {
    expect(splitAmount(100_000_001n, [3333, 3333, 3334])).toEqual([
      33_330_000n,
      33_330_000n,
      33_340_001n,
    ]);
  });

  test.each([
    [100_000_000n, [10_000]],
    [100_000_000n, [5000, 4999]],
    [100_000_000n, [5000, 5000, 0]],
    [100_000_000n, [5000.5, 4999.5]],
    [999_999n, [5000, 5000]],
    [100_000_000n, [2000, 2000, 2000, 2000, 1000, 1000]],
  ])("rejects invalid split %#", (total, bps) => {
    expect(() => splitAmount(total, bps)).toThrow();
  });

  test("conserves every tested total exactly", () => {
    for (let index = 0; index < 1000; index += 1) {
      const total = 1_000_000n + BigInt(index * 7919);
      const parts = splitAmount(total, [3333, 3333, 3334]);
      expect(parts.reduce((sum, part) => sum + part, 0n)).toBe(total);
    }
  });
});
