import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requestJson } from "@/app/lib/request-json";
import { supabaseServer } from "@/app/lib/supabase-server";

const inputSchema = z.object({ team: z.uuid(), split: z.uuid(), project: z.uuid().nullable() });

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const input = inputSchema.safeParse(await requestJson(request));
  if (!input.success) return NextResponse.json({ error: "Invalid project link." }, { status: 400 });
  const db = await supabaseServer();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user?.email_confirmed_at) {
    return NextResponse.json({ error: "Log in with a confirmed account." }, { status: 401 });
  }
  const { error } = await db.rpc("allot_project_link", input.data);
  if (error) return NextResponse.json({ error: "Link this agreement before anyone decides, then retry." }, { status: 400 });
  return NextResponse.json({ linked: true }, { headers: { "Cache-Control": "private, no-store" } });
}
