import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
vi.mock("@/app/lib/supabase-server", () => ({ supabaseServer: () => Promise.resolve({
  auth: { getUser: () => Promise.resolve({ data: { user: { email_confirmed_at: "2026-10-07" } }, error: null }) }, rpc,
}) }));

import { POST } from "./route";

const team = "11111111-1111-4111-8111-111111111111";
const draft = "22222222-2222-4222-8222-222222222222";

describe("owner project draft decision", () => {
  it("routes rejection to the owner-only database function", async () => {
    rpc.mockClear();
    const request = new NextRequest("http://localhost/api/projects/draft", { method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ team, draft, decision: "reject" }) });
    expect((await POST(request)).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("allot_agent_project_reject", { team, draft });
  });
});
