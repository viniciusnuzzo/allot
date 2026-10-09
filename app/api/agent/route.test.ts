import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));

import { POST } from "./route";

const secret = "a".repeat(64);
const team = "11111111-1111-4111-8111-111111111111";
const agreementId = "22222222-2222-4222-8222-222222222222";

function request(body: unknown, authorization = `Bearer ${secret}`) {
  return new NextRequest("http://localhost/api/agent", { method: "POST",
    headers: { authorization, "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("agent API boundary", () => {
  beforeEach(() => {
    rpc.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  });

  it("rejects missing credentials and invalid inputs before calling the database", async () => {
    expect((await POST(request({ action: "get_agreement", team, agreementId }, ""))).status).toBe(401);
    expect((await POST(request({ action: "approve_agreement", team, agreementId }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("permits only scoped read and draft proposal RPCs", async () => {
    rpc.mockResolvedValueOnce({ data: { id: agreementId, state: "pending" }, error: null })
      .mockResolvedValueOnce({ data: agreementId, error: null })
      .mockResolvedValueOnce({ data: agreementId, error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    const read = await POST(request({ action: "get_agreement", team, agreementId }));
    expect(read.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("allot_agent_get", { secret, team, split: agreementId });
    const proposal = await POST(request({ action: "create_agreement", team,
      payload: { v: 1, title: "Campaign", amount: "100.00", recipients: [
        { name: "A", address: "11111111111111111111111111111111", bps: 5000 },
        { name: "B", address: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", bps: 5000 },
      ] }, recipientIds: [team, agreementId] }));
    expect(proposal.status).toBe(200);
    expect(await proposal.json()).toMatchObject({ status: "awaiting-human-submission" });
    expect(rpc.mock.calls[1][0]).toBe("allot_agent_propose");
    const change = await POST(request({ action: "propose_change", team, agreementId,
      payload: { v: 1, title: "Campaign v2", amount: "100.00", recipients: [
        { name: "A", address: "11111111111111111111111111111111", bps: 4000 },
        { name: "B", address: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", bps: 6000 },
      ] }, recipientIds: [team, agreementId] }));
    expect(change.status).toBe(200);
    expect(rpc.mock.calls[2][1]).toMatchObject({ base: agreementId });
    const approval = await POST(request({ action: "request_approval", team, draftId: agreementId }));
    expect(approval.status).toBe(200);
    expect(await approval.json()).toMatchObject({ status: "awaiting-human-submission" });
    expect(rpc.mock.calls[3]).toEqual(["allot_agent_request_approval", { secret, team, draft: agreementId }]);
  });

  it("lets an agent suggest a project but never creates it directly", async () => {
    rpc.mockResolvedValue({ data: agreementId, error: null });
    const result = await POST(request({ action: "create_project", team, parent: null,
      title: "Campaign", budget: "100.00" }));
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ status: "awaiting-human-creation" });
    expect(rpc).toHaveBeenCalledWith("allot_agent_project_propose", {
      secret, team, parent: null, title: "Campaign", budget_units: "100000000",
    });
  });

  it("creates idempotent policy-gated payment requests and returns a human signing URL", async () => {
    rpc.mockResolvedValueOnce({ data: { id: agreementId, state: "ready_to_sign", shareId: team }, error: null })
      .mockResolvedValueOnce({ data: { id: agreementId, state: "confirmed", signature: "5".repeat(88) }, error: null });
    const created = await POST(request({ action: "request_payment", team, agreementId, idempotencyKey: "campaign-42" }));
    expect(created.status).toBe(200);
    expect(await created.json()).toMatchObject({ paymentUrl: `http://localhost/pagar?s=${team}&request=${agreementId}` });
    expect(rpc).toHaveBeenCalledWith("allot_agent_payment_request", {
      secret, team, split: agreementId, idempotency_key: "campaign-42",
    });
    const status = await POST(request({ action: "get_payment_request", team, requestId: agreementId }));
    expect(status.status).toBe(200);
    expect(rpc).toHaveBeenLastCalledWith("allot_agent_payment_get", { secret, team, request: agreementId });
  });
});
