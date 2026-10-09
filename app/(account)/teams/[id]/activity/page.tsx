import Link from "next/link";
import { notFound } from "next/navigation";

import type { AgentActivity } from "@/app/lib/teams";
import { requireAccount } from "@/app/lib/supabase-server";

const actions = ["credential_created", "credential_revoked", "agreement_read", "agreement_proposed", "approval_requested", "agreement_submitted", "project_proposed", "policy_updated", "payment_requested", "payment_approved", "payment_rejected", "payment_confirmed"] as const;

export default async function AgentActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const { db, user } = await requireAccount(`/teams/${id}/activity`);
  const { data: team, error: teamError } = await db.from("allot_teams").select("id,name,owner_id").eq("id", id).maybeSingle();
  if (teamError) return <p role="alert" className="notice-error mt-8">Could not load this team.</p>;
  if (!team) notFound();
  if (team.owner_id !== user.id) return <p role="alert" className="notice-error mt-8">Only the team owner can view agent activity.</p>;
  const { data, error } = await db.rpc("allot_agent_activity", { team: id });
  const events: AgentActivity[] = Array.isArray(data) ? data.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    if (typeof value.id !== "number" || !actions.includes(value.action as typeof actions[number]) || typeof value.createdAt !== "string") return [];
    return [{ id: value.id, action: value.action as AgentActivity["action"],
      targetId: typeof value.targetId === "string" ? value.targetId : null, createdAt: value.createdAt }];
  }) : [];

  return <div className="space-y-8">
    <header className="app-header"><Link href={`/teams/${id}`} className="back-link">← {team.name}</Link><h1 className="app-title mt-4">Agent activity</h1><p className="app-intro">Agent requests and owner decisions. Wallet signatures are verified in their receipts.</p></header>
    {error ? <p role="status" className="notice-neutral">Agent activity is unavailable. Refresh and try again.</p>
      : events.length ? <ol className="grid gap-3">{events.map((event) => <li className="surface-panel" key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong>{event.targetId ? <code className="ml-2 text-xs">{event.targetId}</code> : null}<time className="text-muted mt-2 block text-sm" dateTime={event.createdAt}>{event.createdAt.slice(0, 16).replace("T", " ")} UTC</time></li>)}</ol>
      : <p className="notice-neutral">No authenticated agent activity recorded yet.</p>}
  </div>;
}
