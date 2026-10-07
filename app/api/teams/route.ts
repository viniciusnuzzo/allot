import { NextRequest, NextResponse } from "next/server";
import { teamInput } from "@/app/lib/account-validation";
import { supabaseServer } from "@/app/lib/supabase-server";
import { requestJson } from "@/app/lib/request-json";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const input = teamInput.safeParse(await requestJson(request));
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message || "Invalid details." }, { status: 400 });
  const db = await supabaseServer();
  const { data: { user }, error: identityError } = await db.auth.getUser();
  if (identityError || !user?.email_confirmed_at) return NextResponse.json({ error: "Log in with a confirmed account." }, { status: 401 });
  const { action, ...details } = input.data;
  const { data, error } = await db.rpc("allot_action", {
    action,
    team: "team" in details ? details.team : null,
    split: "split" in details ? details.split : null,
    data: details,
  });
  if (error) return NextResponse.json({ error: error.code === "P0001" ? error.message : "Could not save this change. Refresh and try again." }, { status: 400 });
  return NextResponse.json(data);
}
