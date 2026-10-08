import { NextRequest, NextResponse } from "next/server";

import { paymentLinkSchema } from "@/app/lib/payment-link";
import { supabaseServer } from "@/app/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/agreements/[id]">,
) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid agreement ID." }, { status: 400 });
  }

  const db = await supabaseServer();
  const { data: { user }, error: identityError } = await db.auth.getUser();
  if (identityError || !user?.email_confirmed_at) {
    return NextResponse.json({ error: "Log in with a confirmed account." }, { status: 401 });
  }

  const { data: split, error } = await db.from("allot_splits")
    .select("id,team_id,payload,recipient_ids,state,share_id,created_at")
    .eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load agreement." }, { status: 503 });
  if (!split) return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  const payload = paymentLinkSchema.safeParse(split.payload);
  if (!payload.success) return NextResponse.json({ error: "Stored agreement is invalid." }, { status: 503 });

  const { data: decisions, error: decisionError } = await db.from("allot_decisions")
    .select("user_id,decision,requested_bps")
    .eq("split_id", id);
  if (decisionError) return NextResponse.json({ error: "Could not load approvals." }, { status: 503 });
  const { data: decisionHistory, error: historyError } = await db.from("allot_decision_events")
    .select("id,user_id,decision,requested_bps,recorded_at")
    .eq("split_id", id).order("id", { ascending: true });

  return NextResponse.json({
    id: split.id,
    teamId: split.team_id,
    version: split.id,
    state: split.state,
    payload: payload.data,
    recipientIds: split.recipient_ids,
    decisions: decisions ?? [],
    decisionHistory: historyError ? null : decisionHistory ?? [],
    paymentLink: split.state === "published" ? `/pagar?s=${split.share_id}` : null,
    createdAt: split.created_at,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
