"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatUsdc } from "@/app/lib/money";
import type { AgentPaymentPolicy, AgentPaymentRequest } from "@/app/lib/teams";

function amount(value: string | number) {
  return formatUsdc(BigInt(value));
}

export function AgentPaymentPolicyPanel({ teamId, policy, requests, recipientAddresses }: {
  teamId: string;
  policy: AgentPaymentPolicy | null;
  requests: AgentPaymentRequest[];
  recipientAddresses: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [defaultExpiry] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

  async function send(body: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/agent/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update agent payments.");
      router.refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not update agent payments."); }
    finally { setBusy(false); }
  }

  function configure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const addresses = String(values.get("recipients") ?? "").split(/\s+/u).filter(Boolean);
    const expires = String(values.get("expires"));
    void send({ action: "configure", team: teamId, budget: values.get("budget"), maximum: values.get("maximum"),
      humanApprovalAbove: values.get("threshold"), recipientAddresses: addresses,
      expiresAt: new Date(`${expires}T23:59:59.000Z`).toISOString() });
  }

  return <section className="surface-panel space-y-4" aria-labelledby="agent-policy-title">
    <div><h2 id="agent-policy-title" className="text-2xl font-semibold">Agent payment policy</h2>
      <p className="text-muted mt-2 text-sm">The policy reserves test-USDC budget when an agent requests payment. A person always signs in a wallet. Requests above the threshold also need owner approval.</p></div>
    <form className="grid gap-3" onSubmit={configure}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="field-label">Total budget · test USDC<input className="field-input" name="budget" required defaultValue={policy ? amount(policy.budgetUnits) : "1000.00"} /></label>
        <label className="field-label">Maximum per payment<input className="field-input" name="maximum" required defaultValue={policy ? amount(policy.maxTransactionUnits) : "500.00"} /></label>
        <label className="field-label">Owner approval above<input className="field-input" name="threshold" required defaultValue={policy ? amount(policy.humanApprovalAboveUnits) : "200.00"} /></label>
      </div>
      <label className="field-label">Policy expires<input className="field-input" name="expires" type="date" required defaultValue={policy?.expiresAt.slice(0, 10) ?? defaultExpiry} /></label>
      <label className="field-label">Authorized recipient wallets, one per line<textarea className="field-input min-h-28 font-mono text-xs" name="recipients" required defaultValue={(policy?.recipientAddresses.length ? policy.recipientAddresses : recipientAddresses).join("\n")} /></label>
      <button className="button-secondary justify-self-start" disabled={busy || recipientAddresses.length === 0}>{policy ? "Update policy" : "Activate policy"}</button>
    </form>
    {error && <p role="alert" className="notice-error">{error}</p>}
    {requests.length > 0 && <div className="space-y-3"><h3 className="font-semibold">Payment requests</h3>{requests.map((request) => <article className="data-row space-y-3" key={request.id}>
      <div className="flex flex-wrap justify-between gap-3"><span>{request.title} · {amount(request.amountUnits)} test USDC</span><strong>{request.state.replaceAll("_", " ")}</strong></div>
      <div className="flex flex-wrap gap-3">
        {request.state === "pending_approval" && <><button className="button-primary text-sm" disabled={busy} onClick={() => void send({ action: "review", team: teamId, requestId: request.id, decision: "approve" })}>Approve request</button><button className="button-danger text-sm" disabled={busy} onClick={() => void send({ action: "review", team: teamId, requestId: request.id, decision: "reject" })}>Reject</button></>}
        {request.state === "ready_to_sign" && request.shareId && <Link className="button-primary text-sm" href={`/pagar?s=${request.shareId}&request=${request.id}`}>Review and sign</Link>}
        {request.state === "confirmed" && request.signature && <Link className="button-secondary text-sm" href={`/r/${request.signature}`}>Open receipt</Link>}
      </div>
    </article>)}</div>}
  </section>;
}
