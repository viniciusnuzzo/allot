"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreatePaymentForm } from "./create-payment-form";
import { LogoutButton } from "./team-dashboard";
import { teamAction, type Team, type Member, type Split, type Decision } from "@/app/lib/teams";

export function TeamWorkspace({ team, members, splits, decisions, userId }: { team: Team; members: Member[]; splits: Split[]; decisions: Decision[]; userId: string }) {
  const router = useRouter();
  const owner = team.owner_id === userId;
  const pending = splits.find((split) => split.state === "pending");
  const initial = splits[0]?.recipient_ids.every((id) => members.some((member) => member.user_id === id)) ? splits[0] : undefined;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<{ code: string; url: string; expires: string } | null>(null);
  const [copied, setCopied] = useState("");

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
    <section className="surface-panel space-y-5" aria-labelledby="members-title">
      <div className="flex flex-wrap justify-between items-center gap-4"><h2 id="members-title" className="text-2xl font-semibold">Team members</h2>{owner && <button className="button-secondary" disabled={busy} onClick={() => { void change({ action: "invite" }).catch(() => {}); }}>{invite ? "Replace invitation code" : "Create invitation"}</button>}</div>
      <ul className="space-y-3">{members.map((member) => <li className="flex flex-wrap justify-between items-center gap-3" key={member.user_id}><span>{member.name} <span className="text-muted text-sm">· {member.user_id.slice(0, 6)}{member.user_id === team.owner_id ? " · Owner" : ""}{member.user_id === userId ? " · You" : ""}</span></span>{owner && member.user_id !== userId && <button className="button-danger text-sm" disabled={busy} onClick={() => { void change({ action: "remove", user_id: member.user_id }).then(() => setInvite(null)).catch(() => {}); }}>Remove member</button>}</li>)}</ul>
      {invite && <div className="notice-neutral space-y-3"><p>Anyone with this invitation can join after confirming their account. It expires {new Date(invite.expires).toLocaleDateString("en-US")}. Replacing it invalidates the previous code.</p><label className="field-label">Invitation code<input className="field-input font-mono" readOnly value={invite.code} /></label><label className="field-label">Invitation link<input className="field-input" readOnly value={invite.url} /></label><div className="flex flex-wrap gap-3"><button className="button-secondary" onClick={() => void copy(invite.code, "code")}>{copied === "code" ? "Copied code" : "Copy code"}</button><button className="button-secondary" onClick={() => void copy(invite.url, "invite")}>{copied === "invite" ? "Copied link" : "Copy link"}</button></div></div>}
    </section>
    {pending && <section className="surface-panel space-y-5" aria-labelledby="approval-title">
      <div><p className="text-muted text-sm">Awaiting approval · Version {pending.id.slice(0, 8)}</p><h2 id="approval-title" className="text-2xl font-semibold mt-2">{pending.payload.title}</h2><p className="mt-2">{pending.payload.amount ? `${pending.payload.amount} test USDC` : "The payer chooses the amount. You approve the percentages below."}</p></div>
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
    {owner && members.length < 2 && <p className="notice-neutral">Invite at least one other member before proposing a split.</p>}
    {owner && members.length >= 2 && (!pending || editing) && <section aria-labelledby="editor-title"><h2 id="editor-title" className="text-2xl font-semibold mb-5">{initial ? "Propose a new version" : "Propose a split"}</h2><CreatePaymentForm key={`${initial?.id ?? "new"}-${members.length}`} members={members} initial={initial} onSubmit={async (payload, recipient_ids) => { await change({ action: "submit", payload, recipient_ids }); }} /></section>}
    {!owner && !pending && <p className="notice-neutral">No split is awaiting approval. Your team owner can submit one.</p>}
    <section className="space-y-4" aria-labelledby="history-title"><h2 id="history-title" className="text-2xl font-semibold">Published payments</h2>{splits.filter((split) => split.state === "published").map((split) => <article className="surface-panel space-y-3" key={split.id}><h3 className="text-xl font-semibold">{split.payload.title}</h3><p className="text-muted text-sm">Every recipient accepted this version. The link keeps this approved split, even if a later version changes.</p><Link href={`/pagar?s=${split.share_id}`} className="underline break-all">Open approved payment</Link><button className="button-secondary block" onClick={() => void copy(`${window.location.origin}/pagar?s=${split.share_id}`, split.id)}>{copied === split.id ? "Copied!" : "Copy payment link"}</button></article>)}{!splits.some((split) => split.state === "published") && <p className="text-muted">No approved payment links yet.</p>}</section>
  </div>;
}
