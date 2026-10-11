import { supabaseServer } from "@/app/lib/supabase-server";

export async function AccountNavigation() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (user?.email_confirmed_at) return <a href="/teams" className="button-primary">My teams</a>;
  return <div className="flex gap-2"><a href="/login" className="button-secondary">Log in</a><a href="/signup" className="button-primary">Sign up</a></div>;
}
