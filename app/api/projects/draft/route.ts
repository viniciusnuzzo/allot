import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requestJson } from "@/app/lib/request-json";
import { supabaseServer } from "@/app/lib/supabase-server";

const inputSchema = z.object({ team: z.uuid(), draft: z.uuid(), decision: z.enum(["accept", "reject"]) });

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const input = inputSchema.safeParse(await requestJson(request));
  if (!input.success) return NextResponse.json({ error: "Invalid project draft." }, { status: 400 });
  const db = await supabaseServer();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user?.email_confirmed_at) {
    return NextResponse.json({ error: "Log in with a confirmed account." }, { status: 401 });
  }
  const { decision, ...details } = input.data;
  const { data, error } = await db.rpc(decision === "accept" ? "allot_agent_project_accept" : "allot_agent_project_reject", details);
  if (error) return NextResponse.json({ error: "Could not change project draft. Refresh and try again." }, { status: 400 });
  return NextResponse.json(decision === "accept" ? { id: data } : { rejected: true },
    { headers: { "Cache-Control": "private, no-store" } });
}
