import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const getUser = vi.fn();
vi.mock("@/app/lib/supabase-server", () => ({ supabaseServer: async () => ({ rpc, auth: { getUser } }) }));
vi.mock("@/app/lib/receipt", () => ({ readReceiptDetails: vi.fn(), checkAgreementTransfers: vi.fn() }));
vi.mock("@/app/lib/solana-client", () => ({ client: {} }));

import { POST } from "./route";

const team = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";

function request(body: unknown, origin = "http://localhost") {
  return new NextRequest("http://localhost/api/agent/payment", { method: "POST",
    headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("agent payment owner boundary", () => {
  beforeEach(() => {
    rpc.mockReset(); getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { email_confirmed_at: "2026-10-08" } }, error: null });
  });

  it("rejects cross-origin mutations", async () => {
    expect((await POST(request({ action: "review", team, requestId, decision: "approve" }, "https://evil.test"))).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("persists parsed policy limits through the owner RPC", async () => {
    rpc.mockResolvedValue({ error: null });
    const response = await POST(request({ action: "configure", team, budget: "1000", maximum: "500",
      humanApprovalAbove: "200", recipientAddresses: ["11111111111111111111111111111111"],
      expiresAt: "2026-11-08T23:59:59.000Z" }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("allot_agent_policy_set", { team, budget_units: "1000000000",
      max_transaction_units: "500000000", human_approval_above_units: "200000000",
      recipient_addresses: ["11111111111111111111111111111111"], expires_at: "2026-11-08T23:59:59.000Z" });
  });

  it("allows only an authenticated owner RPC to approve or reject", async () => {
    rpc.mockResolvedValue({ error: null });
    const response = await POST(request({ action: "review", team, requestId, decision: "approve" }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("allot_agent_payment_review", { team, request: requestId, decision: "approve" });
  });
});
