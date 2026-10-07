import { MAX_RECIPIENTS, MIN_PAYMENT_UNITS, USDC_DECIMALS } from "./config";

const USDC_SCALE = 10n ** BigInt(USDC_DECIMALS);

export function parseUsdc(input: string): bigint {
  if (input.length > 32) throw new Error("invalid USDC amount");
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,6})?$/.test(normalized)) {
    throw new Error("invalid USDC amount");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const units =
    BigInt(whole) * USDC_SCALE + BigInt(fraction.padEnd(USDC_DECIMALS, "0"));

  if (units < MIN_PAYMENT_UNITS) {
    throw new Error("payment must be at least 1 USDC");
  }
  if (units > 1_000_000_000n * USDC_SCALE) throw new Error("payment exceeds 1 billion USDC");

  return units;
}

export function formatUsdc(units: bigint): string {
  if (units < 0n) {
    throw new Error("USDC amount cannot be negative");
  }

  const whole = units / USDC_SCALE;
  let fraction = (units % USDC_SCALE).toString().padStart(USDC_DECIMALS, "0");
  while (fraction.length > 2 && fraction.endsWith("0")) {
    fraction = fraction.slice(0, -1);
  }
  return `${whole}.${fraction}`;
}

export function splitAmount(total: bigint, bps: readonly number[]): bigint[] {
  if (total < MIN_PAYMENT_UNITS) {
    throw new Error("payment must be at least 1 USDC");
  }
  if (bps.length < 2 || bps.length > MAX_RECIPIENTS) {
    throw new Error("split must have 2 to 5 recipients");
  }
  if (bps.some((share) => !Number.isInteger(share) || share <= 0)) {
    throw new Error("basis points must be positive integers");
  }
  if (bps.reduce((sum, share) => sum + share, 0) !== 10_000) {
    throw new Error("basis points must sum to 10000");
  }

  const parts = bps.map((share) => (total * BigInt(share)) / 10_000n);
  const remainder = total - parts.reduce((sum, part) => sum + part, 0n);
  let largestIndex = 0;
  for (let index = 1; index < bps.length; index += 1) {
    if (bps[index] > bps[largestIndex]) {
      largestIndex = index;
    }
  }
  parts[largestIndex] += remainder;
  return parts;
}
