import { describe, expect, it } from "vitest";

import { normalizePaymentError } from "./payment-errors";

const SIGNATURE = "4".repeat(88);

describe("normalizePaymentError", () => {
  it.each([
    [
      "insufficient USDC",
      Object.assign(new Error("insufficient tokens"), { code: "INSUFFICIENT_USDC" }),
      {
        message: "Insufficient USDC balance.",
        canRetry: true,
      },
    ],
    [
      "insufficient SOL",
      Object.assign(new Error("insufficient lamports"), { code: "INSUFFICIENT_SOL" }),
      {
        message: "Insufficient SOL balance to pay the fee.",
        canRetry: true,
      },
    ],
    [
      "wallet rejection",
      Object.assign(new Error("User rejected the request"), { code: 4001 }),
      {
        message: "Signature canceled. Nothing was charged.",
        canRetry: true,
      },
    ],
    [
      "network failure without signature",
      new Error("fetch failed"),
      {
        message: "Could not confirm whether payment went through. Check your wallet history before trying again.",
        canRetry: false,
      },
    ],
    [
      "network failure with signature",
      Object.assign(new Error("confirmation timed out"), { signature: SIGNATURE }),
      {
        message:
          "Confirmation failed. Check the receipt before trying again.",
        canRetry: false,
        signature: SIGNATURE,
      },
    ],
  ])("maps %s", (_label, error, expected) => {
    expect(normalizePaymentError(error)).toEqual(expected);
  });
});
