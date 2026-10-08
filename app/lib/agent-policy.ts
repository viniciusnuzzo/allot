import { parseUsdc } from "./money";
import { paymentLinkSchema, type PaymentLink } from "./payment-link";

export type AgentPolicy = {
  budgetUnits: bigint;
  spentUnits: bigint;
  maxTransactionUnits: bigint;
  humanApprovalAboveUnits: bigint;
  approvedRecipients: readonly string[];
  expiresAtMs: number;
  settledRequestIds: readonly string[];
};

export type AgentPolicyDecision =
  | { status: "blocked"; reason: string }
  | { status: "human-approval-required"; reason: string }
  | { status: "wallet-review-required"; reason: string };

// The caller must load policy, spending, and settled IDs from trusted storage.
// A passing result never signs or submits a transaction.
export function checkAgentPaymentPolicy(
  policy: AgentPolicy,
  request: { id: string; link: PaymentLink; nowMs: number },
): AgentPolicyDecision {
  if (!request.id.trim() || policy.settledRequestIds.includes(request.id)) {
    return { status: "blocked", reason: "Payment request already used or missing." };
  }
  if (!Number.isSafeInteger(policy.expiresAtMs) ||
      !Number.isSafeInteger(request.nowMs) || request.nowMs >= policy.expiresAtMs) {
    return { status: "blocked", reason: "Agent permission expired." };
  }
  if (policy.budgetUnits < 0n || policy.spentUnits < 0n ||
      policy.maxTransactionUnits < 0n || policy.humanApprovalAboveUnits < 0n) {
    return { status: "blocked", reason: "Agent policy is invalid." };
  }
  const link = paymentLinkSchema.safeParse(request.link);
  if (!link.success || link.data.amount === null) {
    return { status: "blocked", reason: "A valid fixed payment amount is required." };
  }
  const amount = parseUsdc(link.data.amount);
  if (amount > policy.maxTransactionUnits) {
    return { status: "blocked", reason: "Payment exceeds the transaction limit." };
  }
  if (policy.budgetUnits < amount ||
      policy.spentUnits > policy.budgetUnits - amount) {
    return { status: "blocked", reason: "Payment exceeds the remaining budget." };
  }
  const approved = new Set(policy.approvedRecipients);
  if (link.data.recipients.some((recipient) => !approved.has(recipient.address))) {
    return { status: "blocked", reason: "Recipient is not approved." };
  }
  if (amount > policy.humanApprovalAboveUnits) {
    return { status: "human-approval-required", reason: "A person must approve this payment." };
  }
  return { status: "wallet-review-required", reason: "A person must sign in a wallet." };
}
