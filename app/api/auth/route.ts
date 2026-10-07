import { NextRequest, NextResponse } from "next/server";
import { authInput, accountReturnPath } from "@/app/lib/account-validation";
import { supabaseServer } from "@/app/lib/supabase-server";
import { requestJson } from "@/app/lib/request-json";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const parsed = authInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Check your details. New passwords need 12 to 128 characters." }, { status: 400 });
  const input = parsed.data;
  const db = await supabaseServer();
  if (input.action === "signup") {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("next", accountReturnPath(input.next));
    const { error } = await db.auth.signUp({ email: input.email, password: input.password, options: { data: { name: input.name }, emailRedirectTo: callback.href } });
    if (error) return NextResponse.json({ error: "Could not sign up. Check your details or try again later." }, { status: 400 });
    return NextResponse.json({ message: "Check your email to confirm your account, then log in." });
  }
  if (input.action === "login") {
    const { data, error } = await db.auth.signInWithPassword(input);
    if (error || !data.user?.email_confirmed_at) {
      await db.auth.signOut();
      return NextResponse.json({ error: "Could not log in. Check your email, password, and email confirmation." }, { status: 400 });
    }
    return NextResponse.json({ next: accountReturnPath(input.next) });
  }
  if (input.action === "recovery") {
    const callback = new URL("/auth/callback?next=/reset-password", request.url);
    await db.auth.resetPasswordForEmail(input.email, { redirectTo: callback.href });
    return NextResponse.json({ message: "If the account can receive a reset email, a link will be sent. Check your inbox." });
  }
  if (input.action === "reset") {
    const { data: { user }, error: identityError } = await db.auth.getUser();
    if (identityError || !user) return NextResponse.json({ error: "Open a valid password-reset email first." }, { status: 401 });
    const { error } = await db.auth.updateUser({ password: input.password });
    if (error) return NextResponse.json({ error: "Could not update the password. Request a new reset link." }, { status: 400 });
    await db.auth.signOut();
    return NextResponse.json({ next: "/login" });
  }
  const { error } = await db.auth.signOut();
  if (error) return NextResponse.json({ error: "Could not log out. Try again." }, { status: 400 });
  return NextResponse.json({ next: "/login" });
}
