import { describe, expect, it } from "vitest";

import {
  decodePaymentLink,
  encodePaymentLink,
  type PaymentLink,
} from "./payment-link";

const PUBLIC_ERROR = "This link is incomplete or damaged.";
const ADDRESSES = [
  "11111111111111111111111111111111",
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  "ComputeBudget111111111111111111111111111111",
] as const;

const validLink: PaymentLink = {
  v: 1,
  title: "Jantar de sábado",
  amount: "42.50",
  recipients: [
    { name: "Ana", address: ADDRESSES[0], bps: 5_000 },
    { name: "Bia", address: ADDRESSES[1], bps: 3_000 },
    { name: "Caio", address: ADDRESSES[2], bps: 2_000 },
  ],
};

function encodeRaw(value: unknown): string {
  const bytes = new TextEncoder().encode(
    typeof value === "string" ? value : JSON.stringify(value),
  );
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function expectPublicError(payload: string) {
  expect(() => decodePaymentLink(payload)).toThrow(PUBLIC_ERROR);
}

describe("payment-link", () => {
  it("rejects oversized encoded payload before decoding", () => {
    expect(() => decodePaymentLink("A".repeat(8193))).toThrow();
  });
  it("round-trips a fixed payment with three recipients", () => {
    const payload = encodePaymentLink(validLink);

    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(decodePaymentLink(payload)).toEqual(validLink);
  });

  it.each([
    ["invalid version", { ...validLink, v: 2 }],
    ["empty title", { ...validLink, title: "" }],
    ["title over 60 characters", { ...validLink, title: "x".repeat(61) }],
    [
      "duplicate addresses with different names",
      {
        ...validLink,
        recipients: [
          validLink.recipients[0],
          { ...validLink.recipients[0], name: "Outra", bps: 3_000 },
          { ...validLink.recipients[2], bps: 2_000 },
        ],
      },
    ],
    [
      "invalid address",
      {
        ...validLink,
        recipients: [
          { ...validLink.recipients[0], address: "nao-e-uma-carteira" },
          ...validLink.recipients.slice(1),
        ],
      },
    ],
    ["one recipient", { ...validLink, recipients: [validLink.recipients[0]] }],
    [
      "six recipients",
      {
        ...validLink,
        recipients: ADDRESSES.map((recipientAddress, index) => ({
          name: `Pessoa ${index}`,
          address: recipientAddress,
          bps: index === 5 ? 1_665 : 1_667,
        })),
      },
    ],
    [
      "basis points sum mismatch",
      {
        ...validLink,
        recipients: validLink.recipients.map((recipient, index) => ({
          ...recipient,
          bps: index === 0 ? 4_999 : recipient.bps,
        })),
      },
    ],
    ["amount below 1 USDC", { ...validLink, amount: "0.999999" }],
  ])("rejects %s", (_label, link) => {
    expectPublicError(encodeRaw(link));
  });

  it("rejects malformed base64url", () => {
    expectPublicError("abc+");
  });

  it("rejects invalid JSON", () => {
    expectPublicError(encodeRaw("{not-json"));
  });

  it("rejects non-canonical payloads", () => {
    expectPublicError(encodeRaw(` ${JSON.stringify(validLink)}`));
  });
});
