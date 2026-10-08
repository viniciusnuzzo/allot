import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
vi.mock("@/app/lib/supabase-server", () => ({ supabaseServer: () => Promise.resolve({
  auth: { getUser: () => Promise.resolve({ data: { user: { email_confirmed_at: "2026-10-07" } }, error: null }) }, rpc,
}) }));

import { POST } from "./route";

const team = "11111111-1111-4111-8111-111111111111";
const split = "22222222-2222-4222-8222-222222222222";
const project = "33333333-3333-4333-8333-333333333333";

describe("project linking boundary", () => {
  it("uses the owner-only database function with exact IDs", async () => {
    rpc.mockClear();
    const request = new NextRequest("http://localhost/api/projects/link", { method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ team, split, project }) });
    expect((await POST(request)).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("allot_project_link", { team, split, project });
  });
});
