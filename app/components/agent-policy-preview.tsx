"use client";

import { useState } from "react";

import { checkAgentPaymentPolicy, type AgentPolicyDecision } from "@/app/lib/agent-policy";
import { parseUsdc } from "@/app/lib/money";
import type { PaymentLink } from "@/app/lib/payment-link";

export function AgentPolicyPreview({ link }: { link: PaymentLink }) {
  const [result, setResult] = useState<AgentPolicyDecision | null>(null);
  const [error, setError] = useState("");

  function preview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setResult(null);
    const values = new FormData(event.currentTarget);
    try {
      const budgetUnits = parseUsdc(String(values.get("budget")));
      const maxTransactionUnits = parseUsdc(String(values.get("max")));
      const humanApprovalAboveUnits = parseUsdc(String(values.get("threshold")));
      const approvedRecipients = String(values.get("approved") ?? "").split(/\s+/u).filter(Boolean);
      const nowMs = Date.now();
      setResult(checkAgentPaymentPolicy({ budgetUnits, spentUnits: 0n, maxTransactionUnits,
        humanApprovalAboveUnits, approvedRecipients, expiresAtMs: nowMs + 60_000,
        settledRequestIds: [] }, { id: "preview-only", link, nowMs }));
    } catch { setError("Enter valid amounts of at least 1 test USDC."); }
  }

  return <details className="surface-panel"><summary className="cursor-pointer text-xl font-semibold">Preview agent payment policy</summary>
    <p className="notice-neutral mt-4 text-sm">Simulation only. Assumes zero prior spending and an active policy. It does not save limits, reserve funds, authorize an agent, or stop wallet payments.</p>
    <form className="mt-4 grid gap-3" onSubmit={preview}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="field-label">Budget · test USDC<input className="field-input" name="budget" inputMode="decimal" required placeholder="1000" /></label>
        <label className="field-label">Maximum transaction<input className="field-input" name="max" inputMode="decimal" required placeholder="500" /></label>
        <label className="field-label">Human review above<input className="field-input" name="threshold" inputMode="decimal" required placeholder="200" /></label>
      </div>
      <label className="field-label">Approved recipient wallet addresses, one per line<textarea className="field-input min-h-28" name="approved" required placeholder={link.recipients.map((recipient) => recipient.address).join("\n")} /></label>
      <button className="button-secondary justify-self-start">Check this proposal</button>
    </form>
    {error && <p role="alert" className="notice-error mt-3">{error}</p>}
    {result && <p role="status" className="notice-neutral mt-3 text-sm"><strong>{result.status.replaceAll("-", " ")}</strong> · {result.reason}</p>}
  </details>;
}
