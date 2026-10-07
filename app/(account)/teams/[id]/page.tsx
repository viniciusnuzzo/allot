import { notFound } from "next/navigation";
import { requireAccount } from "@/app/lib/supabase-server";
import { TeamWorkspace } from "@/app/components/team-workspace";
import type { Team, Member, Split, Decision } from "@/app/lib/teams";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const { db, user } = await requireAccount(`/teams/${id}`);
  const [{ data: team, error: teamError }, { data: members, error: memberError }, { data: splits, error: splitError }] = await Promise.all([
    db.from("allot_teams").select("id,name,owner_id").eq("id", id).maybeSingle(),
    db.from("allot_members").select("team_id,user_id,name").eq("team_id", id).order("name"),
    db.from("allot_splits").select("*").eq("team_id", id).order("created_at", { ascending: false }).limit(30),
  ]);
  if (teamError || memberError || splitError) return <p role="alert" className="notice-error mt-8">Could not load this team. Refresh and try again.</p>;
  if (!team) notFound();
  const ids = (splits ?? []).map((split) => split.id);
  const { data: decisions, error } = ids.length ? await db.from("allot_decisions").select("*").in("split_id", ids) : { data: [], error: null };
  if (error) return <p role="alert" className="notice-error mt-8">Could not load approvals. Refresh and try again.</p>;
  return <TeamWorkspace key={splits?.[0]?.id ?? id} team={team as Team} members={(members ?? []) as Member[]} splits={(splits ?? []) as Split[]} decisions={(decisions ?? []) as Decision[]} userId={user.id} />;
}
