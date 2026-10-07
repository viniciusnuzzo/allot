import { requireAccount } from "@/app/lib/supabase-server";
import { TeamDashboard, LogoutButton } from "@/app/components/team-dashboard";
import type { Team } from "@/app/lib/teams";

export default async function TeamsPage() {
  const { db } = await requireAccount();
  const { data, error } = await db.from("allot_teams").select("id,name,owner_id").order("created_at");
  return <><header className="app-header flex flex-wrap items-center justify-between gap-5"><div><h1 className="app-title">Your teams</h1><p className="app-intro">Agree on the split before sharing a payment link.</p></div><LogoutButton /></header>{error ? <p role="alert" className="notice-error">Could not load your teams. Refresh and try again.</p> : <TeamDashboard teams={(data ?? []) as Team[]} />}</>;
}
