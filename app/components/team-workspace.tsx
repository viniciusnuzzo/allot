"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreatePaymentForm } from "./create-payment-form";
import { ProjectPlanning } from "./project-planning";
import { AgentPolicyPreview } from "./agent-policy-preview";
import { LogoutButton } from "./team-dashboard";
import { agreementChanges } from "@/app/lib/agreement-diff";
import { teamAction, type AgentActivity, type AgentDraft, type AgentProjectDraft, type Team, type Member, type Split, type Decision, type DecisionEvent, type Project } from "@/app/lib/teams";

export function TeamWorkspace({ team, members, splits, decisions, decisionEvents, userId, agentDrafts, agentActivity, agentReady, projects, projectsReady, projectDrafts }: { team: Team; members: Member[]; splits: Split[]; decisions: Decision[]; decisionEvents: DecisionEvent[]; userId: string; agentDrafts: AgentDraft[]; agentActivity: AgentActivity[]; agentReady: boolean; projects: Project[]; projectsReady: boolean; projectDrafts: AgentProjectDraft[] }) {
  const router = useRouter();
  const owner = team.owner_id === userId;
  const pending = splits.find((split) => split.state === "pending");
  const previousVersion = pending ? splits.find((split) => split.id !== pending.id) : undefined;
  const changes = pending && previousVersion ? agreementChanges(previousVersion, pending) : [];
  const initial = splits[0]?.recipient_ids.every((id) => members.some((member) => member.user_id === id)) ? splits[0] : undefined;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<{ code: string; url: string; expires: string } | null>(null);
  const [copied, setCopied] = useState("");
  const [agentToken, setAgentToken] = useState("");
  const [selectedDraft, setSelectedDraft] = useState<AgentDraft | undefined>();

  async function changeAgentAccess(method: "POST" | "DELETE") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/agent/token", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team: team.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not change agent access.");
      setAgentToken(method === "POST" ? result.token : "");
      router.refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not change agent access."); }
    finally { setBusy(false); }
  }

  async function linkProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const project = new FormData(event.currentTarget).get("project");
      const response = await fetch("/api/projects/link", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team: team.id,
          split: pending?.id, project: project || null }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not link project.");
      router.refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not link project."); }
    finally { setBusy(false); }
  }

  async function change(input: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const result = await teamAction({ ...input, team: team.id });
      if (input.action === "invite" && result.code) setInvite({ code: result.code, url: `${window.location.origin}/join?code=${result.code}`, expires: result.expires_at ?? "" });
      else { setEditing(false); router.refresh(); }
      return result;
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not save this change."); throw problem; }
    finally { setBusy(false); }
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); }
    catch { setError("Could not copy. Select the link or code and copy it manually."); }
  }
  return <div className="space-y-8">
    <header className="app-header flex flex-wrap justify-between items-center gap-4"><div><Link href="/teams" className="back-link">← All teams</Link><h1 className="app-title mt-4 break-words">{team.name}</h1><p className="app-intro">{owner ? "Propose the split. Publish after everyone accepts." : "Review the split and accept, reject, or request an adjustment."}</p></div><div className="flex flex-wrap gap-3"><button className="button-secondary" disabled={busy} onClick={() => router.refresh()}>Refresh approvals</button><LogoutButton /></div></header>
    {error && <p role="alert" className="notice-error">{error}</p>}
    <ProjectPlanning teamId={team.id} owner={owner} projects={projects} ready={projectsReady} drafts={projectDrafts} />
    <section className="surface-panel space-y-5" aria-labelledby="members-title">
      <div className="flex flex-wrap justify-between items-center gap-4"><h2 id="members-title" className="text-2xl font-semibold">Team members</h2>{owner && <button className="button-secondary" disabled={busy} onClick={() => { void change({ action: "invite" }).catch(() => {}); }}>{invite ? "Replace invitation code" : "Create invitation"}</button>}</div>
      <ul className="space-y-3">{members.map((member) => <li className="flex flex-wrap justify-between items-center gap-3" key={member.user_id}><span>{member.name} <span className="text-muted text-sm">· {member.user_id.slice(0, 6)}{member.user_id === team.owner_id ? " · Owner" : ""}{member.user_id === userId ? " · You" : ""}</span></span>{owner && member.user_id !== userId && <button className="button-danger text-sm" disabled={busy} onClick={() => { void change({ action: "remove", user_id: member.user_id }).then(() => setInvite(null)).catch(() => {}); }}>Remove member</button>}</li>)}</ul>
      {invite && <div className="notice-neutral space-y-3"><p>Anyone with this invitation can join after confirming their account. It expires {new Date(invite.expires).toLocaleDateString("en-US")}. Replacing it invalidates the previous code.</p><label className="field-label">Invitation code<input className="field-input font-mono" readOnly value={invite.code} /></label><label className="field-label">Invitation link<input className="field-input" readOnly value={invite.url} /></label><div className="flex flex-wrap gap-3"><button className="button-secondary" onClick={() => void copy(invite.code, "code")}>{copied === "code" ? "Copied code" : "Copy code"}</button><button className="button-secondary" onClick={() => void copy(invite.url, "invite")}>{copied === "invite" ? "Copied link" : "Copy link"}</button></div></div>}
    </section>
    {owner && <section className="surface-panel space-y-4" aria-labelledby="agent-title">
      <div><h2 id="agent-title" className="text-2xl font-semibold">Agent proposals</h2><p className="text-muted mt-2 text-sm">A team-scoped agent credential can only read agreements and suggest a draft. It cannot accept, publish, or sign payments. You review and submit every draft yourself.</p></div>
      {!agentReady && <p role="status" className="notice-neutral">Agent access is not installed in this database yet. Apply the reviewed agent-drafts migration before using it.</p>}
      <div className="flex flex-wrap gap-3"><button className="button-secondary" disabled={busy || !agentReady} onClick={() => void changeAgentAccess("POST")}>Create 7-day agent credential</button><button className="button-danger" disabled={busy || !agentReady} onClick={() => void changeAgentAccess("DELETE")}>Revoke all agent credentials</button></div>
      {agentToken && <label className="field-label">New credential — shown only now. Keep it out of chat and public files.<input className="field-input font-mono text-xs" value={agentToken} readOnly onFocus={(event) => event.target.select()} /></label>}
      <div className="notice-neutral text-sm"><strong>Permissions</strong><p className="mt-1">Agent: read and propose. Recipients: approve their own share. Owner: submit and publish. Payer: sign in their wallet.</p></div>
      {agentDrafts.length > 0 && <div className="space-y-3"><h3 className="font-semibold">Drafts awaiting your review</h3>{agentDrafts.map((draft) => <article className="data-row" key={draft.id}><div className="flex flex-wrap justify-between gap-3"><span>Draft · {draft.payload.title} · {draft.payload.amount ?? "Amount set by payer"} test USDC{draft.baseAgreementId ? ` · Revises ${draft.baseAgreementId.slice(0, 8)}` : ""}</span><button className="button-secondary text-sm" disabled={draft.recipientIds.some((id) => !members.some((member) => member.user_id === id))} onClick={() => { setSelectedDraft(draft); setEditing(true); }}>Review and edit draft</button></div><p className="text-muted mt-2 text-sm">Suggested by an agent; no recipient has approved it. Review addresses and percentages before submitting.</p></article>)}</div>}
      <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Agent activity</h3><Link className="button-secondary text-sm" href={`/teams/${team.id}/activity`}>Open full activity</Link></div>{agentActivity.length ? <ol className="grid gap-2 text-sm">{agentActivity.slice(0, 3).map((event) => <li className="data-row" key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong>{event.targetId ? ` · ${event.targetId.slice(0, 8)}` : ""}<time className="text-muted ml-2" dateTime={event.createdAt}>{event.createdAt.slice(0, 16).replace("T", " ")} UTC</time></li>)}</ol> : <p className="text-muted text-sm">No authenticated agent activity recorded yet.</p>}</div>
    </section>}
    {pending && <section className="surface-panel space-y-5" aria-labelledby="approval-title">
      <div><p className="text-muted text-sm">{decisions.some((decision) => decision.split_id === pending.id && decision.decision !== "accepted") ? "Negotiating" : "Pending approval"} · Version {pending.id.slice(0, 8)}</p><h2 id="approval-title" className="text-2xl font-semibold mt-2">{pending.payload.title}</h2><p className="mt-2">{pending.payload.amount ? `${pending.payload.amount} test USDC` : "The payer chooses the amount. You approve the percentages below."}</p></div>
      {pending.project_id && <p className="text-muted text-sm">Project: {projects.find((project) => project.id === pending.project_id)?.title ?? pending.project_id}</p>}
      {owner && projectsReady && projects.length > 0 && !decisions.some((decision) => decision.split_id === pending.id) && <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => void linkProject(event)}><label className="field-label">Plan under project<select className="field-input" name="project" defaultValue={pending.project_id ?? ""}><option value="">No project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label><button className="button-secondary" disabled={busy}>Save project link</button><p className="w-full text-muted text-sm">Choose before recipients decide. The project budget is planning only, not a payment limit.</p></form>}
      {previousVersion && <div className="notice-neutral text-sm"><strong>Changed from the previous version</strong>{changes.length ? <ul className="mt-2 list-disc pl-5">{changes.map((change) => <li key={change}>{change}</li>)}</ul> : <p className="mt-2">No payment terms changed. This is still a new version requiring fresh approval.</p>}</div>}
      <ul className="grid gap-4">{pending.payload.recipients.map((recipient, index) => {
        const id = pending.recipient_ids[index];
        const member = members.find((member) => member.user_id === id);
        const decision = decisions.find((decision) => decision.split_id === pending.id && decision.user_id === id);
        return <li key={id} className="data-row"><div className="flex flex-wrap justify-between gap-3"><strong>{recipient.name || member?.name || "Member"}{id === userId ? " · You" : ""}</strong><strong>{(recipient.bps / 100).toFixed(2)}%</strong></div><code className="block break-all text-xs mt-3">{recipient.address}</code><p className="text-sm mt-3">{!member ? "Member removed — this split cannot be published." : decision?.decision === "countered" ? `Requested adjustment: ${(decision.requested_bps! / 100).toFixed(2)}%` : decision?.decision ?? "Pending"}</p></li>;
      })}</ul>
      <p className="notice-neutral text-sm">Check every wallet address and the full split before accepting. The payment title and transfers will be public on Solana Devnet.</p>
      {pending.recipient_ids.includes(userId) && <div className="space-y-4"><div className="flex flex-wrap gap-3"><button className="button-primary" disabled={busy} onClick={() => { void change({ action: "decide", split: pending.id, decision: "accepted" }).catch(() => {}); }}>Accept my share</button><button className="button-danger" disabled={busy} onClick={() => { void change({ action: "decide", split: pending.id, decision: "rejected" }).catch(() => {}); }}>Reject</button></div><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
        event.preventDefault();
        const requested_bps = Math.round(Number(new FormData(event.currentTarget).get("percentage")) * 100);
        void change({ action: "decide", split: pending.id, decision: "countered", requested_bps }).catch(() => {});
      }}><label className="field-label">My requested percentage<input className="field-input" name="percentage" type="number" min="0.01" max="100" step="0.01" required placeholder="e.g. 20" /></label><button className="button-secondary" disabled={busy}>Request adjustment</button></form></div>}
      {owner && <div className="border-t border-black/20 pt-5 flex flex-wrap gap-3"><button className="button-secondary" disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Close editor" : "Revise split"}</button><button className="button-primary" disabled={busy || !pending.recipient_ids.every((id) => members.some((member) => member.user_id === id) && decisions.some((decision) => decision.split_id === pending.id && decision.user_id === id && decision.decision === "accepted"))} onClick={() => { void change({ action: "publish", split: pending.id }).catch(() => {}); }}>Generate payment link</button><p className="w-full text-muted text-sm">All recipients must accept this version. Revising any detail resets every approval.</p></div>}
    </section>}
    {owner && pending?.payload.amount && <AgentPolicyPreview link={pending.payload} />}
    {owner && members.length < 2 && <p className="notice-neutral">Invite at least one other member before proposing a split.</p>}
    {owner && members.length >= 2 && (!pending || editing) && <section aria-labelledby="editor-title"><h2 id="editor-title" className="text-2xl font-semibold mb-5">{selectedDraft ? "Review agent draft" : initial ? "Propose a new version" : "Propose a split"}</h2><CreatePaymentForm key={`${selectedDraft?.id ?? initial?.id ?? "new"}-${members.length}`} members={members} initial={initial} proposal={selectedDraft} onSubmit={async (payload, recipient_ids) => { await change({ action: "submit", payload, recipient_ids }); setSelectedDraft(undefined); }} /></section>}
    {!owner && !pending && <p className="notice-neutral">No split is awaiting approval. Your team owner can submit one.</p>}
    {splits.some((split) => split.state === "superseded") && <section className="space-y-4" aria-labelledby="versions-title"><h2 id="versions-title" className="text-2xl font-semibold">Previous versions</h2><p className="text-muted text-sm">Approvals shown here are historical. They do not approve the current version.</p>{splits.filter((split) => split.state === "superseded").map((split) => <details className="surface-panel" key={split.id}><summary className="cursor-pointer font-semibold">{split.payload.title} · Version {split.id.slice(0, 8)} · Replaced</summary><ul className="mt-4 grid gap-2 text-sm">{split.payload.recipients.map((recipient, index) => { const decision = decisions.find((item) => item.split_id === split.id && item.user_id === split.recipient_ids[index]); return <li className="data-row" key={split.recipient_ids[index]}><div className="flex justify-between gap-3"><span>{recipient.name || `Person ${index + 1}`}</span><span>{(recipient.bps / 100).toFixed(2)}% · {decision?.decision ?? "No decision"}</span></div><code className="mt-2 block break-all text-xs">{recipient.address}</code></li>; })}</ul></details>)}</section>}
    {decisionEvents.length > 0 && <section className="surface-panel space-y-3" aria-labelledby="decision-timeline-title"><h2 id="decision-timeline-title" className="text-2xl font-semibold">Decision timeline</h2><p className="text-muted text-sm">Recorded changes to recipient decisions. A new version always needs new approvals.</p><ol className="grid gap-2 text-sm">{decisionEvents.map((event) => <li className="data-row" key={event.id}><strong>{members.find((member) => member.user_id === event.user_id)?.name ?? event.user_id.slice(0, 8)}</strong> · {event.decision}{event.requested_bps ? ` · requested ${(event.requested_bps / 100).toFixed(2)}%` : ""} · version {event.split_id.slice(0, 8)}<time className="text-muted ml-2" dateTime={event.recorded_at}>{event.recorded_at.slice(0, 16).replace("T", " ")} UTC</time></li>)}</ol></section>}
    <section className="space-y-4" aria-labelledby="history-title"><h2 id="history-title" className="text-2xl font-semibold">Approved agreements</h2>{splits.filter((split) => split.state === "published").map((split) => <article className="surface-panel space-y-3" key={split.id}><h3 className="text-xl font-semibold">{split.payload.title}</h3><p className="text-muted text-sm">Approved · Every recipient accepted this version. A confirmed Devnet receipt is the separate paid status.</p><Link href={`/pagar?s=${split.share_id}`} className="underline break-all">Open approved payment</Link><button className="button-secondary block" onClick={() => void copy(`${window.location.origin}/pagar?s=${split.share_id}`, split.id)}>{copied === split.id ? "Copied!" : "Copy payment link"}</button></article>)}{!splits.some((split) => split.state === "published") && <p className="text-muted">No approved agreements yet.</p>}</section>
  </div>;
}
