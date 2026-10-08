import { notFound } from "next/navigation";
import { requireAccount } from "@/app/lib/supabase-server";
import { TeamWorkspace } from "@/app/components/team-workspace";
import type { Team, Member, Split, Decision, DecisionEvent, Project, AgentProjectDraft, AgentActivity } from "@/app/lib/teams";
import type { AgentDraft } from "@/app/lib/teams";
import { paymentLinkSchema } from "@/app/lib/payment-link";

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
  const eventResult = ids.length ? await db.from("allot_decision_events").select("id,split_id,user_id,decision,requested_bps,recorded_at").in("split_id", ids).order("id", { ascending: true }) : { data: [], error: null };
  const projectResult = await db.from("allot_projects").select("id,team_id,parent_id,title,budget_units").eq("team_id", id).order("created_at", { ascending: true });
  const projectDraftResult = team.owner_id === user.id ? await db.rpc("allot_agent_project_drafts", { team: id }) : { data: null, error: null };
  const projectDrafts: AgentProjectDraft[] = Array.isArray(projectDraftResult.data) ? projectDraftResult.data.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    if (typeof value.id !== "string" || typeof value.title !== "string" || typeof value.createdAt !== "string") return [];
    return [{ id: value.id, title: value.title, createdAt: value.createdAt,
      parentId: typeof value.parentId === "string" ? value.parentId : null,
      budgetUnits: typeof value.budgetUnits === "string" || typeof value.budgetUnits === "number" ? value.budgetUnits : null }];
  }) : [];
  const draftResult = team.owner_id === user.id ? await db.rpc("allot_agent_drafts", { team: id }) : { data: null, error: null };
  const activityResult = team.owner_id === user.id ? await db.rpc("allot_agent_activity", { team: id }) : { data: null, error: null };
  const agentDrafts: AgentDraft[] = Array.isArray(draftResult.data) ? draftResult.data.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const payload = paymentLinkSchema.safeParse(value.payload);
    if (!payload.success || typeof value.id !== "string" || !Array.isArray(value.recipientIds) ||
        !value.recipientIds.every((recipient) => typeof recipient === "string") || typeof value.createdAt !== "string") return [];
    return [{ id: value.id, payload: payload.data, recipientIds: value.recipientIds,
      baseAgreementId: typeof value.baseAgreementId === "string" ? value.baseAgreementId : null,
      createdAt: value.createdAt }];
  }) : [];
  const agentActivity: AgentActivity[] = Array.isArray(activityResult.data) ? activityResult.data.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const actions = ["credential_created", "credential_revoked", "agreement_read", "agreement_proposed", "approval_requested", "project_proposed"] as const;
    if (typeof value.id !== "number" || !actions.includes(value.action as typeof actions[number]) || typeof value.createdAt !== "string") return [];
    return [{ id: value.id, action: value.action as AgentActivity["action"],
      targetId: typeof value.targetId === "string" ? value.targetId : null, createdAt: value.createdAt }];
  }) : [];
  return <TeamWorkspace key={splits?.[0]?.id ?? id} team={team as Team} members={(members ?? []) as Member[]} splits={(splits ?? []) as Split[]} decisions={(decisions ?? []) as Decision[]} decisionEvents={(eventResult.data ?? []) as DecisionEvent[]} userId={user.id} agentDrafts={agentDrafts} agentActivity={agentActivity} agentReady={!draftResult.error && !activityResult.error} projects={(projectResult.data ?? []) as Project[]} projectsReady={!projectResult.error} projectDrafts={projectDrafts} />;
}
