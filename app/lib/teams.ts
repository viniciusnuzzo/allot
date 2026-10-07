import type { PaymentLink } from "./payment-link";

export type Team = { id: string; name: string; owner_id: string };
export type Member = { team_id: string; user_id: string; name: string };
export type Split = { id: string; team_id: string; payload: PaymentLink; recipient_ids: string[]; state: "pending" | "superseded" | "published"; share_id: string | null; created_at: string };
export type Decision = { split_id: string; user_id: string; decision: "accepted" | "rejected" | "countered"; requested_bps: number | null };

export async function teamAction(input: Record<string, unknown>) {
  const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not save this change.");
  return result as { id?: string; code?: string; expires_at?: string; share_id?: string };
}
