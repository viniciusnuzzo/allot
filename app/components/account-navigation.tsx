import Link from "next/link";
import { supabaseServer } from "@/app/lib/supabase-server";

export async function AccountNavigation() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (user?.email_confirmed_at) return <Link href="/teams" className="button-primary">My teams</Link>;
  return <div className="flex gap-2"><Link href="/login" className="button-secondary">Log in</Link><Link href="/signup" className="button-primary">Sign up</Link></div>;
}
