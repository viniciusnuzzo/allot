import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { paymentLinkSchema } from "@/app/lib/payment-link";
import { parseUsdc } from "@/app/lib/money";
import { requestJson } from "@/app/lib/request-json";

const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("get_agreement"), team: z.uuid(), agreementId: z.uuid() }),
  z.object({ action: z.literal("create_agreement"), team: z.uuid(), payload: paymentLinkSchema,
    recipientIds: z.array(z.uuid()).min(2).max(5) })
    .refine((value) => value.recipientIds.length === value.payload.recipients.length &&
      new Set(value.recipientIds).size === value.recipientIds.length, "Choose distinct team members."),
  z.object({ action: z.literal("propose_change"), team: z.uuid(), agreementId: z.uuid(),
    payload: paymentLinkSchema, recipientIds: z.array(z.uuid()).min(2).max(5) })
    .refine((value) => value.recipientIds.length === value.payload.recipients.length &&
      new Set(value.recipientIds).size === value.recipientIds.length, "Choose distinct team members."),
  z.object({ action: z.literal("request_approval"), team: z.uuid(), draftId: z.uuid() }),
  z.object({ action: z.literal("request_payment"), team: z.uuid(), agreementId: z.uuid(),
    idempotencyKey: z.string().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/) }),
  z.object({ action: z.literal("get_payment_request"), team: z.uuid(), requestId: z.uuid() }),
  z.object({ action: z.literal("create_project"), team: z.uuid(), parent: z.uuid().nullable(),
    title: z.string().trim().min(1).max(60), budget: z.string().nullable() }),
]);

export async function POST(request: NextRequest) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get("authorization") ?? "");
  if (!match) return NextResponse.json({ error: "Invalid agent credential." }, { status: 401 });
  const parsed = inputSchema.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Agent API unavailable." }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const input = parsed.data;
  if (input.action === "request_payment" || input.action === "get_payment_request") {
    const { data, error } = await db.rpc(input.action === "request_payment"
      ? "allot_agent_payment_request" : "allot_agent_payment_get", input.action === "request_payment"
      ? { secret: match[1], team: input.team, split: input.agreementId, idempotency_key: input.idempotencyKey }
      : { secret: match[1], team: input.team, request: input.requestId });
    if (error || !data) return NextResponse.json({ error: "Payment request denied or unavailable." }, { status: 403 });
    const value = data as Record<string, unknown>;
    const paymentUrl = typeof value.shareId === "string"
      ? new URL(`/pagar?s=${value.shareId}&request=${value.id}`, request.nextUrl.origin).toString() : null;
    return NextResponse.json({ request: value, paymentUrl }, { headers: { "Cache-Control": "no-store" } });
  }
  if (input.action === "create_project") {
    let budgetUnits: string | null;
    try { budgetUnits = input.budget === null ? null : parseUsdc(input.budget).toString(); }
    catch { return NextResponse.json({ error: "Invalid test-USDC budget." }, { status: 400 }); }
    const { data, error } = await db.rpc("allot_agent_project_propose", {
      secret: match[1], team: input.team, parent: input.parent, title: input.title, budget_units: budgetUnits,
    });
    if (error) return NextResponse.json({ error: "Agent project request denied or unavailable." }, { status: 403 });
    return NextResponse.json({ draftId: data, status: "awaiting-human-creation" },
      { headers: { "Cache-Control": "no-store" } });
  }
  if (input.action === "request_approval") {
    const { error } = await db.rpc("allot_agent_request_approval", {
      secret: match[1], team: input.team, draft: input.draftId,
    });
    if (error) return NextResponse.json({ error: "Approval request denied or unavailable." }, { status: 403 });
    return NextResponse.json({ draftId: input.draftId, status: "awaiting-human-submission" },
      { headers: { "Cache-Control": "no-store" } });
  }
  const result = input.action === "get_agreement"
    ? await db.rpc("allot_agent_get", { secret: match[1], team: input.team, split: input.agreementId })
    : await db.rpc("allot_agent_propose", { secret: match[1], team: input.team, payload: input.payload,
      recipient_ids: input.recipientIds, base: input.action === "propose_change" ? input.agreementId : null });
  if (result.error) return NextResponse.json({ error: "Agent request denied or unavailable." }, { status: 403 });
  if (input.action === "get_agreement" && !result.data) return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  return NextResponse.json(input.action === "get_agreement"
    ? { agreement: result.data }
    : { draftId: result.data, status: "awaiting-human-submission" },
  { headers: { "Cache-Control": "no-store" } });
}
