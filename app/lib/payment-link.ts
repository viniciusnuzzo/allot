import { address } from "@solana/kit";
import { z } from "zod";

import { formatUsdc, parseUsdc } from "./money";

const PUBLIC_ERROR = "This link is incomplete or damaged.";

const solanaAddressSchema = z.string().refine(
  (value) => {
    try {
      address(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid Solana address." },
);

const recipientSchema = z
  .object({
    name: z.string().trim().max(30),
    address: solanaAddressSchema,
    bps: z.number().int().positive().max(10_000),
  })
  .strict();

const amountSchema = z.string().transform((value, context) => {
  try {
    return formatUsdc(parseUsdc(value));
  } catch {
    context.addIssue({
      code: "custom",
      message: "Invalid amount.",
    });
    return z.NEVER;
  }
});

export const paymentLinkSchema = z
  .object({
    v: z.literal(1),
    title: z.string().trim().min(1).max(60),
    amount: z.union([amountSchema, z.null()]),
    recipients: z.array(recipientSchema).min(2).max(5),
  })
  .strict()
  .superRefine((link, context) => {
    const addresses = new Set(link.recipients.map((recipient) => recipient.address));
    if (addresses.size !== link.recipients.length) {
      context.addIssue({
        code: "custom",
        path: ["recipients"],
        message: "Recipient addresses must be unique.",
      });
    }

    const totalBps = link.recipients.reduce(
      (sum, recipient) => sum + recipient.bps,
      0,
    );
    if (totalBps !== 10_000) {
      context.addIssue({
        code: "custom",
        path: ["recipients"],
        message: "Percentages must add up to 100%.",
      });
    }
  });

export type Recipient = z.output<typeof recipientSchema>;
export type PaymentLink = z.output<typeof paymentLinkSchema>;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function base64UrlToBytes(payload: string): Uint8Array {
  if (payload.length > 8_192) throw new Error("payment link too large");
  if (!/^[A-Za-z0-9_-]+$/u.test(payload)) throw new Error("invalid base64url");

  const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodePaymentLink(link: PaymentLink): string {
  const validated = paymentLinkSchema.parse(link);
  const bytes = new TextEncoder().encode(JSON.stringify(validated));
  return bytesToBase64Url(bytes);
}

export function decodePaymentLink(payload: string): PaymentLink {
  try {
    const bytes = base64UrlToBytes(payload);
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const link = paymentLinkSchema.parse(JSON.parse(json));

    if (encodePaymentLink(link) !== payload) throw new Error("non-canonical");
    return link;
  } catch {
    throw new Error(PUBLIC_ERROR);
  }
}
