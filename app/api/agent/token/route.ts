import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requestJson } from "@/app/lib/request-json";
import { supabaseServer } from "@/app/lib/supabase-server";

const bodySchema = z.object({ team: z.uuid() });

async function changeToken(request: NextRequest, action: "create" | "revoke") {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const input = bodySchema.safeParse(await requestJson(request));
  if (!input.success) return NextResponse.json({ error: "Invalid team." }, { status: 400 });
  const db = await supabaseServer();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user?.email_confirmed_at) return NextResponse.json({ error: "Log in with a confirmed account." }, { status: 401 });
  const result = action === "create"
    ? await db.rpc("allot_agent_token_create", { team: input.data.team })
    : await db.rpc("allot_agent_token_revoke", { team: input.data.team });
  if (result.error) return NextResponse.json({ error: "Could not change agent access." }, { status: 403 });
  return NextResponse.json(action === "create" ? { token: result.data } : { revoked: true },
    { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) { return changeToken(request, "create"); }
export async function DELETE(request: NextRequest) { return changeToken(request, "revoke"); }
