import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const getUser = vi.fn();
vi.mock("@/app/lib/supabase-server", () => ({ supabaseServer: () => Promise.resolve({ auth: { getUser }, rpc }) }));

import { POST } from "./route";

const team = "11111111-1111-4111-8111-111111111111";
function request(body: unknown, origin = "http://localhost") {
  return new NextRequest("http://localhost/api/projects", { method: "POST", headers: {
    origin, "content-type": "application/json",
  }, body: JSON.stringify(body) });
}

describe("project creation boundary", () => {
  beforeEach(() => {
    rpc.mockReset(); getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { email_confirmed_at: "2026-10-07" } }, error: null });
    rpc.mockResolvedValue({ data: "project-id", error: null });
  });

  it("rejects cross-origin and invalid budgets before any database mutation", async () => {
    expect((await POST(request({ team, parent: null, title: "Campaign", budget: "100" }, "https://evil.example"))).status).toBe(403);
    expect((await POST(request({ team, parent: null, title: "Campaign", budget: "bad" }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("passes exact test-USDC units to the owner-only database function", async () => {
    const response = await POST(request({ team, parent: null, title: " Campaign ", budget: "100.25" }));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("allot_project_create", {
      team, parent: null, title: "Campaign", budget_units: "100250000",
    });
  });
});
