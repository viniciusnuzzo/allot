import { z } from "zod";
import { paymentLinkSchema } from "./payment-link";

export function accountReturnPath(value: unknown): string {
  if (typeof value !== "string") return "/teams";
  if (value === "/teams" || /^\/teams\/[a-f0-9-]{36}$/i.test(value)) return value;
  if (/^\/join\?code=[a-f0-9]{32}$/i.test(value)) return value;
  if (value === "/reset-password") return value;
  return "/teams";
}

const email = z.email().max(254);
const password = z.string().min(12).max(128);
export const authInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("signup"), email, password, name: z.string().trim().min(1).max(30), next: z.string().optional() }),
  z.object({ action: z.literal("login"), email, password: z.string().min(1).max(128), next: z.string().optional() }),
  z.object({ action: z.literal("recovery"), email }),
  z.object({ action: z.literal("reset"), password }),
  z.object({ action: z.literal("logout") }),
]);

const team = z.uuid();
export const teamInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().trim().min(1).max(60) }),
  z.object({ action: z.literal("join"), code: z.string().trim().toLowerCase().regex(/^[a-f0-9]{32}$/) }),
  z.object({ action: z.literal("invite"), team }),
  z.object({ action: z.literal("remove"), team, user_id: z.uuid() }),
  z.object({ action: z.literal("submit"), team, payload: paymentLinkSchema, recipient_ids: z.array(z.uuid()).min(2).max(5) })
    .refine((v) => v.recipient_ids.length === v.payload.recipients.length && new Set(v.recipient_ids).size === v.recipient_ids.length, "Choose distinct team members."),
  z.object({ action: z.literal("decide"), team, split: z.uuid(), decision: z.enum(["accepted", "rejected", "countered"]), requested_bps: z.number().int().min(1).max(10000).optional() })
    .refine((v) => v.decision !== "countered" || v.requested_bps !== undefined, "Enter the percentage you request."),
  z.object({ action: z.literal("publish"), team, split: z.uuid() }),
]);
