import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { parseUsdc } from "@/app/lib/money";
import { paymentLinkSchema } from "@/app/lib/payment-link";
import { checkAgreementTransfers, readReceiptDetails } from "@/app/lib/receipt";
import { requestJson } from "@/app/lib/request-json";
import { client } from "@/app/lib/solana-client";
import { supabaseServer } from "@/app/lib/supabase-server";

const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("configure"), team: z.uuid(), budget: z.string(), maximum: z.string(),
    humanApprovalAbove: z.string(), recipientAddresses: z.array(z.string()).min(1).max(100), expiresAt: z.iso.datetime() }),
  z.object({ action: z.literal("review"), team: z.uuid(), requestId: z.uuid(), decision: z.enum(["approve", "reject"]) }),
  z.object({ action: z.literal("confirm"), requestId: z.uuid(), signature: z.string().min(64).max(88).regex(/^[1-9A-HJ-NP-Za-km-z]+$/) }),
]);

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const input = inputSchema.safeParse(await requestJson(request));
  if (!input.success) return NextResponse.json({ error: "Invalid agent payment request." }, { status: 400 });
  const db = await supabaseServer();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user?.email_confirmed_at) return NextResponse.json({ error: "Log in with a confirmed account." }, { status: 401 });

  if (input.data.action === "configure") {
    let budget: string; let maximum: string; let threshold: string;
    try {
      budget = parseUsdc(input.data.budget).toString();
      maximum = parseUsdc(input.data.maximum).toString();
      threshold = input.data.humanApprovalAbove === "0" ? "0" : parseUsdc(input.data.humanApprovalAbove).toString();
    } catch { return NextResponse.json({ error: "Enter valid test-USDC limits." }, { status: 400 }); }
    const { error } = await db.rpc("allot_agent_policy_set", { team: input.data.team, budget_units: budget,
      max_transaction_units: maximum, human_approval_above_units: threshold,
      recipient_addresses: input.data.recipientAddresses, expires_at: input.data.expiresAt });
    if (error) return NextResponse.json({ error: error.code === "P0001" ? error.message : "Could not save agent policy." }, { status: 400 });
    return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (input.data.action === "review") {
    const { error } = await db.rpc("allot_agent_payment_review", { team: input.data.team,
      request: input.data.requestId, decision: input.data.decision });
    if (error) return NextResponse.json({ error: error.code === "P0001" ? error.message : "Could not review payment request." }, { status: 400 });
    return NextResponse.json({ reviewed: true }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const { data: confirmation, error: lookupError } = await db.rpc("allot_agent_payment_confirmation", { request: input.data.requestId });
  const details = confirmation as { teamId?: unknown; shareId?: unknown } | null;
  if (lookupError || typeof details?.teamId !== "string" || typeof details.shareId !== "string") {
    return NextResponse.json({ error: "Payment request is unavailable." }, { status: 403 });
  }
  const [{ data: payment }, receipt] = await Promise.all([
    db.rpc("allot_payment", { share: details.shareId }), readReceiptDetails(client, input.data.signature),
  ]);
  const link = paymentLinkSchema.safeParse(payment);
  if (!link.success || receipt.receipt.agreementShareId !== details.shareId || receipt.receipt.requestId !== input.data.requestId || await checkAgreementTransfers(receipt.transaction, link.data) !== "match") {
    return NextResponse.json({ error: "Transaction does not match this approved agreement." }, { status: 400 });
  }
  const { error } = await db.rpc("allot_agent_payment_confirm", { team: details.teamId,
    request: input.data.requestId, signature: input.data.signature });
  if (error) return NextResponse.json({ error: "Could not confirm payment request." }, { status: 400 });
  return NextResponse.json({ confirmed: true }, { headers: { "Cache-Control": "private, no-store" } });
}
