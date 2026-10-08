import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { parseUsdc } from "@/app/lib/money";
import { requestJson } from "@/app/lib/request-json";
import { supabaseServer } from "@/app/lib/supabase-server";

const inputSchema = z.object({
  team: z.uuid(),
  parent: z.uuid().nullable(),
  title: z.string().trim().min(1).max(60),
  budget: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const input = inputSchema.safeParse(await requestJson(request));
  if (!input.success) return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  let units: string | null = null;
  try {
    units = input.data.budget === null ? null : parseUsdc(input.data.budget).toString();
  } catch {
    return NextResponse.json({ error: "Invalid test-USDC budget." }, { status: 400 });
  }
  const db = await supabaseServer();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user?.email_confirmed_at) {
    return NextResponse.json({ error: "Log in with a confirmed account." }, { status: 401 });
  }
  const { data, error } = await db.rpc("allot_project_create", {
    team: input.data.team, parent: input.data.parent, title: input.data.title, budget_units: units,
  });
  if (error) return NextResponse.json({ error: "Could not create project. Check its parent budget and try again." }, { status: 400 });
  return NextResponse.json({ id: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
