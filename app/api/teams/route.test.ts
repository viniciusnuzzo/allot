import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/app/lib/supabase-server", () => ({ supabaseServer: () => Promise.resolve({
  auth: { getUser: () => Promise.resolve({ data: { user: { email_confirmed_at: "2026-10-08" } }, error: null }) }, rpc,
}) }));

import { POST } from "./route";

const team = "11111111-1111-4111-8111-111111111111";
const draftId = "22222222-2222-4222-8222-222222222222";
const recipient_ids = [team, draftId];
const payload = { v: 1, title: "Campaign", amount: "100.00", recipients: [
  { name: "A", address: "11111111111111111111111111111111", bps: 5000 },
  { name: "B", address: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", bps: 5000 },
] };

function request(body: unknown, origin = "http://localhost") {
  return new NextRequest("http://localhost/api/teams", { method: "POST",
    headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("agent draft submission", () => {
  beforeEach(() => { rpc.mockReset().mockResolvedValue({ data: { id: draftId }, error: null }); });

  it("binds reviewed drafts to the owner-only submission RPC", async () => {
    const result = await POST(request({ action: "submit_agent_draft", team, draftId, payload, recipient_ids }));
    expect(result.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("allot_agent_draft_submit", {
      team, draft: draftId, payload, recipient_ids,
    });
  });

  it("rejects external origins and malformed drafts before the database", async () => {
    expect((await POST(request({ action: "submit_agent_draft", team, draftId, payload, recipient_ids }, "https://other.example"))).status).toBe(403);
    expect((await POST(request({ action: "submit_agent_draft", team, draftId: "bad", payload, recipient_ids }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
