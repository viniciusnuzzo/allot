import { describe, expect, it } from "vitest";

import { checkAgentPaymentPolicy, type AgentPolicy } from "./agent-policy";
import type { PaymentLink } from "./payment-link";

const payer = "11111111111111111111111111111111";
const second = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const link: PaymentLink = {
  v: 1,
  title: "Campaign",
  amount: "400.00",
  recipients: [
    { name: "A", address: payer, bps: 5000 },
    { name: "B", address: second, bps: 5000 },
  ],
};
const policy: AgentPolicy = {
  budgetUnits: 1_000_000_000n,
  spentUnits: 500_000_000n,
  maxTransactionUnits: 500_000_000n,
  humanApprovalAboveUnits: 300_000_000n,
  approvedRecipients: [payer, second],
  expiresAtMs: 2_000_000_000_000,
  settledRequestIds: ["already-paid"],
};

describe("checkAgentPaymentPolicy", () => {
  const request = { id: "campaign-1", link, nowMs: 1_900_000_000_000 };

  it("requires human approval above the threshold, and wallet review below it", () => {
    expect(checkAgentPaymentPolicy(policy, request).status).toBe("human-approval-required");
    expect(checkAgentPaymentPolicy(policy, {
      ...request,
      link: { ...link, amount: "300.00" },
    }).status).toBe("wallet-review-required");
  });

  it.each([
    ["replay", { ...request, id: "already-paid" }, policy],
    ["expired", { ...request, nowMs: policy.expiresAtMs }, policy],
    ["budget", { ...request, link: { ...link, amount: "500.01" } }, { ...policy, maxTransactionUnits: 600_000_000n }],
    ["limit", { ...request, link: { ...link, amount: "500.01" } }, policy],
    ["recipient", { ...request, link: { ...link, recipients: [{ ...link.recipients[0], address: "ComputeBudget111111111111111111111111111111" }, link.recipients[1]] } }, policy],
    ["variable amount", { ...request, link: { ...link, amount: null } }, policy],
  ] satisfies Array<[string, typeof request, AgentPolicy]>)("blocks %s", (_label, candidate, limits) => {
    expect(checkAgentPaymentPolicy(limits, candidate).status).toBe("blocked");
  });
});
