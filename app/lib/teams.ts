import type { PaymentLink } from "./payment-link";

export type Team = { id: string; name: string; owner_id: string };
export type Member = { team_id: string; user_id: string; name: string };
export type Split = { id: string; team_id: string; payload: PaymentLink; recipient_ids: string[]; state: "pending" | "superseded" | "published"; share_id: string | null; project_id?: string | null; created_at: string };
export type Decision = { split_id: string; user_id: string; decision: "accepted" | "rejected" | "countered"; requested_bps: number | null };
export type DecisionEvent = Decision & { id: number; recorded_at: string };
export type AgentDraft = { id: string; payload: PaymentLink; recipientIds: string[]; baseAgreementId: string | null; createdAt: string };
export type AgentActivity = { id: number; action: "credential_created" | "credential_revoked" | "agreement_read" | "agreement_proposed" | "approval_requested" | "project_proposed"; targetId: string | null; createdAt: string };
export type Project = { id: string; team_id: string; parent_id: string | null; title: string; budget_units: string | number | null };
export type AgentProjectDraft = { id: string; parentId: string | null; title: string; budgetUnits: string | number | null; createdAt: string };

export async function teamAction(input: Record<string, unknown>) {
  const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not save this change.");
  return result as { id?: string; code?: string; expires_at?: string; share_id?: string };
}
